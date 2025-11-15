import { Hono } from 'hono';
import { PerplexityNewsService, generateSlug, extractPlainText, NewsArticle } from '../lib/perplexity';

const news = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/news
 * List all news articles with pagination and filtering
 */
news.get('/', async (c) => {
  const { limit = '20', offset = '0', category, search } = c.req.query();

  let query = 'SELECT * FROM news_articles WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM news_articles WHERE 1=1';
  const countParams: any[] = [];

  if (category) {
    countQuery += ' AND category = ?';
    countParams.push(category);
  }

  if (search) {
    countQuery += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern, searchPattern);
  }

  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();

  return c.json({
    articles: result.results,
    pagination: {
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < (countResult?.total || 0),
    },
  });
});

/**
 * GET /api/news/categories
 * Get all news categories
 */
news.get('/categories', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM news_categories ORDER BY name').all();

  return c.json({
    categories: result.results,
  });
});

/**
 * GET /api/news/latest
 * Get the most recent article from each category
 */
news.get('/latest', async (c) => {
  const categories = ['legal', 'medical', 'business', 'culture', 'products'];
  const articles = [];

  for (const category of categories) {
    const result = await c.env.DB.prepare(
      'SELECT * FROM news_articles WHERE category = ? ORDER BY published_at DESC LIMIT 1'
    )
      .bind(category)
      .first();

    if (result) {
      articles.push(result);
    }
  }

  return c.json({ articles });
});

/**
 * GET /api/news/:slug
 * Get a single article by slug
 */
news.get('/:slug', async (c) => {
  const { slug } = c.req.param();

  const article = await c.env.DB.prepare('SELECT * FROM news_articles WHERE slug = ?')
    .bind(slug)
    .first();

  if (!article) {
    return c.json({ error: 'Article not found' }, 404);
  }

  // Increment view count
  await c.env.DB.prepare('UPDATE news_articles SET view_count = view_count + 1 WHERE slug = ?')
    .bind(slug)
    .run();

  // Track analytics
  await c.env.DB.prepare(
    'INSERT INTO news_analytics (article_id, event_type) VALUES (?, ?)'
  )
    .bind(article.id, 'view')
    .run();

  return c.json({ article });
});

/**
 * POST /api/news/:id/share
 * Track article shares
 */
news.post('/:id/share', async (c) => {
  const { id } = c.req.param();
  const { platform } = await c.req.json();

  await c.env.DB.prepare('UPDATE news_articles SET share_count = share_count + 1 WHERE id = ?')
    .bind(id)
    .run();

  await c.env.DB.prepare(
    'INSERT INTO news_analytics (article_id, event_type, metadata) VALUES (?, ?, ?)'
  )
    .bind(id, 'share', JSON.stringify({ platform }))
    .run();

  return c.json({ success: true });
});

/**
 * GET /api/news/stats/trending
 * Get trending articles (most views/shares in last 7 days)
 */
news.get('/stats/trending', async (c) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await c.env.DB.prepare(`
    SELECT * FROM news_articles
    WHERE published_at >= ?
    ORDER BY (view_count + share_count * 3) DESC
    LIMIT 10
  `)
    .bind(sevenDaysAgo.toISOString())
    .all();

  return c.json({ articles: result.results });
});

/**
 * POST /api/news/fetch (Admin/Cron)
 * Manually trigger news fetching (or called by cron)
 */
news.post('/fetch', async (c) => {
  // Verify authorization (simple check - enhance for production)
  const authHeader = c.req.header('Authorization');
  const cronHeader = c.req.header('Cron'); // Cloudflare cron sets this

  if (!cronHeader && authHeader !== `Bearer ${c.env.ADMIN_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const perplexityApiKey = c.env.PERPLEXITY_API_KEY;
  if (!perplexityApiKey) {
    return c.json({ error: 'Perplexity API key not configured' }, 500);
  }

  const service = new PerplexityNewsService(perplexityApiKey);

  try {
    console.log('Fetching daily cannabis news...');
    const articles = await service.fetchDailyNews();
    console.log(`Perplexity returned ${articles.length} articles`);

    const inserted = [];
    const errors = [];

    for (const article of articles) {
      try {
        const slug = generateSlug(article.title, article.publishedAt);
        const fetchDate = new Date().toISOString().split('T')[0];

        // Check if article with this slug already exists
        const existing = await c.env.DB.prepare('SELECT id FROM news_articles WHERE slug = ?')
          .bind(slug)
          .first();

        if (existing) {
          console.log(`Article already exists: ${slug}`);
          continue;
        }

        // Ensure ALL values are proper primitives
        const sanitize = (val: any): string => {
          if (val === null || val === undefined) return '';
          if (typeof val === 'string') return val;
          if (typeof val === 'number' || typeof val === 'boolean') return String(val);
          return JSON.stringify(val);
        };

        const params = {
          slug: sanitize(slug),
          title: sanitize(article.title),
          summary: sanitize(article.summary),
          content: sanitize(article.content),
          category: sanitize(article.category),
          sourceUrls: Array.isArray(article.sourceUrls)
            ? JSON.stringify(article.sourceUrls)
            : sanitize(article.sourceUrls),
          imageUrl: article.imageUrl ? sanitize(article.imageUrl) : null,
          publishedAt: sanitize(article.publishedAt),
          fetchDate: sanitize(fetchDate),
          tags: Array.isArray(article.tags)
            ? article.tags.join(',')
            : sanitize(article.tags),
        };

        console.log(`Inserting: ${params.title.substring(0, 50)}...`);

        await c.env.DB.prepare(`
          INSERT INTO news_articles (
            slug, title, summary, content, category,
            source_urls, image_url, published_at, fetch_date, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            params.slug,
            params.title,
            params.summary,
            params.content,
            params.category,
            params.sourceUrls,
            params.imageUrl,
            params.publishedAt,
            params.fetchDate,
            params.tags
          )
          .run();

        inserted.push({ slug, title: article.title, category: article.category });
      } catch (error) {
        console.error('Error inserting article:', error);
        errors.push({
          title: article.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return c.json({
      success: true,
      fetched: articles.length,
      inserted: inserted.length,
      errors: errors.length > 0 ? errors : undefined,
      articles: inserted,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return c.json(
      {
        error: 'Failed to fetch news',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/news/feed/rss
 * RSS 2.0 feed for news articles
 */
news.get('/feed/rss', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM news_articles
      ORDER BY published_at DESC
      LIMIT 50
    `).all();

    const articles = result.results || [];
    const baseUrl = c.env.APP_BASE_URL || 'https://365daysofweed.com';
    const buildDate = new Date().toUTCString();

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>365 Days of Weed - Cannabis News</title>
    <link>${baseUrl}/news</link>
    <description>Daily cannabis industry news, research, and updates</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/api/news/feed/rss" rel="self" type="application/rss+xml" />
    ${articles.map((article: any) => {
      const pubDate = new Date(article.published_at).toUTCString();
      const articleUrl = `${baseUrl}/news/${article.slug}`;

      // Escape XML special characters
      const escapeXml = (str: string) =>
        str.replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&apos;');

      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${article.category}</category>
      <description><![CDATA[${article.summary}]]></description>
      ${article.image_url ? `<enclosure url="${article.image_url}" type="image/jpeg" />` : ''}
      <author>Cannabis News Bot</author>
    </item>`;
    }).join('')}
  </channel>
</rss>`;

    return c.text(rssXml, 200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return c.json(
      {
        error: 'Failed to generate RSS feed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default news;
