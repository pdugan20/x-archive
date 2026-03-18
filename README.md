# x-archive

[![CI](https://github.com/pdugan20/x-archive/actions/workflows/ci.yml/badge.svg)](https://github.com/pdugan20/x-archive/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-20-brightgreen)](https://nodejs.org/)
![License](https://img.shields.io/badge/license-private-lightgrey)

Archive and auto-delete old tweets from X/Twitter. Imports your Twitter data export, stores tweets with
full metadata and media, provides a browseable web UI, and auto-deletes tweets older than a configurable
retention period via the X API.

## Quick Start

```bash
git clone https://github.com/pdugan20/x-archive.git
cd x-archive
npm install
cp .env.example .env.local
# Fill in your Supabase and X API credentials
npm run dev
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (tweet media)
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel
- **Monitoring**: Sentry
- **Testing**: Vitest + Testing Library

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
```

## Documentation

See `docs/` for detailed documentation:

- `docs/tracker.md` -- Project tracker with phase checkboxes
- `docs/architecture.md` -- System architecture (coming soon)
- `docs/database-schema.md` -- Database schema reference (coming soon)
