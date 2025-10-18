const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:8787/api';

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

export interface Ad {
  id: number;
  region: string;
  tag: string | null;
  title: string;
  body_md: string;
  image_url: string;
  target_url: string;
  sponsor_name: string;
}

export interface JournalEntry {
  id?: number;
  user_id?: number;
  date?: string;
  method?: string;
  amount?: number;
  units?: string;
  mood_before?: number;
  mood_after?: number;
  sleep_hours?: number;
  notes?: string;
  created_at?: string;
}

/**
 * Fetch today's content card
 */
export async function getToday(date?: string): Promise<DayCard> {
  const query = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE}/today${query}`);
  if (!res.ok) throw new Error('Failed to fetch today\'s content');
  return res.json();
}

/**
 * Fetch calendar of all days
 */
export async function getCalendar(): Promise<{ cards: DayCard[] }> {
  const res = await fetch(`${API_BASE}/today/calendar`);
  if (!res.ok) throw new Error('Failed to fetch calendar');
  return res.json();
}

/**
 * Fetch ads
 */
export async function getAds(
  state?: string,
  tag?: string,
  date?: string
): Promise<{ source: string; items: Ad[] }> {
  const params = new URLSearchParams();
  if (state) params.set('state', state);
  if (tag) params.set('tag', tag);
  if (date) params.set('date', date);

  const query = params.toString() ? `?${params}` : '';
  const res = await fetch(`${API_BASE}/ads${query}`);
  if (!res.ok) throw new Error('Failed to fetch ads');
  return res.json();
}

/**
 * Track ad impression
 */
export async function trackAd(
  ad_id: number,
  event: 'view' | 'click',
  user_id?: number
): Promise<void> {
  await fetch(`${API_BASE}/ads/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ad_id, event, user_id }),
  });
}

/**
 * Create journal entry
 */
export async function createJournalEntry(
  entry: JournalEntry
): Promise<{ ok: boolean; id: number }> {
  const res = await fetch(`${API_BASE}/journal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Failed to create journal entry');
  return res.json();
}

/**
 * Get journal entries
 */
export async function getJournalEntries(
  user_id: number
): Promise<{ entries: JournalEntry[] }> {
  const res = await fetch(`${API_BASE}/journal?user_id=${user_id}`);
  if (!res.ok) throw new Error('Failed to fetch journal entries');
  return res.json();
}

/**
 * Get journal statistics
 */
export async function getJournalStats(
  user_id: number,
  days = 30
): Promise<{ stats: any }> {
  const res = await fetch(`${API_BASE}/journal/stats?user_id=${user_id}&days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch journal stats');
  return res.json();
}
