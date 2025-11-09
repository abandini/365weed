import type { Context, Next } from 'hono';
import type { Env } from '../types';
import { verifyToken } from './jwt';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and sets userId in context
 *
 * Usage:
 *   router.get('/protected', requireAuth, async (c) => {
 *     const userId = c.get('userId');
 *     // ...
 *   });
 */
export async function requireAuth(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - Missing or invalid token' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);

    if (!payload?.user_id) {
      return c.json({ error: 'Unauthorized - Invalid token payload' }, 401);
    }

    // Set userId in context for use in route handlers
    c.set('userId', payload.user_id);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Unauthorized - Token verification failed' }, 401);
  }
}

/**
 * Optional authentication middleware
 * Extracts userId if valid token present, but doesn't require it
 *
 * Useful for routes that have different behavior for authenticated users
 * but still work for anonymous users
 */
export async function optionalAuth(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<void> {
  const authHeader = c.req.header('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = await verifyToken(token, c.env.JWT_SECRET);

      if (payload?.user_id) {
        c.set('userId', payload.user_id);
      }
    } catch (error) {
      // Silently ignore invalid tokens in optional auth
      console.warn('Optional auth - invalid token:', error);
    }
  }

  await next();
}

/**
 * Partner authentication middleware
 * Verifies partner API key and sets partnerId in context
 */
export async function requirePartnerAuth(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const apiKey = c.req.header('x-api-key');

  if (!apiKey) {
    return c.json({ error: 'Unauthorized - Missing API key' }, 401);
  }

  try {
    // Verify API key exists and is active
    const partnerKey = await c.env.DB.prepare(
      `SELECT partner_id, status
       FROM partner_api_keys
       WHERE api_key = ? AND status = 'active'`
    )
      .bind(apiKey)
      .first();

    if (!partnerKey) {
      return c.json({ error: 'Unauthorized - Invalid API key' }, 401);
    }

    // Set partnerId in context
    c.set('partnerId', partnerKey.partner_id);

    await next();
  } catch (error) {
    console.error('Partner auth middleware error:', error);
    return c.json({ error: 'Unauthorized - Authentication failed' }, 401);
  }
}

/**
 * Admin authentication middleware
 * Verifies user has admin role
 */
export async function requireAdmin(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  // First verify authentication
  const authResult = await requireAuth(c, async () => {});

  if (authResult instanceof Response) {
    return authResult;
  }

  const userId = c.get('userId');

  try {
    // Check if user is admin
    const user = await c.env.DB.prepare(
      'SELECT role FROM users WHERE id = ?'
    )
      .bind(userId)
      .first();

    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    await next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return c.json({ error: 'Forbidden - Authorization failed' }, 403);
  }
}
