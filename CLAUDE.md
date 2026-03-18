# x-archive

Archive and auto-delete old tweets from X/Twitter. Built with Next.js 16 (App Router),
Supabase, shadcn/ui, and Tailwind CSS 4. Deployed on Vercel at xarchive.co.

## Quick Reference

```bash
npm run dev              # Dev server
npm run build            # Production build
npm run test             # Vitest unit tests
npm run type-check       # TypeScript strict checking
npm run lint             # ESLint
npm run format:check     # Prettier check
npm run lint:md          # Markdownlint
npm run import           # Import Twitter data export
npm run db:gen-types     # Regenerate Supabase types
npm run db:schema        # Dump database schema
```

## Project Structure

```text
app/
  (app)/                 Authenticated app shell (sidebar layout)
    archive/             Tweet timeline with infinite scroll and type tabs
    media/               Image gallery with infinite scroll
    links/               Extracted URLs table
    search/              Full-text search
    settings/            Retention periods, deletion rules, toggles
    import/              Import instructions
    tweet/[id]/          Single tweet detail
    thread/[id]/         Thread view
    stats/               Dashboard and analytics
  api/
    auth/confirm/        Supabase Auth callback
    cron/sync-recent/    Sync new tweets from X API (every 6hrs)
    cron/delete-old-tweets/ Auto-delete expired tweets (daily 6am UTC)
    health/              Health check
    tweets/              Paginated tweets API for infinite scroll
    media/               Paginated media API for infinite scroll
  login/                 Login page (public)
components/
  ui/                    shadcn/ui primitives
  app-sidebar.tsx        Navigation sidebar
  tweet-card.tsx         Tweet display card
  tweet-list.tsx         Infinite scroll tweet list
  media-grid.tsx         Infinite scroll media grid
  sign-out-button.tsx    Sign out button
lib/
  db/                    Supabase clients and query functions
  twitter/               X API client, OAuth 1.0a, rate limiting, sync
  import/                Twitter data export parser and media downloader
  deletion/              Auto-deletion scheduler and executor
  utils/                 Cron auth, validations
types/
  database.ts            Auto-generated Supabase types
scripts/
  cli/import-archive.ts  CLI for importing Twitter data export
  lint/check-no-emoji.ts Pre-commit emoji check
tests/                   Vitest unit tests (mirrors lib/ structure)
supabase/
  migrations/            6 migrations (schema, storage, FTS, auth RLS, retention)
```

## Architecture

- **Database**: Supabase PostgreSQL. 5 tables: tweets, tweet_entities, tweet_media, settings,
  deletion_log. Full-text search via tsvector. RLS: service_role for writes, authenticated for reads.
- **Storage**: Supabase Storage `tweet-media` bucket for images and video thumbnails.
- **X API**: OAuth 1.0a with HMAC-SHA1 signing. Sync fetches original tweets for retweets to get
  full text and correct media URLs. Rate limit tracking with auto-wait.
- **Auth**: Supabase Auth with @supabase/ssr cookie-based sessions. Middleware redirects
  unauthenticated users to /login. Cron endpoints use CRON_SECRET bearer auth.
- **Cron**: Vercel cron jobs. Sync every 6hrs, deletion daily at 6am UTC.
- **UI**: shadcn/ui components. Infinite scroll on archive and media pages.

## Conventions

- **Import alias**: `@/*` maps to project root
- **Database**: No ORM. Direct Supabase client queries. `getSupabaseAdmin()` is lazy.
- **Components**: Named exports. UI primitives in `components/ui/`.
- **TypeScript**: Strict mode. No `any` types (warned by ESLint). Unused vars must be `_` prefixed.
- **Formatting**: Prettier with organize-imports and tailwindcss plugins. Single quotes, semicolons,
  80 char width.

## Rules

- No emojis in code, logs, or documentation. Enforced by ESLint rule, pre-commit hook, and CI.
- Use `console.warn()` or `console.error()` only. `console.log()` triggers ESLint warnings.
- Environment variables are validated at call time, not module load time.

## Environment Variables

Required for runtime (set in Vercel and .env.local):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`, `X_BEARER_TOKEN`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (optional)
