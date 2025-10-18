/**
 * Verify HMAC signature for pixel events
 */
export async function verifyHmac(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await createHmac(data, secret);
  return signature === expectedSignature;
}

/**
 * Create HMAC-SHA256 signature
 */
export async function createHmac(
  data: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  return arrayBufferToHex(signature);
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate random HMAC secret
 */
export function generateHmacSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToHex(array.buffer);
}
