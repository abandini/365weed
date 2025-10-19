#!/usr/bin/env node
/**
 * Generate secure secrets for Cloudflare Workers
 */

const crypto = require('crypto');

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateVAPIDKeys() {
  // For production, use web-push library
  // npm install web-push
  // const webpush = require('web-push');
  // const vapidKeys = webpush.generateVAPIDKeys();

  // For now, generate placeholder keys
  return {
    publicKey: `BP${generateSecret(32)}`,
    privateKey: generateSecret(32)
  };
}

console.log('🔐 Generated Secrets for Cloudflare Workers\n');
console.log('Copy these to your Cloudflare dashboard or use wrangler secret put:\n');

const vapidKeys = generateVAPIDKeys();
console.log('# VAPID Keys (for Web Push)');
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log('');

console.log('# JWT Secret (for authentication)');
console.log(`JWT_SECRET="${generateSecret(32)}"`);
console.log('');

console.log('# Turnstile (get from Cloudflare dashboard)');
console.log(`TURNSTILE_SITE_KEY="your-site-key-here"`);
console.log(`TURNSTILE_SECRET_KEY="your-secret-key-here"`);
console.log('');

console.log('# Stripe (get from Stripe dashboard)');
console.log(`STRIPE_SECRET_KEY="sk_test_..."`);
console.log(`STRIPE_PUBLISHABLE_KEY="pk_test_..."`);
console.log(`STRIPE_PRICE_ID="price_..."`);
console.log(`STRIPE_WEBHOOK_SECRET="whsec_..."`);
console.log('');

console.log('\n📋 Commands to set secrets:');
console.log('');
console.log(`wrangler secret put VAPID_PUBLIC_KEY`);
console.log(`wrangler secret put VAPID_PRIVATE_KEY`);
console.log(`wrangler secret put JWT_SECRET`);
console.log(`wrangler secret put TURNSTILE_SECRET_KEY`);
console.log(`wrangler secret put STRIPE_SECRET_KEY`);
console.log('');

console.log('💡 For Stripe and Turnstile, get keys from their respective dashboards');
console.log('📚 Turnstile: https://dash.cloudflare.com/?to=/:account/turnstile');
console.log('📚 Stripe: https://dashboard.stripe.com/apikeys');
