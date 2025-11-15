-- News Articles Table (for automated daily cannabis news)
CREATE TABLE IF NOT EXISTS news_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,           -- URL-friendly identifier
  title TEXT NOT NULL,
  summary TEXT,                         -- AI-generated summary
  content TEXT NOT NULL,                -- Full article content from Perplexity
  category TEXT NOT NULL,               -- legal, medical, business, culture, science
  source_urls TEXT,                     -- JSON array of source URLs
  image_url TEXT,                       -- Featured image
  author TEXT DEFAULT 'Cannabis News Bot',
  published_at TEXT NOT NULL,           -- ISO timestamp
  fetch_date TEXT NOT NULL,             -- When we fetched it
  tags TEXT,                            -- Comma-separated tags
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_fetch_date ON news_articles(fetch_date);

-- News Categories Table (for organization)
CREATE TABLE IF NOT EXISTS news_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                            -- Emoji icon
  color TEXT,                           -- Hex color for UI
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed categories
INSERT OR IGNORE INTO news_categories (slug, name, description, icon, color) VALUES
  ('legal', 'Legal & Policy', 'Cannabis legislation, regulations, and policy updates', '⚖️', '#3b82f6'),
  ('medical', 'Medical & Science', 'Research, health benefits, and medical cannabis news', '🧬', '#8b5cf6'),
  ('business', 'Industry & Business', 'Market trends, company news, and financial updates', '💼', '#f59e0b'),
  ('culture', 'Culture & Lifestyle', 'Cannabis culture, events, and social movements', '🎨', '#ec4899'),
  ('products', 'Products & Innovation', 'New products, technology, and cultivation', '🔬', '#10b981');

-- News Analytics Table (track engagement)
CREATE TABLE IF NOT EXISTS news_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,             -- view, share, click
  user_id INTEGER,
  metadata TEXT,                         -- JSON with additional data
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES news_articles(id)
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_article ON news_analytics(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON news_analytics(event_type);
