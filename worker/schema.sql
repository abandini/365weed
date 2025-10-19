PRAGMA foreign_keys=ON;

-- Users and Profiles
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY,
  display_name TEXT,
  tz TEXT,
  state_code TEXT,
  is_21 INTEGER DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily Content Cards
CREATE TABLE IF NOT EXISTS day_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE,
  slug TEXT,
  title TEXT,
  body_md TEXT,
  spotlight_json TEXT,
  tags TEXT,
  hero_url TEXT,
  published_at TEXT DEFAULT (datetime('now'))
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  date TEXT,
  method TEXT,
  amount REAL,
  units TEXT,
  mood_before INTEGER,
  mood_after INTEGER,
  sleep_hours REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  kind TEXT,
  cron_expr TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Legacy Ads (will be migrated to campaigns/creatives)
CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region TEXT,
  tag TEXT,
  start_date TEXT,
  end_date TEXT,
  title TEXT,
  body_md TEXT,
  image_url TEXT,
  target_url TEXT,
  sponsor_name TEXT,
  cpm_rate REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ads_region_dates ON ads(region, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ads_tag ON ads(tag);

-- Ad Impressions
CREATE TABLE IF NOT EXISTS ad_impressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_id INTEGER,
  user_id INTEGER,
  date TEXT,
  event_type TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(ad_id) REFERENCES ads(id)
);

CREATE INDEX IF NOT EXISTS idx_impressions_date ON ad_impressions(date);
CREATE INDEX IF NOT EXISTS idx_impressions_ad ON ad_impressions(ad_id);

-- Campaign Events (non-ad impressions such as coupon redirects)
CREATE TABLE IF NOT EXISTS campaign_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  creative_id INTEGER,
  coupon_id INTEGER,
  event_type TEXT,
  occurred_at TEXT DEFAULT (datetime('now')),
  metadata_json TEXT,
  FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY(creative_id) REFERENCES creatives(id) ON DELETE SET NULL,
  FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign ON campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_coupon ON campaign_events(coupon_id);

-- Partners
CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  hmac_secret TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Partner API Keys
CREATE TABLE IF NOT EXISTS partner_api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER,
  api_key TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER,
  name TEXT,
  region TEXT,
  tag TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_region ON campaigns(region);

-- Creatives (Ad Variants)
CREATE TABLE IF NOT EXISTS creatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  title TEXT,
  body_md TEXT,
  image_url TEXT,
  target_url TEXT,
  cpm_rate REAL,
  variant_group TEXT,
  weight REAL DEFAULT 1.0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creatives_variant ON creatives(variant_group);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  code TEXT UNIQUE,
  discount_type TEXT,
  discount_value REAL,
  region TEXT,
  starts_at TEXT,
  ends_at TEXT,
  max_redemptions INTEGER,
  per_user_limit INTEGER,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_campaign ON coupons(campaign_id);

-- Coupon Issues (per-user tracking)
CREATE TABLE IF NOT EXISTS coupon_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_id INTEGER,
  user_hash TEXT,
  code TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_code TEXT,
  campaign_id INTEGER,
  partner_id INTEGER,
  order_id TEXT,
  revenue REAL,
  currency TEXT DEFAULT 'USD',
  user_hash TEXT,
  redeemed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_redemptions_coupon ON redemptions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_campaign ON redemptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_order ON redemptions(order_id);

-- Pixel Events (anti-fraud logging)
CREATE TABLE IF NOT EXISTS pixel_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER,
  campaign_id INTEGER,
  coupon_code TEXT,
  order_id TEXT,
  revenue REAL,
  ip_hash TEXT,
  ua_hash TEXT,
  ts INTEGER
);

CREATE INDEX IF NOT EXISTS idx_pixel_events_order ON pixel_events(order_id);

-- Stripe Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  current_period_end INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
