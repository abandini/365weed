# 365 Days of Weed

A Cloudflare Workers-based PWA that serves location-aware and day-aware ads, daily cannabis education content, private journals, and push notifications.

## Quick Start

```bash
# Install dependencies
npm install

# Set up Cloudflare resources
npm run setup

# Run locally
npm run dev

# Deploy
npm run deploy
```

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed development documentation.

## Features

- 📅 Daily cannabis education content
- 🎯 Location-aware sponsored content
- 📝 Private consumption journal
- 🔔 Push notifications
- 💰 Partner advertising platform
- 📊 ROAS tracking and analytics
- 🎫 Coupon code system
- 💳 Stripe integration for Pro subscriptions

## Tech Stack

- **Backend:** Cloudflare Workers + Hono
- **Frontend:** React + Vite (PWA)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** KV, R2
- **AI:** Cloudflare Workers AI
- **Queue:** Cloudflare Queues
- **Auth:** JWT + Turnstile
- **Payments:** Stripe

## License

MIT
