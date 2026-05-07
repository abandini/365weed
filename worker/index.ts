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
import referralsRouter from './routes/referrals';
import recommendationsRouter from './routes/recommendations';
import communityRouter from './routes/community';
import listsRouter from './routes/lists';
import newsRouter from './routes/news';
import pointsRouter from './routes/points';
import { handleDailyNewsFetch } from './cron/daily-news';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: [
    'https://365daysofweed.com',
    'https://www.365daysofweed.com',
    'http://localhost:5173',
    'http://localhost:8787',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
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

// robots.txt — explicitly allow AI crawlers (overrides Cloudflare managed blocking)
app.get('/robots.txt', (c) => {
  const robots = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: CCBot
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: https://365daysofweed.com/sitemap.xml
`;
  return new Response(robots, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' },
  });
});

// sitemap.xml — XML sitemap for Google Search Console
// Without this, the SPA's catch-all served HTML at /sitemap.xml, blocking indexing.
app.get('/sitemap.xml', (c) => {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    { loc: 'https://365daysofweed.com/', changefreq: 'daily', priority: '1.0' },
    { loc: 'https://365daysofweed.com/today', changefreq: 'daily', priority: '0.9' },
    { loc: 'https://365daysofweed.com/calendar', changefreq: 'daily', priority: '0.8' },
    { loc: 'https://365daysofweed.com/news', changefreq: 'daily', priority: '0.8' },
    { loc: 'https://365daysofweed.com/lists', changefreq: 'weekly', priority: '0.6' },
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

// llms.txt — AI-friendly content map
app.get('/llms.txt', (c) => {
  const llms = `# 365 Days of Weed

> Daily cannabis education and wellness tracking. A new article every day of the year covering strains, terpenes, consumption methods, history, and culture. By Bill Burkey, author of *WEED: A Senior's Guide to Cannabis*.

## About this site

365 Days of Weed publishes one piece of cannabis education content per day, year-round. Topics include strain spotlights, terpene science, consumption method guides, historical context, and cultural commentary. Companion to the Cannabis Education Network: 420Blazin.com (events and gear) and WeedASeniorsGuide.com (book companion for adults 50+).

## Author

Bill Burkey ("Blazin Bill") — Author of *WEED: A Senior's Guide to Cannabis* (Amazon ASIN B0GPG71T22). Cleveland-based cannabis writer focused on terpene science and craft cultivation.

## Key resources

- [Today's article](https://365daysofweed.com/today)
- [Cannabis news](https://365daysofweed.com/news)
- [Strain library](https://365daysofweed.com)
- [The book](https://www.amazon.com/dp/B0GPG71T22)

## Sister sites in the Cannabis Education Network

- [420Blazin.com](https://420blazin.com) — Cannabis culture, events, and vaporizer reviews
- [WeedASeniorsGuide.com](https://weedaseniorsguide.com) — Companion site to the WEED book for adults 50+

## Topics covered

- Cannabis strains (sativa, indica, hybrid)
- Terpene profiles (myrcene, limonene, linalool, pinene, beta-caryophyllene, etc.)
- Consumption methods (vaporizers, edibles, tinctures, topicals)
- Cannabis culture and history
- Legal landscape by state
- Wellness applications
- Daily journal and tracking
`;
  return new Response(llms, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
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
app.route('/api/referrals', referralsRouter);
app.route('/api/recommendations', recommendationsRouter);
app.route('/api/community', communityRouter);
app.route('/api/lists', listsRouter);
app.route('/api/news', newsRouter);
app.route('/api/points', pointsRouter);

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

// Proxy non-API requests to Pages PWA
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  // Proxy to Pages deployment for static assets (PWA)
  const pagesUrl = `https://weed365-pwa.pages.dev${url.pathname}${url.search}`;
  try {
    const response = await fetch(pagesUrl, {
      headers: {
        'Accept': c.req.header('Accept') || '*/*',
        'Accept-Encoding': c.req.header('Accept-Encoding') || '',
      },
    });
    const headers = new Headers(response.headers);
    // Remove headers that cause issues when proxying
    headers.delete('cf-cache-status');
    headers.delete('cf-ray');
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch {
    return c.json({ error: 'Service unavailable' }, 503);
  }
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

// Cron handler for scheduled tasks
async function scheduledHandler(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log('[CRON] Scheduled event triggered:', event.cron);

  // Daily news fetch (runs at 6 AM UTC daily)
  if (event.cron === '0 6 * * *') {
    await handleDailyNewsFetch(env);
  }
}

// Export Worker with queue and scheduled handlers
export default {
  fetch: app.fetch,
  queue: queueHandler,
  scheduled: scheduledHandler,
};

// Durable Object export
export { RateLimiter } from './durable';
