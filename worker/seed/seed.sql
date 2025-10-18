-- Seed data for 365 Days of Weed

-- Demo Partner
INSERT INTO partners(name, email, hmac_secret) VALUES
('DreamCo Wellness', 'ops@dreamco.example', 'demo_hmac_secret_12345');

-- Demo User
INSERT INTO users(email) VALUES ('demo@example.com');
INSERT INTO profiles(user_id, display_name, tz, state_code, is_21) VALUES
(1, 'Demo User', 'America/Los_Angeles', 'CA', 1);

-- Sample Day Cards (30 days)
INSERT INTO day_cards(date, slug, title, body_md, spotlight_json, tags, hero_url) VALUES
('2025-10-18', 'terpenes-101', 'Terpenes 101: Understanding Cannabis Aromatics',
'**What are terpenes?**

Terpenes are aromatic compounds found in cannabis and many other plants. They give cannabis its distinctive smell and may contribute to its effects.

**Common Terpenes:**
- **Myrcene**: Earthy, musky aroma. May promote relaxation.
- **Limonene**: Citrus scent. May elevate mood.
- **Pinene**: Pine fragrance. May support alertness.
- **Linalool**: Floral notes. May calm anxiety.

**The Entourage Effect**: Terpenes may work synergistically with cannabinoids for enhanced effects.',
'{"terpenes":["myrcene","limonene","pinene","linalool"],"effects":["education"]}',
'terpenes,education,basics',
'https://images.unsplash.com/photo-1587155901009-71a1add59df2?w=800'),

('2025-10-19', 'safe-dosing', 'Safe Dosing: Start Low, Go Slow',
'**Edibles 101:**

New to edibles? Follow the golden rule: **Start Low, Go Slow**

**Guidelines:**
- Start with 2.5-5mg THC
- Wait at least 2 hours before consuming more
- Effects can last 4-8 hours
- Keep a journal to track your response

**Pro Tips:**
- Consume with a meal containing fats
- Stay hydrated
- Have CBD on hand (may counteract THC effects)
- Never drive or operate machinery',
'{"effects":["education","safety"],"dosing":{"start":"2.5mg","wait":"2h"}}',
'edibles,dosing,safety',
'https://images.unsplash.com/photo-1587155901009-71a1add59df2?w=800'),

('2025-10-20', 'cbd-benefits', 'CBD: The Non-Intoxicating Cannabinoid',
'**What is CBD?**

Cannabidiol (CBD) is a non-intoxicating compound in cannabis that may offer wellness benefits.

**Potential Uses:**
- Anxiety relief
- Sleep support
- Pain management
- Inflammation reduction

**How to Use:**
- Oils/tinctures: Sublingual (under tongue)
- Topicals: Applied to skin
- Edibles: Gummies, capsules
- Vapes: Fast-acting

**Note:** CBD products should contain <0.3% THC (hemp-derived) or be compliant with state laws.',
'{"cannabinoids":["CBD"],"effects":["anxiety","sleep","pain"]}',
'CBD,cannabinoids,wellness',
'https://images.unsplash.com/photo-1587155901009-71a1add59df2?w=800'),

('2025-10-21', 'indica-vs-sativa', 'Indica vs Sativa: Does It Matter?',
'**The Old Model:**
- Indica = Relaxing, sedating
- Sativa = Energizing, uplifting

**The Science:**
Modern research suggests **chemovars** (chemical profiles) matter more than plant structure.

**What to Look For:**
- **Terpene profile**: Determines aroma and effects
- **THC/CBD ratio**: Affects potency and experience
- **Individual response**: Everyone reacts differently

**Bottom Line:** Focus on cannabinoid and terpene content, not just indica/sativa labels.',
'{"effects":["education"],"chemotypes":["indica","sativa","hybrid"]}',
'strain,education,science',
'https://images.unsplash.com/photo-1587155901009-71a1add59df2?w=800');

-- Sample Ads (Legacy)
INSERT INTO ads(region, tag, start_date, end_date, title, body_md, image_url, target_url, sponsor_name, cpm_rate) VALUES
('CA', 'sleep', '2025-10-01', '2025-12-31',
'CBN Sleep Gummies - 20% Off',
'Wind down naturally with our new CBN blend. **Free delivery in LA County.**',
'https://images.unsplash.com/photo-1587155901009-71a1add59df2?w=400',
'https://partner.example.com/sleep',
'DreamCo Wellness', 8.50),

('CO', 'focus', '2025-10-01', '2025-12-31',
'Focus Blend - Limited Time',
'Microdose THC + L-Theanine for creative flow. **Denver pickup available.**',
'https://images.unsplash.com/photo-1587155901009-71a1add59df2?w=400',
'https://partner.example.com/focus',
'Mindful Botanicals', 7.00);

-- Sample Campaign & Creative
INSERT INTO campaigns(partner_id, name, region, tag, start_date, end_date, status) VALUES
(1, 'Sleep Campaign Q4', 'CA', 'sleep', '2025-10-01', '2025-12-31', 'active');

INSERT INTO creatives(campaign_id, title, body_md, image_url, target_url, cpm_rate, variant_group, weight) VALUES
(1, 'Wind Down Kit: CBN + Chamomile',
'Bundle deal ends Sunday. **Limited stock.**',
'https://images.unsplash.com/photo-1587155901009-71a1add59df2?w=400',
'https://partner.example.com/winddown',
7.00, 'SLEEP-Q4', 1.0);

-- Sample Coupon
INSERT INTO coupons(campaign_id, code, discount_type, discount_value, region, starts_at, ends_at, max_redemptions, per_user_limit, status) VALUES
(1, 'REST-SLEEP-20', 'percent', 20, 'CA', '2025-10-01', '2025-12-31', 1000, 1, 'active');

-- Sample Journal Entry
INSERT INTO journal(user_id, date, method, amount, units, mood_before, mood_after, sleep_hours, notes) VALUES
(1, '2025-10-17', 'edible', 5, 'mg', 6, 8, 7.5, 'Felt relaxed after 90 minutes. Slept well.');
