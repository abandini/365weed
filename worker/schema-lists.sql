-- Curated Lists Tables
-- For lifestyle content like "13 Horror Movies to Watch While High"

CREATE TABLE IF NOT EXISTS curated_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- movies, music, food, activities, products
  subcategory TEXT, -- horror, comedy, edibles, indoor, etc.
  description TEXT,
  icon_emoji TEXT DEFAULT '📚',
  featured BOOLEAN DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  published_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  why_high TEXT, -- Why it's great while high
  meta_json TEXT, -- JSON: { year: 2021, genre: "horror", director: "...", where_to_watch: "Netflix" }
  image_url TEXT,
  order_position INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES curated_lists(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lists_category ON curated_lists(category);
CREATE INDEX IF NOT EXISTS idx_lists_featured ON curated_lists(featured);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);

-- User interactions
CREATE TABLE IF NOT EXISTS list_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  list_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, list_id)
);

CREATE TABLE IF NOT EXISTS list_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  user_id INTEGER,
  viewed_at TEXT DEFAULT CURRENT_TIMESTAMP
);
