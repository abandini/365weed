/**
 * Extract region/state from Cloudflare request
 */
export function getRegionFromRequest(request: Request): string | null {
  const cf = (request as any).cf;
  if (!cf) return null;

  // Try to get US state code
  if (cf.country === 'US' && cf.region) {
    return cf.region; // e.g., "CA", "CO"
  }

  // Fallback to country code
  return cf.country || null;
}

/**
 * Get client IP address (hashed for privacy)
 */
export async function getIpHash(request: Request): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  return await hashString(ip);
}

/**
 * Get User-Agent hash
 */
export async function getUaHash(request: Request): Promise<string> {
  const ua = request.headers.get('user-agent') || 'unknown';
  return await hashString(ua);
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate region code (2-letter state/country code)
 */
export function validateRegion(region: string): boolean {
  return /^[A-Z]{2}$/.test(region);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}
