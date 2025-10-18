import type { D1Database, D1Result } from '@cloudflare/workers-types';

/**
 * Execute a prepared SQL statement
 */
export async function execute(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<D1Result> {
  return await db.prepare(query).bind(...params).run();
}

/**
 * Get a single row from the database
 */
export async function first<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T | null> {
  return await db.prepare(query).bind(...params).first();
}

/**
 * Get all rows from the database
 */
export async function all<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T[]> {
  const { results } = await db.prepare(query).bind(...params).all();
  return results as T[];
}

/**
 * Insert a record and return the inserted ID
 */
export async function insert(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<number> {
  const result = await db.prepare(query).bind(...params).run();
  return result.meta.last_row_id || 0;
}

/**
 * Check if a record exists
 */
export async function exists(
  db: D1Database,
  table: string,
  conditions: Record<string, any>
): Promise<boolean> {
  const where = Object.keys(conditions)
    .map((k) => `${k} = ?`)
    .join(' AND ');
  const values = Object.values(conditions);

  const result = await first(
    db,
    `SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`,
    values
  );

  return result !== null;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
