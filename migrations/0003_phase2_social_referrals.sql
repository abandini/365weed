-- Migration: Phase 2 & 3 - Social, Referrals, Recommendations, Tiers, Sponsored Content
-- Consolidating multiple features for efficiency

-- ============================================
-- PHASE 2: Social Sharing & Referrals
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referred_user_id INTEGER,
  referral_code TEXT UNIQUE NOT NULL,
  signup_date TEXT,
  reward_granted INTEGER DEFAULT 0,
  reward_type TEXT DEFAULT 'pro_week',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

CREATE TABLE IF NOT EXISTS share_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  content_type TEXT NOT NULL,
  content_id TEXT,
  platform TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_share_user ON share_events(user_id);

-- User preferences for personalized recommendations
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY,
  preferred_tags TEXT,
  preferred_methods TEXT,
  goals TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  content_id INTEGER,
  feedback TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- PHASE 3: Tiered Subscriptions
-- ============================================

-- Create subscriptions table if not exists (for compatibility)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  current_period_end INTEGER,
  tier TEXT DEFAULT 'free',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscription_tiers (
  tier_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER,
  price_annual INTEGER,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  features_json TEXT,
  display_order INTEGER,
  active INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO subscription_tiers VALUES
('free', 'Free', 0, 0, NULL, NULL, '["Daily content", "30-day journal", "Basic stats"]', 1, 1),
('pro', 'Pro', 199, 1990, 'price_pro_monthly', 'price_pro_annual', '["Ad-free", "365-day journal", "Advanced stats", "Email reports"]', 2, 1),
('premium', 'Premium', 499, 4990, 'price_premium_monthly', 'price_premium_annual', '["All Pro", "AI insights", "Priority support", "Partner discounts"]', 3, 1);

-- ============================================
-- PHASE 3: Sponsored Content
-- ============================================

CREATE TABLE IF NOT EXISTS partner_content_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  proposed_date TEXT,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  hero_url TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewer_notes TEXT,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_submissions_partner ON partner_content_submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON partner_content_submissions(status);

-- ============================================
-- PHASE 4: Community Stats & Affiliate
-- ============================================

CREATE TABLE IF NOT EXISTS affiliate_partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT,
  commission_rate REAL,
  cookie_duration INTEGER DEFAULT 30,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  affiliate_partner_id INTEGER,
  product_url TEXT,
  click_id TEXT UNIQUE,
  clicked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (affiliate_partner_id) REFERENCES affiliate_partners(id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_id ON affiliate_clicks(click_id);

-- Onboarding tracking
CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id INTEGER PRIMARY KEY,
  current_step INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
