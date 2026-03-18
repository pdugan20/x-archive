# x-archive

Archive and auto-delete old tweets from X/Twitter. Built with Next.js 16 (App Router),
Supabase, and Tailwind CSS 4. Deployed on Vercel.

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
app/                     Next.js App Router pages and API routes
  api/                   REST endpoints (health, cron jobs)
  archive/               Tweet timeline browse view
  media/                 Media gallery
  links/                 Extracted URLs view
  search/                Full-text search
  settings/              Retention and deletion settings
  import/                Twitter data export import
  tweet/[id]/            Single tweet detail
  thread/[id]/           Thread view
  stats/                 Dashboard and analytics
components/              React components
  ui/                    UI primitives
lib/                     Core business logic
  db/                    Supabase client and query functions
  twitter/               X API client, OAuth, rate limiting
  import/                Twitter data export parser and media downloader
  deletion/              Auto-deletion scheduler and executor
  utils/                 Shared utilities (cron auth, validations)
types/                   TypeScript type definitions
scripts/                 Utility scripts
  cli/                   CLI tools (import-archive)
  lint/                  Pre-commit checks (check-no-emoji)
  db/                    Database utilities (seed)
tests/                   Vitest unit tests (mirrors lib/ structure)
docs/                    Documentation and project tracker
supabase/                Migrations and config
```

## Architecture

- **Database**: Supabase PostgreSQL. All DB functions in `lib/db/`.
- **Storage**: Supabase Storage for tweet images and video thumbnails.
- **X API**: Pay-per-use tier for ongoing sync and deletion. Client in `lib/twitter/`.
- **Cron**: Vercel cron jobs for auto-deletion and tweet sync.
- **Import**: Twitter data export (zip) parsed via `lib/import/`.

## Conventions

- **Import alias**: `@/*` maps to project root
- **Validation**: Zod schemas for all external input
- **Database**: No ORM. Direct Supabase client queries. `getSupabaseAdmin()` is lazy.
- **Components**: Named exports. UI primitives in `components/ui/`.
- **TypeScript**: Strict mode. No `any` types (warned by ESLint). Unused vars must be `_` prefixed.
- **Formatting**: Prettier with organize-imports and tailwindcss plugins. Single quotes, semicolons, 80 char width.

## Rules

- No emojis in code, logs, or documentation. Enforced by ESLint rule, pre-commit hook, and CI.
- Use `console.warn()` or `console.error()` only. `console.log()` triggers ESLint warnings.
- Environment variables are validated at call time, not module load time.

## Environment Variables

Required for runtime (set in Vercel for Production and Preview):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_ACCESS_TOKEN`, `X_REFRESH_TOKEN`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (optional)
