# x-archive

[![CI](https://github.com/pdugan20/x-archive/actions/workflows/ci.yml/badge.svg)](https://github.com/pdugan20/x-archive/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Archive and auto-delete old tweets from X/Twitter. Syncs your tweets via the X API, stores them with
full metadata and media in a browseable web UI, and auto-deletes tweets older than a configurable
retention period.

Live at [xarchive.co](https://xarchive.co)

## Features

- **Tweet archive** with infinite scroll, type filtering (posts, replies, retweets, quotes), and full-text search
- **Auto-deletion** with per-type retention periods, viral tweet protection, and keyword allowlists
- **Media gallery** with images from archived tweets
- **Link extraction** with deduplication and domain grouping
- **Stats dashboard** with tweet counts, type breakdown, and top liked posts
- **Supabase Auth** with cookie-based sessions and middleware-protected routes
- **Cron jobs** for automated sync (every 6hrs) and deletion (daily)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Storage)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Auth**: Supabase Auth with @supabase/ssr
- **API**: X API v2 with OAuth 1.0a
- **Deployment**: Vercel
- **Monitoring**: Sentry
- **Testing**: Vitest

## Quick Start

```bash
git clone https://github.com/pdugan20/x-archive.git
cd x-archive
npm install
cp .env.example .env.local
# Fill in your Supabase and X API credentials
npm run dev
```

## Scripts

```bash
npm run dev              # Dev server
npm run build            # Production build
npm run test             # Run tests
npm run type-check       # TypeScript strict checking
npm run lint             # ESLint
npm run format:check     # Prettier check
npm run lint:md          # Markdownlint
npm run import           # Import Twitter data export
npm run db:gen-types     # Regenerate Supabase types
```

## License

[MIT](LICENSE)
