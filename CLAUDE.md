# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**365DaysOfWeed** is a Cloudflare Workers-based PWA that serves location-aware and day-aware ads, daily cannabis education content, private journals, and push notifications. Built for adults 21+ in legal jurisdictions.

**Tech Stack:**
- **Backend:** Cloudflare Workers + Hono (TypeScript)
- **Frontend:** React + Vite (PWA)
- **Data:** D1 (SQLite), KV, R2, Queues, Durable Objects
- **Payments:** Stripe (Pro subscription)
- **Push:** Web Push API with VAPID

## Initial Setup

```bash
# Install dependencies
npm i

# Create Cloudflare resources
wrangler d1 create 365db
wrangler kv:namespace create 365_CACHE
wrangler kv:namespace create ADS
wrangler r2 bucket create weed-assets
wrangler r2 bucket create weed-partner-assets
wrangler queues create daily-broadcast

# Configure secrets
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put JWT_SECRET
wrangler secret put TURNSTILE_SECRET_KEY

# Apply database schema and seed demo data
wrangler d1 execute 365db --file ./worker/schema.sql
wrangler d1 execute 365db --file ./worker/seed/seed.sql
```

## Development Commands

```bash
# Run Worker locally
wrangler dev --local

# Run Worker with scheduled events
wrangler dev --test-scheduled

# Deploy Worker to production
wrangler deploy

# Build PWA frontend
cd app && npm i && npm run build

# Run tests
npm run test              # Unit tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)

# Database migrations
wrangler d1 migrations create 365db <name>
wrangler d1 migrations apply 365db
wrangler d1 migrations apply 365db --environment production
```

## Project Structure

```
/worker                    # Cloudflare Worker (Hono API)
  index.ts                 # Main Hono app + route mounting
  /routes                  # API route handlers
    today.ts               # Daily content cards
    ads.ts                 # Ad serving + tracking
    journal.ts             # User journal entries
    push.ts                # Push notification subscriptions
    partners.ts            # Partner portal (campaign CRUD)
    stripe.ts              # Stripe checkout + webhooks
    render.ts              # SSR for SEO
  /lib                     # Shared utilities
    db.ts                  # D1 helpers
    kv.ts                  # KV helpers
    geo.ts                 # IP geolocation + validation
    webpush.ts             # VAPID push notifications
  queue-consumer.ts        # Daily broadcast job
  durable.ts               # Rate limiting DO
  schema.sql               # D1 schema definition
  /seed                    # Database seeding
  types.ts                 # TypeScript definitions

/app                       # React PWA (frontend)
  /src
    /routes                # Page components
      Today.tsx            # Daily card + sponsored ads
      Calendar.tsx         # Historical view
      Journal.tsx          # User journal
      PartnerDashboard.tsx # Advertiser portal
    /lib
      api.ts               # API client
      push.ts              # Push subscription helpers
    sw.ts                  # Service worker
  vite.config.ts
  manifest.webmanifest

/ads                       # KV seed snapshots (demo)
```

## Core Architecture

### Ad Serving Strategy (Multi-Tier)

Ads are served with location + date + tag awareness using a fallback chain:

1. **KV Primary:** `${region}-${date}` (e.g., `CA-2025-10-18`)
2. **KV Tag-based:** `${region}-${tag}` (e.g., `CA-sleep`)
3. **D1 Query:** Active campaigns matching region/date/tag window

**Frequency Capping:** KV keys `cap:<uid>:<ad_id>:<yyyymmdd>` limit exposures (default: 2/day).

**A/B Testing:** Creatives with same `variant_group` undergo weighted rotation; nightly job adjusts weights based on CTR.

### Data Flow

- **Daily Cards:** Fetched from D1 `day_cards` table, cached in KV for 1hr
- **Ads:** Served via `/api/ads` with region/tag/date parameters
- **Tracking:** POST `/api/ads/track` for view/click events → `ad_impressions` table
- **Redemptions:** Pixel fires or webhooks → `redemptions` table (HMAC-signed)
- **Attribution:** 7-day KV touchpoint: `attrib:<uid>:<campaign_id>`

### Authentication

- **Users:** Session-based (JWT in HttpOnly cookies)
- **Partners:** JWT + Turnstile for portal access; HMAC secret per partner for pixel validation

### Push Notifications

- VAPID keys stored as secrets
- Subscriptions in D1 `push_subscriptions`
- Daily broadcast via Queue consumer
- Library: `minipush` (Workers-compatible)

### Stripe Integration

- **Pro subscription:** Removes ads, unlocks analytics ($1.99/mo)
- **Webhook:** `/api/stripe/webhook` handles `checkout.session.completed`, `customer.subscription.*`
- **Middleware:** Sets `c.get('isPro')` flag; if true, `/api/ads` returns empty

## Database Schema Highlights

**Core tables:**
- `users`, `profiles` — User accounts + preferences
- `day_cards` — Daily educational content
- `journal` — User consumption logs
- `ads` — Legacy ad records (now use `campaigns`+`creatives`)
- `ad_impressions` — View/click tracking

**Partner/Ad System:**
- `partners`, `partner_api_keys` — Advertiser accounts
- `campaigns` — Ad campaigns (region/tag/dates)
- `creatives` — Ad variants with A/B testing (`variant_group`, `weight`)
- `coupons` — Discount codes
- `coupon_issues` — Per-user code assignments
- `redemptions` — Purchase tracking for ROAS
- `pixel_events` — Anti-fraud log

**Subscriptions:**
- `subscriptions` — Stripe customer/subscription mapping
- `push_subscriptions` — Web Push endpoints

## Important Patterns

### KV Caching Strategy

- **Ads:** Pre-seed KV with JSON for high-traffic dates/regions
- **Day Cards:** Auto-cache on first request (TTL: 3600s)
- **Frequency Caps:** Expiring counters (TTL: 24h)
- **Attribution:** Touchpoints expire after 7 days

### HMAC Pixel Verification

Partners sign redemption payloads:
```
signature = HMAC-SHA256(
  `${partner_id}|${campaign_id}|${coupon_code}|${order_id}|${revenue}|${currency}|${timestamp}`,
  partner.hmac_secret
)
```
Reject if timestamp ±10min or signature mismatch.

### Environment Variables (wrangler.toml)

```toml
[vars]
APP_BASE_URL = "https://365daysofweed.com"
PUSH_SENDER = "mailto:admin@365daysofweed.com"
STRIPE_PRICE_ID = "price_xxx_monthly"
STRIPE_PUBLISHABLE_KEY = "pk_live_..."
```

### Bindings

- `DB` — D1Database (365db)
- `CACHE` — KVNamespace (365_CACHE)
- `ADS` — KVNamespace (ADS)
- `ASSETS` — R2Bucket (weed-assets)
- `PARTNER_ASSETS` — R2Bucket (weed-partner-assets)
- `DAILY_QUEUE` — Queue (daily-broadcast)

## Testing

- **Unit:** Vitest with `@cloudflare/vitest-pool-workers` + Miniflare stubs
- **E2E:** Playwright against `wrangler dev --local`
- **Test DB:** Use in-memory D1/KV via Miniflare for integration tests

## Compliance & Safety

- **Age Gate:** 21+ only; validate via `profiles.is_21`
- **Location Restrictions:** Surface clear disclaimers; partners responsible for legal compliance
- **Privacy:** Hashed user identifiers; opt-in for tracking; no raw IP storage
- **Ad Content:** Sanitize `body_md`, validate URLs, reject inline JS

## CI/CD (GitHub Actions)

1. Push to `main` → runs tests (Vitest + Playwright)
2. If green → applies D1 migrations (`wrangler d1 migrations apply`)
3. Deploys Worker (`wrangler deploy`)
4. Separate workflow builds PWA and publishes to Cloudflare Pages

## Development Tips

- Use `.dev.vars` for local secrets (not committed)
- Seed demo data with partner "DreamCo" and sample campaigns via `worker/seed/demo.ts`
- QR codes for coupons: `/qr/<code>.svg` (cacheable SVG)
- Partner portal accessed at `/partner/*` routes
- Pro users: check `subscriptions.status='active'` and `current_period_end` timestamp
