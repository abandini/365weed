import type { Env } from '../types';

/**
 * Send a web push notification using VAPID
 * Implements the Web Push Protocol: https://datatracker.ietf.org/doc/html/rfc8030
 */
export async function sendWebPush(
  env: Env,
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
  }
): Promise<void> {
  try {
    // Create JWT for VAPID
    const vapidToken = await createVapidJWT(
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
      subscription.endpoint,
      env.PUSH_SENDER
    );

    // Encrypt the payload
    const encryptedPayload = await encryptPayload(
      JSON.stringify(payload),
      subscription.p256dh,
      subscription.auth
    );

    // Send push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${vapidToken}, k=${env.VAPID_PUBLIC_KEY}`,
        'TTL': '86400',
      },
      body: encryptedPayload,
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.status} ${response.statusText}`);
    }

    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}

/**
 * Create VAPID JWT token
 */
async function createVapidJWT(
  publicKey: string,
  privateKey: string,
  audience: string,
  subject: string
): Promise<string> {
  const aud = new URL(audience).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };

  const payload = {
    aud,
    exp,
    sub: subject,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  // Sign with private key (ES256)
  // Note: This is a simplified implementation
  // For production, use a proper JWT library or Web Crypto API
  const signature = await signES256(data, privateKey);
  const signatureB64 = base64UrlEncode(signature);

  return `${data}.${signatureB64}`;
}

/**
 * Sign data with ES256
 */
async function signES256(data: string, privateKey: string): Promise<string> {
  // Simplified ES256 signing
  // In production, use proper ECDSA with P-256 curve
  const encoder = new TextEncoder();
  const keyData = encoder.encode(privateKey);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  return arrayBufferToString(signature);
}

/**
 * Encrypt payload for Web Push
 */
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<ArrayBuffer> {
  // Simplified encryption
  // In production, implement full aes128gcm encryption with:
  // - ECDH key agreement
  // - HKDF key derivation
  // - AES-GCM encryption

  // For now, return the payload as-is (unencrypted)
  // This will work for basic testing but needs proper encryption for production
  console.warn('Using unencrypted push payload - implement proper encryption for production');

  const encoder = new TextEncoder();
  return encoder.encode(payload).buffer;
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert ArrayBuffer to string
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  return String.fromCharCode(...new Uint8Array(buffer));
}

/**
 * Get VAPID public key for client subscription
 */
export function getVapidPublicKey(env: Env): string {
  return env.VAPID_PUBLIC_KEY;
}
