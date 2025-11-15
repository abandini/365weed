/**
 * Daily News Fetching Cron Job
 *
 * Runs every day at 6 AM UTC to fetch fresh cannabis news
 */

import { PerplexityNewsService, generateSlug } from '../lib/perplexity';

export async function handleDailyNewsFetch(env: Bindings): Promise<void> {
  console.log('[CRON] Starting daily news fetch:', new Date().toISOString());

  const perplexityApiKey = env.PERPLEXITY_API_KEY;
  if (!perplexityApiKey) {
    console.error('[CRON] Perplexity API key not configured');
    return;
  }

  const service = new PerplexityNewsService(perplexityApiKey);

  try {
    // Fetch today's news across all categories
    const articles = await service.fetchDailyNews();
    console.log(`[CRON] Fetched ${articles.length} articles from Perplexity`);

    const fetchDate = new Date().toISOString().split('T')[0];
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        const slug = generateSlug(article.title, article.publishedAt);

        // Check if article already exists
        const existing = await env.DB.prepare('SELECT id FROM news_articles WHERE slug = ?')
          .bind(slug)
          .first();

        if (existing) {
          console.log(`[CRON] Article already exists: ${slug}`);
          skipped++;
          continue;
        }

        // Insert new article
        await env.DB.prepare(`
          INSERT INTO news_articles (
            slug, title, summary, content, category,
            source_urls, image_url, published_at, fetch_date, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            slug,
            article.title,
            article.summary,
            article.content,
            article.category,
            JSON.stringify(article.sourceUrls),
            article.imageUrl || null,
            article.publishedAt,
            fetchDate,
            article.tags.join(',')
          )
          .run();

        console.log(`[CRON] Inserted article: ${article.title} (${article.category})`);
        inserted++;

        // Cache in KV for quick access
        await env.CACHE.put(
          `news:latest:${article.category}`,
          JSON.stringify(article),
          { expirationTtl: 86400 } // 24 hours
        );
      } catch (error) {
        console.error(`[CRON] Error processing article:`, error);
        errors++;
      }
    }

    console.log(`[CRON] Daily news fetch complete:`, {
      fetched: articles.length,
      inserted,
      skipped,
      errors,
    });

    // Store fetch summary in KV
    await env.CACHE.put(
      'news:last_fetch',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        fetched: articles.length,
        inserted,
        skipped,
        errors,
      }),
      { expirationTtl: 604800 } // 7 days
    );
  } catch (error) {
    console.error('[CRON] Daily news fetch failed:', error);

    // Log error to KV for monitoring
    await env.CACHE.put(
      'news:last_fetch_error',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { expirationTtl: 604800 } // 7 days
    );
  }
}
