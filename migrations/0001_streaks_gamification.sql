-- Migration: Streaks & Gamification System
-- Phase 1.1: User engagement tracking

-- Streaks table: Track user daily check-in streaks
CREATE TABLE IF NOT EXISTS streaks (
  user_id INTEGER PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in TEXT, -- ISO 8601 date (YYYY-MM-DD)
  total_points INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast streak lookups
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_last_checkin ON streaks(last_check_in);

-- Achievements table: Define available achievements
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- e.g., 'streak_7', 'streak_30', 'journal_100'
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT, -- emoji representation
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  category TEXT DEFAULT 'streak', -- streak, journal, social, milestone
  requirement_value INTEGER, -- threshold value (e.g., 7 for streak_7)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for achievement lookups
CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- User achievements: Track which achievements users have unlocked
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER,
  achievement_id INTEGER,
  unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notified INTEGER DEFAULT 0, -- whether user was notified
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Index for user achievement lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at);

-- Streak saves: Track when users save their streak
CREATE TABLE IF NOT EXISTS streak_saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
  method TEXT NOT NULL, -- 'watch_ad', 'premium_perk', 'purchased'
  expires_at TEXT, -- grace period expiration
  used INTEGER DEFAULT 0, -- whether the save was actually needed
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for streak save lookups
CREATE INDEX IF NOT EXISTS idx_streak_saves_user ON streak_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_saves_expires ON streak_saves(expires_at);

-- Check-in history: Detailed log of all check-ins
CREATE TABLE IF NOT EXISTS checkin_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  check_in_date TEXT NOT NULL, -- YYYY-MM-DD
  check_in_type TEXT DEFAULT 'daily', -- daily, journal_entry, content_view
  points_earned INTEGER DEFAULT 10,
  streak_count INTEGER, -- streak at time of check-in
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for check-in history
CREATE INDEX IF NOT EXISTS idx_checkin_user_date ON checkin_history(user_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_checkin_date ON checkin_history(check_in_date);

-- Seed initial achievements
INSERT INTO achievements (code, name, description, icon_emoji, points, tier, category, requirement_value) VALUES
  -- Streak achievements
  ('streak_3', 'Getting Started', 'Maintain a 3-day streak', '🔥', 50, 'bronze', 'streak', 3),
  ('streak_7', 'Weekly Warrior', 'Maintain a 7-day streak', '⚡', 100, 'silver', 'streak', 7),
  ('streak_14', 'Two Week Champion', 'Maintain a 14-day streak', '💪', 200, 'silver', 'streak', 14),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', '🏆', 500, 'gold', 'streak', 30),
  ('streak_60', '60-Day Legend', 'Maintain a 60-day streak', '👑', 1000, 'gold', 'streak', 60),
  ('streak_100', 'Centurion', 'Maintain a 100-day streak', '💎', 2000, 'platinum', 'streak', 100),
  ('streak_365', 'Year-Round Pro', 'Maintain a 365-day streak', '🌟', 10000, 'platinum', 'streak', 365),

  -- Journal achievements
  ('journal_first', 'First Entry', 'Create your first journal entry', '📝', 25, 'bronze', 'journal', 1),
  ('journal_10', 'Consistent Logger', 'Create 10 journal entries', '📚', 100, 'silver', 'journal', 10),
  ('journal_50', 'Wellness Tracker', 'Create 50 journal entries', '📖', 300, 'gold', 'journal', 50),
  ('journal_100', 'Data Driven', 'Create 100 journal entries', '🎯', 750, 'platinum', 'journal', 100),

  -- Social achievements
  ('referral_first', 'Sharing is Caring', 'Refer your first friend', '🤝', 100, 'bronze', 'social', 1),
  ('referral_5', 'Community Builder', 'Refer 5 friends', '👥', 500, 'silver', 'social', 5),
  ('referral_10', 'Social Butterfly', 'Refer 10 friends', '🦋', 1000, 'gold', 'social', 10),

  -- Milestone achievements
  ('points_1000', 'Point Collector', 'Earn 1,000 total points', '💰', 0, 'bronze', 'milestone', 1000),
  ('points_5000', 'Point Hoarder', 'Earn 5,000 total points', '💵', 0, 'silver', 'milestone', 5000),
  ('points_10000', 'Point Millionaire', 'Earn 10,000 total points', '💸', 0, 'gold', 'milestone', 10000),

  -- Engagement achievements
  ('early_adopter', 'Early Adopter', 'Join during beta period', '🚀', 500, 'gold', 'milestone', 1),
  ('comeback_kid', 'Comeback Kid', 'Use a streak save to recover', '🔄', 50, 'bronze', 'engagement', 1),
  ('perfect_week', 'Perfect Week', '7 consecutive days with journal entries', '✨', 200, 'silver', 'engagement', 7);
