import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types';
import * as db from '../lib/db';

const router = new Hono<{ Bindings: Env }>();

// Journal entry schema
const journalEntrySchema = z.object({
  user_id: z.number().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  method: z.string().optional(),
  amount: z.number().optional(),
  units: z.string().optional(),
  mood_before: z.number().min(1).max(10).optional(),
  mood_after: z.number().min(1).max(10).optional(),
  sleep_hours: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/journal
 * Create a journal entry
 */
router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    console.log('Journal POST body:', body);

    const entry = journalEntrySchema.parse(body);
    const date = entry.date ?? db.getCurrentDate();

    const id = await db.insert(
      c.env.DB,
      `INSERT INTO journal (user_id, date, method, amount, units, mood_before, mood_after, sleep_hours, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.user_id ?? null,
        date,
        entry.method ?? null,
        entry.amount ?? null,
        entry.units ?? null,
        entry.mood_before ?? null,
        entry.mood_after ?? null,
        entry.sleep_hours ?? null,
        entry.notes ?? null,
      ]
    );

    return c.json({ ok: true, id });
  } catch (error) {
    console.error('Journal creation error:', error);
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request body', details: error.errors }, 400);
    }
    return c.json({
      error: 'Failed to create journal entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/journal
 * Get journal entries for a user
 */
router.get('/', async (c) => {
  const userId = c.req.query('user_id');

  if (!userId) {
    return c.json({ error: 'user_id required' }, 400);
  }

  const entries = await db.all(
    c.env.DB,
    'SELECT * FROM journal WHERE user_id = ? ORDER BY date DESC LIMIT 90',
    [parseInt(userId, 10)]
  );

  return c.json({ entries });
});

/**
 * GET /api/journal/stats
 * Get aggregated statistics
 */
router.get('/stats', async (c) => {
  const userId = c.req.query('user_id');
  const days = parseInt(c.req.query('days') || '30', 10);

  if (!userId) {
    return c.json({ error: 'user_id required' }, 400);
  }

  const stats = await db.first(
    c.env.DB,
    `SELECT
       COUNT(*) as entry_count,
       AVG(mood_before) as avg_mood_before,
       AVG(mood_after) as avg_mood_after,
       AVG(sleep_hours) as avg_sleep_hours,
       SUM(amount) as total_amount
     FROM journal
     WHERE user_id = ?
       AND date >= date('now', '-' || ? || ' days')`,
    [parseInt(userId, 10), days]
  );

  return c.json({ stats });
});

export default router;
