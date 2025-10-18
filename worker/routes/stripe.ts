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
 */
router.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    const body = await c.req.text();

    // In production, verify webhook signature
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // For now, parse the body directly
    const event = JSON.parse(body);

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
