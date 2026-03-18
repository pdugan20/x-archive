# x-archive

[![CI](https://github.com/pdugan20/x-archive/workflows/CI/badge.svg)](https://github.com/pdugan20/x-archive/actions)
[![Node.js](https://img.shields.io/node/v/next?logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?logo=opensourceinitiative&logoColor=white)](https://opensource.org/licenses/MIT)

Archive and auto-delete old tweets from X/Twitter. Live at
[xarchive.co](https://xarchive.co).

## How It Works

1. Syncs your tweets via the X API (every 6 hours), including full retweet text and media
2. Stores everything in a browseable archive with search, media gallery, and stats
3. Auto-deletes tweets older than a configurable retention period (per type: posts, replies, retweets, quotes)
4. Protects viral tweets and keyword-matched tweets from deletion

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Storage)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Auth**: Supabase Auth with `@supabase/ssr`
- **API**: X API v2 with OAuth 1.0a
- **Deployment**: Vercel
- **Monitoring**: Sentry
- **Testing**: Vitest

## Getting Started

```bash
git clone https://github.com/pdugan20/x-archive.git
cd x-archive
npm install
cp .env.example .env.local   # Fill in your keys
npm run dev                   # http://localhost:3000
```

See [.env.example](.env.example) for required environment variables.

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm test                 # Run unit tests
npm run type-check       # TypeScript checking
npm run lint             # ESLint
npm run format           # Prettier
npm run import           # Import Twitter data export
npm run db:gen-types     # Regenerate Supabase types
```
