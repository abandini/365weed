-- Migration: Push Notifications Enhancements
-- Phase 1.2: Notification scheduling and history

-- Notification history table
CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  subscription_endpoint TEXT,
  notification_type TEXT, -- 'daily_content', 'journal_reminder', 'streak_alert', 'achievement', 'partner_campaign'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  url TEXT,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'clicked'
  error_message TEXT,
  clicked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for notification lookups
CREATE INDEX IF NOT EXISTS idx_notification_user ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_sent ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification_history(notification_type);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY,
  daily_content_enabled INTEGER DEFAULT 1,
  daily_content_time TEXT DEFAULT '09:00', -- HH:MM format
  journal_reminder_enabled INTEGER DEFAULT 1,
  journal_reminder_time TEXT DEFAULT '20:00',
  streak_alert_enabled INTEGER DEFAULT 1,
  streak_alert_time TEXT DEFAULT '23:00',
  achievement_enabled INTEGER DEFAULT 1,
  partner_campaign_enabled INTEGER DEFAULT 0, -- opt-in for marketing
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for preferences
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

-- Scheduled notifications queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  subscription_id INTEGER, -- from push_subscriptions
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  url TEXT,
  data_json TEXT, -- JSON payload for custom data
  scheduled_for TEXT NOT NULL, -- ISO 8601 timestamp
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed', 'cancelled'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_notif_queue_scheduled ON notification_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_notif_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notif_queue_user ON notification_queue(user_id);

-- Create push_subscriptions table if it doesn't exist (base schema compatibility)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  last_sent TEXT,
  failure_count INTEGER DEFAULT 0,
  last_failure TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint);

-- Notification templates table (for scheduled campaigns)
CREATE TABLE IF NOT EXISTS notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_code TEXT UNIQUE NOT NULL, -- 'daily_content', 'journal_reminder', etc.
  name TEXT NOT NULL,
  default_title TEXT NOT NULL,
  default_body TEXT NOT NULL,
  default_icon_url TEXT,
  variables_json TEXT, -- JSON array of variable names
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed default templates
INSERT INTO notification_templates (template_code, name, default_title, default_body, default_icon_url, variables_json) VALUES
  ('daily_content', 'Daily Content', 'Today''s Cannabis Knowledge', '{{card_title}}', '/icon-192.png', '["card_title","card_date"]'),
  ('journal_reminder', 'Journal Reminder', 'Log Your Session', 'Don''t forget to log your cannabis session today!', '/icon-192.png', '[]'),
  ('streak_alert', 'Streak Alert', 'Don''t Break Your Streak!', 'Check in now to maintain your {{streak_count}}-day streak!', '/icon-192.png', '["streak_count"]'),
  ('achievement_unlock', 'Achievement Unlocked', '{{achievement_name}}', '{{achievement_description}} - You earned {{points}} points!', '/icon-192.png', '["achievement_name","achievement_description","points"]'),
  ('partner_campaign', 'Special Offer', '{{campaign_title}}', '{{campaign_description}}', '/icon-192.png', '["campaign_title","campaign_description"]');
