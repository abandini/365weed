-- Create campaign_events table and supporting indexes
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
