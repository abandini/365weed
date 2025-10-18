// Cloudflare Worker Environment Bindings
export interface Env {
  // Database
  DB: D1Database;

  // KV Namespaces
  CACHE: KVNamespace;
  ADS: KVNamespace;

  // R2 Buckets
  ASSETS: R2Bucket;
  PARTNER_ASSETS: R2Bucket;

  // Queues
  DAILY_QUEUE: Queue;

  // AI
  AI: Ai;

  // Durable Objects
  RATE_LIMITER: DurableObjectNamespace;

  // Environment Variables
  APP_BASE_URL: string;
  PUSH_SENDER: string;
  ENVIRONMENT: string;

  // Secrets (set via wrangler secret)
  VAPID_PRIVATE_KEY: string;
  VAPID_PUBLIC_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_PRICE_ID: string;
  STRIPE_WEBHOOK_SECRET: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY: string;
}

// Domain Models
export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Profile {
  user_id: number;
  display_name: string;
  tz: string;
  state_code: string;
  is_21: number;
}

export interface DayCard {
  id: number;
  date: string;
  slug: string;
  title: string;
  body_md: string;
  spotlight_json: string;
  tags: string;
  hero_url: string;
  published_at: string;
}

export interface JournalEntry {
  id: number;
  user_id: number;
  date: string;
  method: string;
  amount: number;
  units: string;
  mood_before: number;
  mood_after: number;
  sleep_hours: number;
  notes: string;
  created_at: string;
}

export interface Ad {
  id: number;
  region: string;
  tag: string | null;
  start_date: string;
  end_date: string;
  title: string;
  body_md: string;
  image_url: string;
  target_url: string;
  sponsor_name: string;
  cpm_rate: number;
  created_at: string;
}

export interface Partner {
  id: number;
  name: string;
  email: string;
  hmac_secret: string;
  created_at: string;
}

export interface Campaign {
  id: number;
  partner_id: number;
  name: string;
  region: string;
  tag: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface Creative {
  id: number;
  campaign_id: number;
  title: string;
  body_md: string;
  image_url: string;
  target_url: string;
  cpm_rate: number;
  variant_group: string | null;
  weight: number;
  created_at: string;
}

export interface Coupon {
  id: number;
  campaign_id: number;
  code: string;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  region: string | null;
  starts_at: string;
  ends_at: string;
  max_redemptions: number;
  per_user_limit: number;
  status: string;
  created_at: string;
}

export interface Redemption {
  id: number;
  coupon_code: string;
  campaign_id: number;
  partner_id: number;
  order_id: string;
  revenue: number;
  currency: string;
  user_hash: string | null;
  redeemed_at: string;
}

export interface PushSubscription {
  id: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface AdResponse {
  source: 'kv' | 'd1' | 'kv:tag';
  items: Ad[];
}

// Request Body Types
export interface TrackAdRequest {
  ad_id: number;
  user_id?: number;
  event: 'view' | 'click';
  date?: string;
}

export interface CreateJournalRequest {
  user_id?: number;
  date?: string;
  method?: string;
  amount?: number;
  units?: string;
  mood_before?: number;
  mood_after?: number;
  sleep_hours?: number;
  notes?: string;
}

export interface PixelEventRequest {
  partner_id: number;
  campaign_id: number;
  coupon_code: string;
  order_id: string;
  revenue: number;
  currency: string;
  t: number;
  sig: string;
}
