import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';

// Routes
import todayRouter from './routes/today';
import adsRouter from './routes/ads';
import journalRouter from './routes/journal';
import pushRouter from './routes/push';
import partnersRouter from './routes/partners';
import stripeRouter from './routes/stripe';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Pro subscription check middleware
app.use('*', async (c, next) => {
  const userId = c.req.header('x-user-id');

  if (userId) {
    const subscription = await c.env.DB.prepare(
      `SELECT status, current_period_end
       FROM subscriptions
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 1`
    )
      .bind(parseInt(userId, 10))
      .first();

    if (
      subscription &&
      subscription.status === 'active' &&
      subscription.current_period_end * 1000 > Date.now()
    ) {
      c.set('isPro', true);
    }
  }

  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: '365 Days of Weed API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.route('/api/today', todayRouter);
app.route('/api/ads', adsRouter);
app.route('/api/journal', journalRouter);
app.route('/api/push', pushRouter);
app.route('/api/partners', partnersRouter);
app.route('/api/stripe', stripeRouter);

// Coupon redirect
app.get('/c/:code', async (c) => {
  const code = c.req.param('code');

  // Fetch coupon details
  const coupon = await c.env.DB.prepare(
    'SELECT * FROM coupons WHERE code = ? AND status = "active"'
  )
    .bind(code)
    .first();

  if (!coupon) {
    return c.text('Coupon not found', 404);
  }

  // Get campaign to find target URL
  const campaign = await c.env.DB.prepare(
    'SELECT * FROM campaigns WHERE id = ?'
  )
    .bind(coupon.campaign_id)
    .first();

  if (!campaign) {
    return c.text('Campaign not found', 404);
  }

  // Log the click
  await c.env.DB.prepare(
    'INSERT INTO ad_impressions(ad_id, date, event_type) VALUES (?, ?, ?)'
  )
    .bind(coupon.campaign_id, new Date().toISOString().slice(0, 10), 'click')
    .run();

  // Redirect to partner site with coupon code
  // In production, get target_url from campaign/creative
  const targetUrl = `https://partner.example.com?coupon=${code}`;
  return c.redirect(targetUrl);
});

// SSR/SEO endpoints
app.get('/', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>365 Days of Weed - Daily Cannabis Education</title>
  <meta name="description" content="Daily cannabis education, wellness tracking, and community insights">
</head>
<body>
  <h1>365 Days of Weed</h1>
  <p>Daily cannabis education, wellness tracking, and community insights.</p>
  <p><a href="/api/today">View Today's Content</a></p>
</body>
</html>
  `);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
    },
    500
  );
});

// Export Worker
export default app;

// Durable Object export (if needed)
export { RateLimiter } from './durable';
