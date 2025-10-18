import type { KVNamespace } from '@cloudflare/workers-types';

/**
 * Get a value from KV with JSON parsing
 */
export async function getJson<T = any>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  const value = await kv.get(key, 'json');
  return value as T | null;
}

/**
 * Set a value in KV with JSON serialization
 */
export async function setJson(
  kv: KVNamespace,
  key: string,
  value: any,
  expirationTtl?: number
): Promise<void> {
  await kv.put(key, JSON.stringify(value), {
    expirationTtl,
  });
}

/**
 * Delete a key from KV
 */
export async function del(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}

/**
 * Check if a key exists in KV
 */
export async function has(kv: KVNamespace, key: string): Promise<boolean> {
  const value = await kv.get(key);
  return value !== null;
}

/**
 * Increment a counter in KV
 */
export async function increment(
  kv: KVNamespace,
  key: string,
  expirationTtl?: number
): Promise<number> {
  const current = parseInt((await kv.get(key)) || '0', 10);
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl });
  return next;
}

/**
 * Get a counter value from KV
 */
export async function getCounter(
  kv: KVNamespace,
  key: string
): Promise<number> {
  return parseInt((await kv.get(key)) || '0', 10);
}
