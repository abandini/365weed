import { Hono } from 'hono';
import type { Env } from '../types';
import * as db from '../lib/db';

const router = new Hono<{ Bindings: Env }>();

/**
 * POST /api/stripe/create-session
 * Create a Stripe checkout session
 */
router.post('/create-session', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, email } = body;

    if (!user_id || !email) {
      return c.json({ error: 'user_id and email required' }, 400);
    }

    // In production, use Stripe SDK
    // For now, return a mock session
    const sessionUrl = `${c.env.APP_BASE_URL}/checkout?session=mock`;

    return c.json({
      ok: true,
      url: sessionUrl,
      session_id: 'mock_session_id',
    });
  } catch (error) {
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

/**
 * POST /api/stripe/portal
 * Create a Stripe billing portal session
 */
router.post('/portal', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id } = body;

    if (!user_id) {
      return c.json({ error: 'user_id required' }, 400);
    }

    // Get Stripe customer ID
    const subscription = await db.first(
      c.env.DB,
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [user_id]
    );

    if (!subscription?.stripe_customer_id) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    // In production, use Stripe SDK
    const portalUrl = `${c.env.APP_BASE_URL}/portal?customer=mock`;

    return c.json({
      ok: true,
      url: portalUrl,
    });
  } catch (error) {
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhooks
 *
 * SECURITY: Verifies webhook signature before processing
 */
router.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    const body = await c.req.text();

    if (!signature) {
      console.error('Missing stripe-signature header');
      return c.json({ error: 'Missing signature' }, 400);
    }

    // Verify webhook signature
    const event = await verifyStripeWebhook(
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    );

    if (!event) {
      console.error('Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(c.env, event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(c.env, event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(c.env, event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

/**
 * Verify Stripe webhook signature using HMAC SHA256
 * Implements Stripe's webhook verification without requiring the SDK
 */
async function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<any | null> {
  try {
    // Parse signature header: t=timestamp,v1=signature
    const signatureParts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = signatureParts.t;
    const expectedSignature = signatureParts.v1;

    if (!timestamp || !expectedSignature) {
      return null;
    }

    // Check timestamp tolerance (5 minutes)
    const tolerance = 300; // seconds
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);

    if (timestampAge > tolerance) {
      console.error('Webhook timestamp too old');
      return null;
    }

    // Compute expected signature
    const encoder = new TextEncoder();
    const data = encoder.encode(`${timestamp}.${payload}`);
    const keyData = encoder.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures (constant-time comparison would be ideal)
    if (computedSignature !== expectedSignature) {
      console.error('Signature mismatch');
      return null;
    }

    // Signature valid, parse and return event
    return JSON.parse(payload);
  } catch (error) {
    console.error('Webhook verification error:', error);
    return null;
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(env: Env, session: any): Promise<void> {
  const { customer, subscription, client_reference_id } = session;

  if (!client_reference_id) {
    console.error('No client_reference_id in session');
    return;
  }

  const userId = parseInt(client_reference_id, 10);

  // Create or update subscription record
  await db.execute(
    env.DB,
    `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       stripe_customer_id = excluded.stripe_customer_id,
       stripe_subscription_id = excluded.stripe_subscription_id,
       status = excluded.status,
       current_period_end = excluded.current_period_end`,
    [userId, customer, subscription, 'active', Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60]
  );
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(env: Env, subscription: any): Promise<void> {
  const { id, status, current_period_end } = subscription;

  await db.execute(
    env.DB,
    `UPDATE subscriptions
     SET status = ?, current_period_end = ?
     WHERE stripe_subscription_id = ?`,
    [status, current_period_end, id]
  );
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(env: Env, subscription: any): Promise<void> {
  const { id } = subscription;

  await db.execute(
    env.DB,
    `UPDATE subscriptions
     SET status = 'canceled'
     WHERE stripe_subscription_id = ?`,
    [id]
  );
}

export default router;
