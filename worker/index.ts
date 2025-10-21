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
import streaksRouter from './routes/streaks';
import achievementsRouter from './routes/achievements';
import notificationsRouter from './routes/notifications';

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
app.route('/api/streaks', streaksRouter);
app.route('/api/achievements', achievementsRouter);
app.route('/api/notifications', notificationsRouter);

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

  // Get campaign to confirm ownership
  const campaign = await c.env.DB.prepare(
    'SELECT id FROM campaigns WHERE id = ?'
  )
    .bind(coupon.campaign_id)
    .first();

  if (!campaign) {
    return c.text('Campaign not found', 404);
  }

  // Prefer a creative-specific target
  const creative = await c.env.DB.prepare(
    `SELECT id, target_url
     FROM creatives
     WHERE campaign_id = ?
     ORDER BY weight DESC, id ASC
     LIMIT 1`
  )
    .bind(coupon.campaign_id)
    .first();

  // Log the click against the campaign (and creative when available)
  await c.env.DB.prepare(
    `INSERT INTO campaign_events (campaign_id, creative_id, coupon_id, event_type, metadata_json)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(
      coupon.campaign_id,
      creative?.id ?? null,
      coupon.id,
      'coupon-click',
      JSON.stringify({ coupon_code: code })
    )
    .run();

  // Redirect to partner site derived from campaign creative when possible
  const targetUrl =
    creative?.target_url ?? `https://partner.example.com?coupon=${code}`;

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

// Queue Consumer Handler
async function queueHandler(batch: any, env: Env): Promise<void> {
  console.log(`Processing batch of ${batch.messages.length} messages`);

  // Dynamically import webpush to avoid circular dependencies
  const { sendWebPush } = await import('./lib/webpush');

  for (const message of batch.messages) {
    try {
      const payload = message.body;
      const { notification_type, title, body, icon, url, user_id } = payload;

      // Get all active push subscriptions
      let query = 'SELECT * FROM push_subscriptions WHERE enabled = 1';
      const params: any[] = [];

      // If user_id specified, only send to that user
      if (user_id) {
        query += ' AND user_id = ?';
        params.push(user_id);
      }

      const subscriptions = await env.DB.prepare(query)
        .bind(...params)
        .all();

      console.log(`Found ${subscriptions.results.length} push subscriptions`);

      // Send push notification to each subscription
      for (const sub of subscriptions.results) {
        try {
          await sendWebPush(env, {
            endpoint: sub.endpoint as string,
            p256dh: sub.p256dh as string,
            auth: sub.auth as string,
          }, {
            title: title || 'New notification',
            body: body || '',
            icon: icon || '/icon-192.png',
            data: { url: url || '/', type: notification_type },
          });

          // Log successful send
          await env.DB.prepare(`
            INSERT INTO notification_history
            (user_id, subscription_endpoint, notification_type, title, body, icon_url, url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'sent')
          `).bind(
            sub.user_id,
            sub.endpoint,
            notification_type || 'general',
            title,
            body,
            icon || '/icon-192.png',
            url || '/'
          ).run();

          // Update subscription last_sent
          await env.DB.prepare(
            'UPDATE push_subscriptions SET last_sent = CURRENT_TIMESTAMP WHERE endpoint = ?'
          ).bind(sub.endpoint).run();

        } catch (error) {
          console.error(`Failed to send push to ${sub.endpoint}:`, error);

          // Log failure
          await env.DB.prepare(`
            INSERT INTO notification_history
            (user_id, subscription_endpoint, notification_type, title, body, status, error_message)
            VALUES (?, ?, ?, ?, ?, 'failed', ?)
          `).bind(
            sub.user_id,
            sub.endpoint,
            notification_type || 'general',
            title,
            body,
            error instanceof Error ? error.message : 'Unknown error'
          ).run();

          // Update failure count
          await env.DB.prepare(`
            UPDATE push_subscriptions
            SET failure_count = failure_count + 1,
                last_failure = CURRENT_TIMESTAMP,
                enabled = CASE WHEN failure_count >= 5 THEN 0 ELSE enabled END
            WHERE endpoint = ?
          `).bind(sub.endpoint).run();
        }
      }

      // Acknowledge message
      message.ack();
    } catch (error) {
      console.error('Failed to process message:', error);
      message.retry();
    }
  }
}

// Export Worker with queue handler
export default {
  fetch: app.fetch,
  queue: queueHandler,
};

// Durable Object export
export { RateLimiter } from './durable';
