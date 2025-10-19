import { Hono } from 'hono';
import type { Env } from '../types';
import * as db from '../lib/db';
import { sendWebPush, getVapidPublicKey } from '../lib/webpush';

const router = new Hono<{ Bindings: Env }>();

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if subscription already exists
    const existing = await db.first(
      c.env.DB,
      'SELECT id FROM push_subscriptions WHERE endpoint = ?',
      [endpoint]
    );

    if (existing) {
      return c.json({ ok: true, message: 'Subscription already exists' });
    }

    await db.insert(
      c.env.DB,
      'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
      [user_id ?? null, endpoint, keys.p256dh, keys.auth]
    );

    return c.json({ ok: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Push subscription error:', error);
    return c.json({ error: 'Failed to subscribe' }, 500);
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.delete('/unsubscribe', async (c) => {
  try {
    const body = await c.req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return c.json({ error: 'endpoint required' }, 400);
    }

    await db.execute(
      c.env.DB,
      'DELETE FROM push_subscriptions WHERE endpoint = ?',
      [endpoint]
    );

    return c.json({ ok: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    return c.json({ error: 'Failed to unsubscribe' }, 500);
  }
});

/**
 * GET /api/push/vapid
 * Get VAPID public key
 */
router.get('/vapid', async (c) => {
  return c.json({ publicKey: getVapidPublicKey(c.env) });
});

/**
 * POST /api/push/test
 * Send a test notification
 */
router.post('/test', async (c) => {
  try {
    const subscriptions = await db.all(
      c.env.DB,
      'SELECT * FROM push_subscriptions ORDER BY id DESC LIMIT 1'
    );

    if (subscriptions.length === 0) {
      return c.json({ ok: false, error: 'No subscriptions found' }, 404);
    }

    const sub = subscriptions[0];

    // Send test notification using Web Push
    const payload = {
      title: '365 Days of Weed',
      body: 'Test notification from your PWA!',
      icon: '/icons/icon-192.png',
    };

    await sendWebPush(c.env, sub, payload);

    return c.json({ ok: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Test push error:', error);
    return c.json({ error: 'Failed to send test notification' }, 500);
  }
});


export default router;
