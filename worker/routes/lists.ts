/**
 * Curated Lists API
 * Lifestyle listicles like "13 Horror Movies to Watch While High"
 */

import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/lists - Get all lists with optional filtering
app.get('/', async (c) => {
  const { category, featured, limit = '50', offset = '0' } = c.req.query();

  let sql = `
    SELECT id, title, slug, category, subcategory, description, icon_emoji,
           featured, view_count, like_count, published_at, created_at,
           (SELECT COUNT(*) FROM list_items WHERE list_id = curated_lists.id) as item_count
    FROM curated_lists
    WHERE 1=1
  `;

  const params: any[] = [];

  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }

  if (featured === 'true' || featured === '1') {
    sql += ` AND featured = 1`;
  }

  sql += ` ORDER BY featured DESC, view_count DESC, created_at DESC`;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();

  return c.json({
    lists: results,
    count: results.length,
    offset: parseInt(offset),
    limit: parseInt(limit)
  });
});

// GET /api/lists/:slug - Get a single list with all items
app.get('/:slug', async (c) => {
  const { slug } = c.req.param();
  const userId = c.get('userId') || null; // From auth middleware

  // Get the list
  const { results: lists } = await c.env.DB.prepare(`
    SELECT id, title, slug, category, subcategory, description, icon_emoji,
           featured, view_count, like_count, published_at, created_at
    FROM curated_lists
    WHERE slug = ?
  `).bind(slug).all();

  if (!lists || lists.length === 0) {
    return c.json({ error: 'List not found' }, 404);
  }

  const list = lists[0] as any;

  // Get all items for this list
  const { results: items } = await c.env.DB.prepare(`
    SELECT id, title, description, why_high, meta_json, image_url, order_position, created_at
    FROM list_items
    WHERE list_id = ?
    ORDER BY order_position ASC
  `).bind(list.id).all();

  // Parse meta_json for each item
  const parsedItems = items.map((item: any) => ({
    ...item,
    meta: item.meta_json ? JSON.parse(item.meta_json) : null
  }));

  // Check if user has liked this list
  let userHasLiked = false;
  if (userId) {
    const { results: likes } = await c.env.DB.prepare(`
      SELECT id FROM list_likes
      WHERE user_id = ? AND list_id = ?
    `).bind(userId, list.id).all();
    userHasLiked = likes.length > 0;
  }

  return c.json({
    ...list,
    items: parsedItems,
    userHasLiked
  });
});

// POST /api/lists/:id/view - Track a view
app.post('/:id/view', async (c) => {
  const listId = parseInt(c.req.param('id'));
  const userId = c.get('userId') || null;

  // Record the view
  await c.env.DB.prepare(`
    INSERT INTO list_views (list_id, user_id, viewed_at)
    VALUES (?, ?, datetime('now'))
  `).bind(listId, userId).run();

  // Increment view count
  await c.env.DB.prepare(`
    UPDATE curated_lists
    SET view_count = view_count + 1
    WHERE id = ?
  `).bind(listId).run();

  return c.json({ success: true });
});

// POST /api/lists/:id/like - Toggle like
app.post('/:id/like', async (c) => {
  const listId = parseInt(c.req.param('id'));
  const userId = c.get('userId') || 1; // TODO: Get from auth context

  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Check if already liked
  const { results: existing } = await c.env.DB.prepare(`
    SELECT id FROM list_likes
    WHERE user_id = ? AND list_id = ?
  `).bind(userId, listId).all();

  let liked = false;

  if (existing.length > 0) {
    // Unlike
    await c.env.DB.prepare(`
      DELETE FROM list_likes
      WHERE user_id = ? AND list_id = ?
    `).bind(userId, listId).run();

    await c.env.DB.prepare(`
      UPDATE curated_lists
      SET like_count = like_count - 1
      WHERE id = ?
    `).bind(listId).run();

    liked = false;
  } else {
    // Like
    await c.env.DB.prepare(`
      INSERT INTO list_likes (user_id, list_id, created_at)
      VALUES (?, ?, datetime('now'))
    `).bind(userId, listId).run();

    await c.env.DB.prepare(`
      UPDATE curated_lists
      SET like_count = like_count + 1
      WHERE id = ?
    `).bind(listId).run();

    liked = true;
  }

  return c.json({ success: true, liked });
});

// GET /api/lists/categories - Get all available categories
app.get('/meta/categories', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT DISTINCT category, COUNT(*) as count
    FROM curated_lists
    GROUP BY category
    ORDER BY count DESC
  `).all();

  return c.json({ categories: results });
});

export default app;
