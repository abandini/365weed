# 365DaysOfWeed - Comprehensive Feature Implementation Plan

**Version:** 2.0
**Date:** 2025-10-21
**Status:** In Progress

---

## Executive Summary

This document outlines the complete implementation plan for 14 major feature additions to the 365DaysOfWeed PWA. Implementation is divided into 4 phases with parallel QA testing throughout.

**Total Estimated Time:** 6-8 weeks
**Priority:** Phase 1 features deliver immediate retention impact

---

## Phase 1: Core Engagement (Week 1-2)

### 1.1 Streaks & Gamification System

#### Database Schema
```sql
-- New tables
CREATE TABLE IF NOT EXISTS streaks (
  user_id INTEGER PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in TEXT, -- ISO date
  total_points INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- 'streak_7', 'streak_30', 'journal_100'
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  points INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER,
  achievement_id INTEGER,
  unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

CREATE TABLE IF NOT EXISTS streak_saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
  method TEXT, -- 'watch_ad', 'premium_perk'
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### API Endpoints
- `GET /api/streaks/:userId` - Get current streak data
- `POST /api/streaks/checkin` - Record daily check-in
- `POST /api/streaks/save` - Use streak save (watch ad)
- `GET /api/achievements` - List all achievements
- `GET /api/achievements/:userId` - Get user's unlocked achievements

#### Frontend Components
- `StreakBadge.tsx` - Display in header (flame icon + count)
- `AchievementModal.tsx` - Celebration overlay when unlocked
- `StreakSaveModal.tsx` - Prompt when streak about to break
- `AchievementsPage.tsx` - Full achievements gallery

#### Business Logic
- Check-in counts if: user visits site OR creates journal entry
- Streak breaks if >24hr gap (with timezone consideration)
- Streak save: Watch 30s video ad to extend grace period 12hr
- Points system: 10pts/day check-in, 50pts/achievement, 100pts/30-day streak

#### Testing Requirements
- Unit: Streak calculation with timezone edge cases
- Unit: Achievement unlock triggers
- Integration: Check-in API flow
- E2E: Full streak save flow with ad mock

---

### 1.2 Push Notification Content Delivery

#### Database Updates
```sql
-- Update reminders table to support multiple types
ALTER TABLE reminders ADD COLUMN notification_title TEXT;
ALTER TABLE reminders ADD COLUMN notification_body TEXT;
ALTER TABLE reminders ADD COLUMN notification_icon TEXT;

-- New table for notification history
CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  subscription_endpoint TEXT,
  title TEXT,
  body TEXT,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT, -- 'sent', 'failed', 'clicked'
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Queue Consumer Implementation
File: `worker/queue-consumer.ts`

```typescript
// Implement daily broadcast job
export default {
  async queue(batch, env) {
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's card
    const card = await env.DB.prepare(
      'SELECT * FROM day_cards WHERE date = ?'
    ).bind(today).first();

    if (!card) return;

    // Fetch all active subscriptions
    const subs = await env.DB.prepare(
      'SELECT * FROM push_subscriptions WHERE enabled = 1'
    ).all();

    // Send notifications (batched)
    for (const sub of subs.results) {
      await sendPushNotification(env, sub, {
        title: `Today's Cannabis Knowledge: ${card.title}`,
        body: card.title.substring(0, 100) + '...',
        icon: card.hero_url || '/icon-192.png',
        url: '/'
      });
    }
  }
};
```

#### Notification Types
1. **Daily Content** (9am user local time) - "Today's strain is..."
2. **Journal Reminder** (8pm user local time) - "Log your session"
3. **Streak Alert** (11pm if no check-in) - "Don't break your streak!"
4. **Achievement Unlock** (immediate) - "You earned [badge]!"
5. **Partner Campaigns** (opt-in) - "New 20% off coupon available"

#### API Endpoints
- `POST /api/notifications/schedule` - Schedule user notification
- `GET /api/notifications/history/:userId` - Get notification history
- `PUT /api/notifications/preferences` - Update notification prefs

#### Testing Requirements
- Unit: Notification payload generation
- Unit: Timezone conversion logic
- Integration: Queue consumer with mock subscriptions
- E2E: Full push flow (requires service worker)

---

### 1.3 Dark Mode Toggle

#### Implementation
File: `app/src/components/ThemeToggle.tsx`

```typescript
// Use localStorage + CSS variables
const themes = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--accent': '#17a34a'
  },
  dark: {
    '--bg-primary': '#0b0f0e',
    '--bg-secondary': '#1a1f1e',
    '--text-primary': '#f9fafb',
    '--text-secondary': '#9ca3af',
    '--accent': '#22c55e'
  }
};
```

#### Storage
- Store preference in localStorage: `theme_preference`
- Sync with backend: `profiles.theme_preference` column
- Respect system preference: `prefers-color-scheme` media query

#### Testing Requirements
- Unit: Theme switching logic
- E2E: Toggle persists across sessions

---

## Phase 2: Retention & Insights (Week 3-4)

### 2.1 Social Sharing & Referral Program

#### Database Schema
```sql
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER,
  referred_user_id INTEGER,
  referral_code TEXT UNIQUE NOT NULL,
  signup_date TEXT,
  reward_granted INTEGER DEFAULT 0, -- boolean
  reward_type TEXT, -- 'pro_week', 'points'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS share_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  content_type TEXT, -- 'daily_card', 'achievement', 'journal_milestone'
  content_id TEXT,
  platform TEXT, -- 'twitter', 'facebook', 'native'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### API Endpoints
- `GET /api/referrals/code/:userId` - Get user's referral code
- `POST /api/referrals/validate` - Validate referral code at signup
- `POST /api/share` - Track share event
- `GET /api/share/card/:date` - Generate OG meta for shared card

#### Open Graph Implementation
File: `worker/routes/og.ts`

```typescript
// Dynamic OG tags for shared content
app.get('/share/:type/:id', async (c) => {
  // Generate custom OG image with Cloudflare Images
  const ogImage = await generateOGImage(c.env, type, id);

  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${ogImage}" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
    </html>
  `);
});
```

#### Referral Rewards
- Referrer: 7 days free Pro after 1st referred signup
- Referred: 500 bonus points on signup
- Milestone bonuses: 5 referrals = 1 month free Pro

#### Testing Requirements
- Unit: Referral code generation (unique, readable)
- Integration: Referral validation and reward granting
- E2E: Full referral flow from share to signup

---

### 2.2 Weekly Email Reports

#### Database Schema
```sql
CREATE TABLE IF NOT EXISTS email_subscriptions (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  enabled INTEGER DEFAULT 1,
  last_sent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  template TEXT, -- 'weekly_report', 'achievement', 'streak_alert'
  payload_json TEXT, -- JSON data for template
  scheduled_for TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Email Templates
File: `worker/emails/templates/`

1. `weekly-report.html` - Weekly summary with:
   - Total journal entries this week
   - Mood improvement percentage
   - Average sleep hours
   - Top consumption method
   - Chart images (generated via QuickChart API)

2. `achievement-unlock.html` - Achievement celebration
3. `streak-milestone.html` - Streak milestones (7, 30, 100, 365 days)

#### Scheduled Job
File: `worker/cron/email-sender.ts`

```typescript
// Runs every Monday 9am
export async function sendWeeklyReports(env: Env) {
  const subscribers = await env.DB.prepare(
    `SELECT user_id, email FROM email_subscriptions
     WHERE enabled = 1 AND frequency = 'weekly'`
  ).all();

  for (const sub of subscribers.results) {
    const stats = await getWeeklyStats(env, sub.user_id);
    await queueEmail(env, {
      user_id: sub.user_id,
      template: 'weekly_report',
      payload: stats
    });
  }
}
```

#### Email Service Integration
- Use Cloudflare Email Routing for receiving
- Use Mailgun/SendGrid for sending (env: `EMAIL_API_KEY`)
- Rate limit: 100 emails/hour per user to prevent spam

#### API Endpoints
- `PUT /api/email/subscribe` - Subscribe to email reports
- `PUT /api/email/unsubscribe` - Unsubscribe from emails
- `GET /api/email/preview/:userId` - Preview weekly report

#### Testing Requirements
- Unit: Email template rendering with sample data
- Unit: Weekly stats calculation
- Integration: Email queue processing
- Manual: Send test emails to verify deliverability

---

### 2.3 Personalized Recommendations

#### Database Schema
```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY,
  preferred_tags TEXT, -- comma-separated: 'sleep,focus,pain'
  preferred_methods TEXT, -- comma-separated: 'vape,edible'
  goals TEXT, -- JSON: {"sleep": true, "focus": true}
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  content_id INTEGER, -- day_card id
  feedback TEXT, -- 'helpful', 'not_helpful', 'irrelevant'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Recommendation Engine
File: `worker/lib/recommendations.ts`

```typescript
interface RecommendationScore {
  card: DayCard;
  score: number;
  reasons: string[];
}

export async function getPersonalizedRecommendations(
  env: Env,
  userId: number
): Promise<RecommendationScore[]> {
  // 1. Analyze journal patterns
  const journalStats = await analyzeJournalPatterns(env, userId);

  // 2. Get user preferences
  const prefs = await getUserPreferences(env, userId);

  // 3. Score all cards
  const cards = await getAllCards(env);
  const scored = cards.map(card => {
    let score = 0;
    const reasons = [];

    // Mood matching
    if (journalStats.lowSleep && card.tags.includes('sleep')) {
      score += 10;
      reasons.push('Helps with sleep');
    }

    // Method matching
    if (prefs.preferred_methods.some(m => card.tags.includes(m))) {
      score += 5;
      reasons.push('Matches your consumption method');
    }

    // Goal alignment
    if (prefs.goals?.focus && card.tags.includes('focus')) {
      score += 8;
      reasons.push('Supports your focus goal');
    }

    return { card, score, reasons };
  });

  // 4. Return top 5
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}
```

#### API Endpoints
- `GET /api/recommendations/:userId` - Get personalized content
- `PUT /api/preferences/:userId` - Update user preferences
- `POST /api/recommendations/feedback` - Submit feedback on recommendation

#### Frontend Components
- `RecommendationsCarousel.tsx` - Horizontal scrolling cards on Today page
- `PreferencesModal.tsx` - Onboarding wizard to set initial preferences
- `RecommendationCard.tsx` - Card with "Why this?" tooltip

#### Testing Requirements
- Unit: Scoring algorithm with various journal patterns
- Unit: Edge case handling (new user, no data)
- Integration: Full recommendation API flow
- A/B Test: Randomized vs personalized recommendations (measure engagement)

---

## Phase 3: Monetization & Intelligence (Week 5-6)

### 3.1 Tiered Subscriptions (Premium Tier)

#### Database Schema
```sql
-- Update subscriptions table
ALTER TABLE subscriptions ADD COLUMN tier TEXT DEFAULT 'pro';
-- 'free', 'pro', 'premium', 'partner_pro'

CREATE TABLE IF NOT EXISTS subscription_tiers (
  tier_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER, -- cents
  price_annual INTEGER, -- cents
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  features_json TEXT, -- JSON array of features
  display_order INTEGER,
  active INTEGER DEFAULT 1
);

-- Insert tier definitions
INSERT INTO subscription_tiers VALUES
('free', 'Free', 0, 0, NULL, NULL,
 '["Daily content", "30-day journal history", "Basic stats"]', 1, 1),
('pro', 'Pro', 199, 1990, 'price_pro_monthly', 'price_pro_annual',
 '["Ad-free", "365-day journal", "Advanced stats", "Email reports"]', 2, 1),
('premium', 'Premium', 499, 4990, 'price_premium_monthly', 'price_premium_annual',
 '["All Pro features", "AI insights", "Priority support", "Partner discounts"]', 3, 1),
('partner_pro', 'Partner Pro', 999, 9990, 'price_partner_monthly', 'price_partner_annual',
 '["All Premium features", "Advanced analytics", "A/B testing", "White-label reports"]', 4, 1);
```

#### Stripe Configuration
File: `worker/lib/stripe-tiers.ts`

```typescript
export const STRIPE_PRICES = {
  pro_monthly: 'price_1QWxxx', // $1.99
  pro_annual: 'price_1QWyyy',  // $19.90
  premium_monthly: 'price_1QWzzz', // $4.99
  premium_annual: 'price_1QWaaa', // $49.90
};

export function getTierFeatures(tier: string): string[] {
  const features = {
    free: ['daily_content', 'journal_30d', 'basic_stats'],
    pro: ['ad_free', 'journal_365d', 'advanced_stats', 'email_reports'],
    premium: ['ai_insights', 'priority_support', 'partner_discounts'],
    partner_pro: ['analytics_dashboard', 'ab_testing', 'white_label']
  };
  return features[tier] || [];
}
```

#### Feature Gating Middleware
File: `worker/middleware/tier-gate.ts`

```typescript
export function requireTier(minTier: string) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    const userTier = await getUserTier(c.env.DB, userId);

    const tierHierarchy = ['free', 'pro', 'premium', 'partner_pro'];
    const userLevel = tierHierarchy.indexOf(userTier);
    const requiredLevel = tierHierarchy.indexOf(minTier);

    if (userLevel < requiredLevel) {
      return c.json({
        error: 'Upgrade required',
        current_tier: userTier,
        required_tier: minTier,
        upgrade_url: '/upgrade'
      }, 403);
    }

    await next();
  };
}
```

#### API Endpoints
- `GET /api/tiers` - List all subscription tiers
- `POST /api/stripe/upgrade` - Create upgrade checkout session
- `POST /api/stripe/downgrade` - Handle downgrade request
- `GET /api/features/check/:feature` - Check if user has access to feature

#### Frontend Components
- `PricingPage.tsx` - Tier comparison table with toggle (monthly/annual)
- `UpgradeModal.tsx` - Triggered when hitting tier limit
- `TierBadge.tsx` - Display user's tier in profile

#### Migration Strategy
- Existing Pro users → automatically `pro` tier
- Free users → `free` tier
- Grace period: 30 days to choose annual (20% discount)

#### Testing Requirements
- Unit: Tier hierarchy and feature access logic
- Integration: Stripe webhook handling for upgrades/downgrades
- E2E: Full upgrade flow from free → premium
- Manual: Test Stripe billing portal tier changes

---

### 3.2 AI-Powered Insights (Cloudflare AI)

#### Database Schema
```sql
CREATE TABLE IF NOT EXISTS ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  insight_type TEXT, -- 'sleep_pattern', 'mood_prediction', 'strain_match'
  insight_text TEXT,
  confidence REAL, -- 0-1 score
  data_points_used INTEGER,
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  dismissed INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  query_text TEXT,
  response_text TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### AI Models Configuration
```typescript
// Use Cloudflare Workers AI
export const AI_MODELS = {
  chat: '@cf/meta/llama-3-8b-instruct',
  embeddings: '@cf/baai/bge-base-en-v1.5',
  text_generation: '@cf/mistral/mistral-7b-instruct-v0.1'
};
```

#### AI Features

**1. Natural Language Journal Queries**
```typescript
// "Show me nights I slept well after edibles"
async function queryJournal(env: Env, userId: number, query: string) {
  const entries = await getJournalEntries(env, userId);

  const prompt = `
You are analyzing cannabis journal entries. User asks: "${query}"

Journal data:
${JSON.stringify(entries, null, 2)}

Provide a concise answer with specific dates and insights.
`;

  const response = await env.AI.run(AI_MODELS.chat, {
    messages: [{ role: 'user', content: prompt }]
  });

  return response.response;
}
```

**2. Predictive Insights**
```typescript
// Analyze patterns and predict outcomes
async function generatePredictiveInsights(env: Env, userId: number) {
  const stats = await getJournalStats(env, userId, 90); // 90 days

  const prompt = `
Analyze this cannabis wellness data and provide 3 actionable insights:

Sleep average: ${stats.avg_sleep} hours
Mood improvement: ${stats.mood_delta}%
Methods used: ${stats.methods.join(', ')}
Best sleep nights: ${stats.best_sleep_methods}

Focus on patterns and recommendations.
`;

  const response = await env.AI.run(AI_MODELS.text_generation, {
    prompt,
    max_tokens: 200
  });

  return parseInsights(response.response);
}
```

**3. Strain Matching**
```typescript
// Match user goals to strain characteristics
async function matchStrains(env: Env, userId: number, goal: string) {
  // Get user's journal patterns
  const patterns = await analyzeUserPatterns(env, userId);

  // Get strain database (from day_cards with tags)
  const strains = await getStrainDatabase(env);

  // Use embeddings for semantic matching
  const goalEmbedding = await env.AI.run(AI_MODELS.embeddings, {
    text: `${goal} ${patterns.preferred_effects}`
  });

  const matches = strains.map(strain => ({
    strain,
    similarity: cosineSimilarity(goalEmbedding, strain.embedding)
  })).sort((a, b) => b.similarity - a.similarity);

  return matches.slice(0, 5);
}
```

#### API Endpoints
- `POST /api/ai/query` - Ask question about journal (Premium+)
- `GET /api/ai/insights/:userId` - Get generated insights (Premium+)
- `POST /api/ai/match-strain` - Get strain recommendations (Premium+)
- `POST /api/ai/generate-content` - AI content generation (Partners only)

#### Rate Limiting
- Free: 0 queries/month
- Pro: 0 queries/month
- Premium: 100 queries/month
- Partner Pro: Unlimited

#### Cost Management
- Cache common queries in KV (24hr TTL)
- Batch insight generation (weekly cron job, not on-demand)
- Monitor token usage per user (alert if >threshold)

#### Testing Requirements
- Unit: Prompt engineering with sample data
- Unit: Response parsing and validation
- Integration: AI binding with mock responses
- Load test: Concurrent AI requests (rate limiting)
- Manual: Quality assessment of AI outputs

---

### 3.3 Sponsored Content Program

#### Database Schema
```sql
-- Update day_cards table
ALTER TABLE day_cards ADD COLUMN sponsored INTEGER DEFAULT 0;
ALTER TABLE day_cards ADD COLUMN sponsor_partner_id INTEGER;
ALTER TABLE day_cards ADD COLUMN sponsor_cpm_rate INTEGER; -- cents

CREATE TABLE IF NOT EXISTS sponsored_content_calendar (
  date TEXT PRIMARY KEY,
  partner_id INTEGER,
  card_id INTEGER,
  approved INTEGER DEFAULT 0,
  approved_by INTEGER, -- admin user_id
  approved_at TEXT,
  price INTEGER, -- cents
  FOREIGN KEY (partner_id) REFERENCES partners(id),
  FOREIGN KEY (card_id) REFERENCES day_cards(id)
);

CREATE TABLE IF NOT EXISTS partner_content_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER,
  proposed_date TEXT,
  title TEXT,
  body_md TEXT,
  hero_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'published'
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewer_notes TEXT,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);
```

#### Partner API Endpoints
- `POST /api/partners/content/submit` - Submit sponsored content
- `GET /api/partners/content/submissions` - List submissions
- `PUT /api/partners/content/:id` - Update submission (if pending)

#### Admin API Endpoints
- `GET /api/admin/content/pending` - List pending submissions
- `PUT /api/admin/content/:id/approve` - Approve submission
- `PUT /api/admin/content/:id/reject` - Reject with feedback
- `GET /api/admin/content/calendar` - View sponsored content calendar

#### Content Guidelines
File: `worker/lib/content-moderation.ts`

```typescript
export async function validateSponsoredContent(content: {
  title: string;
  body_md: string;
}): Promise<{ valid: boolean; issues: string[] }> {
  const issues = [];

  // Length requirements
  if (content.body_md.length < 200) {
    issues.push('Content must be at least 200 characters');
  }

  // Educational value check
  if (!hasEducationalContent(content.body_md)) {
    issues.push('Content must be educational, not purely promotional');
  }

  // Prohibited content
  const prohibited = ['guaranteed results', 'medical claims', 'cure'];
  for (const term of prohibited) {
    if (content.body_md.toLowerCase().includes(term)) {
      issues.push(`Prohibited term: "${term}"`);
    }
  }

  // Link limits
  const linkCount = (content.body_md.match(/\[.*?\]\(.*?\)/g) || []).length;
  if (linkCount > 2) {
    issues.push('Maximum 2 links allowed');
  }

  return { valid: issues.length === 0, issues };
}
```

#### Pricing Model
- **Base price:** $500/day (weekday), $750/day (weekend)
- **Premium dates:** $1000/day (holidays: 4/20, 7/10, etc.)
- **Volume discount:** 10+ days = 15% off
- **Cancellation:** 7-day notice or forfeit 50%

#### Frontend Components
- `SponsoredBadge.tsx` - "Sponsored by [Brand]" badge on card
- `PartnerContentForm.tsx` - Submission form with preview
- `AdminReviewPanel.tsx` - Admin approval interface (future)

#### Editorial Policy
- Max 2 sponsored posts per week (Tues/Thurs)
- Clear "Sponsored" disclosure at top
- Must meet educational standards (reviewed by admin)
- Cannot contradict previous content

#### Testing Requirements
- Unit: Content validation rules
- Integration: Submission → approval → publication flow
- E2E: Full partner content submission
- Manual: Review content quality standards

---

## Phase 4: Community & Growth (Week 7-8)

### 4.1 Community Features (Anonymous Stats)

#### Database Views
```sql
CREATE VIEW community_stats_daily AS
SELECT
  date(created_at) as stat_date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_entries,
  AVG(mood_after - mood_before) as avg_mood_improvement,
  AVG(sleep_hours) as avg_sleep
FROM journal
WHERE created_at >= date('now', '-7 days')
GROUP BY stat_date;

CREATE VIEW trending_methods AS
SELECT
  method,
  COUNT(*) as usage_count,
  AVG(mood_after - mood_before) as avg_mood_delta
FROM journal
WHERE created_at >= date('now', '-30 days')
GROUP BY method
ORDER BY usage_count DESC;
```

#### API Endpoints
- `GET /api/community/stats/daily` - Daily community stats
- `GET /api/community/trending/methods` - Trending consumption methods
- `GET /api/community/insights` - Aggregated insights (state-level)
- `GET /api/community/leaderboard` - Anonymized streak leaderboard

#### Frontend Components
- `CommunityStatsWidget.tsx` - Display on Today page:
  - "X people journaled in CA today"
  - "87% reported better mood after sativa"
  - "Top method this week: Vaping"
- `TrendingStrains.tsx` - Most-logged strains this month
- `RegionalInsights.tsx` - State-specific trends

#### Privacy Safeguards
- Never show stats if <10 users in cohort
- Round all percentages to nearest 5%
- Hash user IDs in leaderboards (show rank only, not name)
- Aggregate at state level minimum (never city-level)

#### Testing Requirements
- Unit: Aggregation queries with sample data
- Security: Verify no PII leakage in responses
- Load test: Community stats endpoint (likely high traffic)

---

### 4.2 Affiliate Commissions Tracking

#### Database Schema
```sql
CREATE TABLE IF NOT EXISTS affiliate_partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT, -- 'weedmaps', 'leafly', 'dutchie', 'jane'
  commission_rate REAL, -- percentage (e.g., 5.0 for 5%)
  cookie_duration INTEGER DEFAULT 30, -- days
  api_key TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  affiliate_partner_id INTEGER,
  product_url TEXT,
  click_id TEXT UNIQUE, -- trackable click ID
  referrer_page TEXT, -- which page they clicked from
  clicked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (affiliate_partner_id) REFERENCES affiliate_partners(id)
);

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  click_id TEXT,
  order_id TEXT,
  revenue INTEGER, -- cents
  commission INTEGER, -- cents
  converted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (click_id) REFERENCES affiliate_clicks(click_id)
);
```

#### Click Tracking Implementation
File: `worker/routes/affiliate.ts`

```typescript
app.get('/go/:clickId', async (c) => {
  const clickId = c.req.param('clickId');

  // Log click
  const click = await c.env.DB.prepare(
    'SELECT * FROM affiliate_clicks WHERE click_id = ?'
  ).bind(clickId).first();

  if (!click) {
    return c.redirect('/');
  }

  // Build affiliate URL with our tracking params
  const targetUrl = new URL(click.product_url);
  targetUrl.searchParams.set('ref', '365weed');
  targetUrl.searchParams.set('click_id', clickId);

  // Store click timestamp in KV for conversion tracking
  await c.env.CACHE.put(
    `click:${clickId}`,
    JSON.stringify({ timestamp: Date.now(), user_id: click.user_id }),
    { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
  );

  return c.redirect(targetUrl.toString());
});
```

#### Conversion Tracking
```typescript
// Webhook from affiliate partner
app.post('/api/affiliate/conversion', async (c) => {
  const { click_id, order_id, revenue } = await c.req.json();

  // Validate signature from partner
  const signature = c.req.header('X-Affiliate-Signature');
  if (!validateSignature(signature, click_id)) {
    return c.json({ error: 'Invalid signature' }, 403);
  }

  // Get affiliate partner commission rate
  const click = await getClickData(c.env, click_id);
  const partner = await getAffiliatePartner(c.env, click.affiliate_partner_id);

  const commission = Math.floor(revenue * (partner.commission_rate / 100));

  // Record conversion
  await c.env.DB.prepare(`
    INSERT INTO affiliate_conversions (click_id, order_id, revenue, commission)
    VALUES (?, ?, ?, ?)
  `).bind(click_id, order_id, revenue, commission).run();

  return c.json({ success: true });
});
```

#### Frontend Integration
File: `app/src/components/ActionButton.tsx`

```typescript
// Wrap all external links with affiliate tracking
function AffiliateLink({ url, children }) {
  const handleClick = async (e) => {
    e.preventDefault();

    // Create click record
    const { click_id } = await fetch('/api/affiliate/create-click', {
      method: 'POST',
      body: JSON.stringify({ url })
    }).then(r => r.json());

    // Redirect through tracking URL
    window.location.href = `/go/${click_id}`;
  };

  return <a href={url} onClick={handleClick}>{children}</a>;
}
```

#### Affiliate Partner Integrations
1. **Weedmaps** - Dispensary affiliate program
2. **Leafly** - Strain marketplace
3. **Dutchie** - E-commerce platform
4. **Jane** - Online ordering

#### Revenue Split
- Platform keeps 80% of commission
- Optional: Share 20% with content creator if sponsored content drove click

#### Dashboard
- Partner dashboard: Show total clicks, conversions, commission earned
- User opt-in: "Support us" badge shows they're helping via clicks

#### Testing Requirements
- Unit: Click ID generation (collision-free)
- Integration: Full click → conversion flow
- Security: Signature validation
- E2E: Track click from Today page → mock conversion

---

### 4.3 Onboarding Flow Wizard

#### Flow Steps
```
1. Welcome Screen → "Welcome to 365 Days of Weed"
2. Age Verification → "Are you 21 or older?" (Yes/No)
3. Location → "Select your state" (dropdown)
4. Goals → "What brings you here?" (checkboxes: sleep, focus, pain, anxiety, recreation)
5. Notifications → "Stay updated" (Enable push notifications)
6. First Journal Entry → "Log your first session" (optional, can skip)
7. Complete → "You're all set!" (redirect to /today)
```

#### Database Updates
```sql
-- Track onboarding completion
ALTER TABLE profiles ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN onboarding_started_at TEXT;
ALTER TABLE profiles ADD COLUMN onboarding_completed_at TEXT;
```

#### Frontend Component
File: `app/src/routes/Onboarding.tsx`

```typescript
export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});

  const steps = [
    <WelcomeStep key={1} onNext={() => setStep(2)} />,
    <AgeVerification key={2} onNext={(age) => { setData({...data, is_21: age}); setStep(3); }} />,
    <LocationStep key={3} onNext={(state) => { setData({...data, state_code: state}); setStep(4); }} />,
    <GoalsStep key={4} onNext={(goals) => { setData({...data, goals}); setStep(5); }} />,
    <NotificationsStep key={5} onNext={() => setStep(6)} />,
    <FirstJournalStep key={6} onNext={() => completeOnboarding()} onSkip={() => completeOnboarding()} />,
    <CompleteStep key={7} />
  ];

  return (
    <div className="onboarding-container">
      <ProgressBar current={step} total={7} />
      {steps[step - 1]}
    </div>
  );
}
```

#### Analytics
Track drop-off at each step:
```sql
CREATE TABLE IF NOT EXISTS onboarding_analytics (
  session_id TEXT PRIMARY KEY,
  user_id INTEGER,
  started_at TEXT,
  current_step INTEGER,
  completed INTEGER DEFAULT 0,
  dropped_at_step INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Testing Requirements
- E2E: Complete full onboarding flow
- E2E: Test skip functionality
- E2E: Test back button behavior
- Analytics: Verify drop-off tracking

---

## Testing Strategy

### QA Agent Setup

#### Unit Testing Agent
Runs continuously as features are implemented:
```bash
# Vitest in watch mode
npm run test:watch -- --reporter=verbose
```

#### Integration Testing Agent
Runs after each API endpoint is completed:
```bash
# Test against local wrangler dev
wrangler dev --local &
npm run test:integration
```

#### E2E Testing Agent
Runs after each frontend component is completed:
```bash
# Playwright with parallel workers
npm run test:e2e -- --workers=4
```

#### Regression Testing Agent
Runs before each phase completion:
```bash
# Full test suite
npm run test:all
```

### Test Coverage Requirements
- **Unit tests:** 80% coverage minimum
- **Integration tests:** All API endpoints
- **E2E tests:** Critical user paths
  - Daily content view
  - Journal creation
  - Streak check-in
  - Push notification subscription
  - Subscription upgrade
  - Referral flow

### Test Data
File: `worker/seed/test-data.sql`

```sql
-- Create test users with various profiles
INSERT INTO users (id, email) VALUES
  (1, 'test@example.com'),
  (2, 'premium@example.com'),
  (3, 'free@example.com');

-- Create test journal entries with patterns
INSERT INTO journal (user_id, date, method, mood_before, mood_after, sleep_hours) VALUES
  (1, '2025-10-01', 'vape', 4, 8, 7.5),
  (1, '2025-10-02', 'edible', 5, 7, 8.0),
  -- ... 90 days of data for pattern testing
```

---

## Deployment Strategy

### Phase Rollout
Each phase deploys independently:

```bash
# Phase 1 deployment
git checkout -b feature/phase-1-engagement
# ... implement features ...
npm run test:all
git commit -m "feat: Phase 1 - Streaks, Push, Dark Mode"
git push origin feature/phase-1-engagement
# Create PR → review → merge → auto-deploy
```

### Feature Flags
File: `worker/lib/feature-flags.ts`

```typescript
export const FEATURES = {
  streaks: true,
  push_notifications: true,
  dark_mode: true,
  referrals: false, // Phase 2
  ai_insights: false, // Phase 3
  sponsored_content: false, // Phase 3
};

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}
```

### Database Migrations
Sequential migration files:
```
worker/migrations/
  001_streaks.sql
  002_achievements.sql
  003_referrals.sql
  004_email_subscriptions.sql
  005_tier_updates.sql
  006_ai_insights.sql
  007_sponsored_content.sql
  008_affiliate_tracking.sql
```

Apply migrations:
```bash
# Development
wrangler d1 migrations apply 365db --local

# Production
wrangler d1 migrations apply 365db --remote
```

### Rollback Plan
Each feature has rollback script:
```sql
-- Example: worker/migrations/rollback_001_streaks.sql
DROP TABLE IF EXISTS streaks;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS user_achievements;
```

---

## Performance Targets

### API Response Times
- `GET /api/today`: <100ms (KV cached)
- `GET /api/streaks/:userId`: <50ms (simple query)
- `POST /api/journal`: <200ms (write + update streak)
- `GET /api/recommendations/:userId`: <500ms (complex computation)
- `POST /api/ai/query`: <3000ms (AI inference)

### Frontend Metrics (Core Web Vitals)
- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1

### Scalability
- **KV Operations**: 1000 reads/sec (Cloudflare limit: 100k/sec)
- **D1 Queries**: 100 queries/sec (current limit, will increase)
- **AI Requests**: 10 concurrent (rate limited per tier)
- **Push Notifications**: 1000/min (batched via queue)

---

## Monitoring & Alerts

### Metrics to Track
1. **User Engagement**
   - Daily active users (DAU)
   - Streak retention (7-day, 30-day)
   - Journal entries per user per week
   - Push notification open rate

2. **Monetization**
   - Free → Pro conversion rate (target: 5%)
   - Pro → Premium upgrade rate (target: 10%)
   - Churn rate (target: <5%/month)
   - Affiliate commission revenue

3. **Technical Health**
   - API error rate (target: <0.1%)
   - P95 response time
   - Worker CPU time
   - D1 query latency

### Alerting Rules
```yaml
# Cloudflare Workers Analytics
alerts:
  - name: High Error Rate
    condition: error_rate > 1%
    notify: email, slack

  - name: Slow AI Responses
    condition: ai_p95_latency > 5s
    notify: email

  - name: Push Delivery Failure
    condition: push_failure_rate > 10%
    notify: slack
```

---

## Documentation Updates

### Files to Update
1. `README.md` - Add new features overview
2. `API.md` - Document all new endpoints
3. `CLAUDE.md` - Update project structure
4. `CHANGELOG.md` - Version history
5. `DEPLOYMENT.md` - Updated deployment steps

### Partner Documentation
File: `docs/PARTNER_API.md`

- How to submit sponsored content
- Affiliate integration guide
- Analytics dashboard usage
- HMAC signature generation

---

## Security Considerations

### Authentication Enhancements
- Implement proper user login (currently mocked)
- Add OAuth providers (Google, Apple)
- Session timeout: 7 days
- Refresh token rotation

### Data Privacy
- GDPR compliance: Add data export endpoint
- CCPA compliance: Add "Do Not Sell" option
- User data deletion: 30-day soft delete

### Content Security
- CSP headers for XSS prevention
- Image upload virus scanning (R2 → Cloudflare Images)
- Rate limiting on all POST endpoints
- CAPTCHA on signup (Turnstile)

### Payment Security
- PCI compliance via Stripe (no card data stored)
- Webhook signature validation
- Fraud detection (velocity checks)

---

## Success Metrics

### Phase 1 Goals (Week 2)
- ✅ 50% of users enable push notifications
- ✅ 30% of users maintain 7-day streak
- ✅ 70% of users prefer dark mode

### Phase 2 Goals (Week 4)
- ✅ 20% referral participation rate
- ✅ 40% email report open rate
- ✅ 15% increase in session time (recommendations)

### Phase 3 Goals (Week 6)
- ✅ 5% free → Pro conversion
- ✅ 10% Pro → Premium conversion
- ✅ 100 AI queries/day (avg)
- ✅ 2 sponsored posts/week sold

### Phase 4 Goals (Week 8)
- ✅ 1000+ community stat views/day
- ✅ $500/month affiliate revenue
- ✅ 80% onboarding completion rate

---

## Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloudflare AI rate limits | High | Cache responses, batch requests |
| D1 query slowness at scale | Medium | Add indexes, use KV for hot data |
| Push notification delivery failures | Medium | Retry logic, fallback to email |
| Stripe webhook delays | Low | Idempotency keys, queue processing |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low Premium conversion | High | A/B test pricing, improve value prop |
| Sponsored content quality | Medium | Strict editorial guidelines, manual review |
| Affiliate partner disputes | Low | Clear TOS, automated reporting |

### Compliance Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Age verification bypass | High | Multi-step verification, audit logs |
| State-level ad restrictions | Medium | Geo-blocking, legal review per state |
| Data breach | High | Encryption at rest, SOC 2 compliance |

---

## Post-Launch Optimization

### A/B Tests to Run
1. **Pricing Page**
   - Monthly vs Annual emphasis
   - Feature list order
   - "Most Popular" badge placement

2. **Recommendations**
   - Algorithmic vs Random (control)
   - 3 vs 5 vs 10 recommendations
   - Carousel vs Grid layout

3. **Push Notifications**
   - Send time (9am vs 12pm vs 8pm)
   - Message tone (casual vs formal)
   - Frequency (daily vs 3x/week)

4. **Onboarding**
   - 7 steps vs 4 steps (condensed)
   - Skip vs Required fields
   - Immediate journal entry vs delayed

### Feature Iteration
Based on analytics:
- **Streaks**: Add streak freezes (purchase with points)
- **Recommendations**: Collaborative filtering (users like you)
- **AI Insights**: Conversational chat interface
- **Community**: Public profiles (opt-in)

---

## Appendix

### Tech Stack Summary
- **Backend:** Cloudflare Workers, Hono, TypeScript
- **Frontend:** React 18, Vite 5, TailwindCSS
- **Data:** D1 (SQLite), KV, R2
- **AI:** Cloudflare Workers AI
- **Payments:** Stripe
- **Email:** Mailgun
- **Push:** Web Push API (VAPID)
- **Testing:** Vitest, Playwright, Miniflare

### Dependencies to Add
```json
{
  "dependencies": {
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "date-fns": "^2.30.0",
    "zod": "^3.22.0",
    "hono-rate-limiter": "^0.3.0"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.1.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### Cloudflare Bindings to Add
```toml
[env.production.vars]
EMAIL_API_KEY = "mailgun_key_here"
AI_ENABLED = "true"
AFFILIATE_SECRET = "secret_here"

[[env.production.analytics_engine_datasets]]
binding = "ANALYTICS"
```

---

**END OF IMPLEMENTATION PLAN**

This plan will be updated as we progress through each phase. All changes are tracked in git commits with descriptive messages following conventional commits (feat:, fix:, docs:, test:).
