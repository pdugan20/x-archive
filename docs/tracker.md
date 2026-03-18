# x-archive Project Tracker

## Phase 1: Project Setup and Scaffolding

- [x] Create GitHub repo (private, pdugan20/x-archive)
- [x] Initialize Next.js 16 project
- [x] Configure package.json (scripts, lint-staged)
- [x] Configure tsconfig.json (strict, path aliases)
- [x] Configure eslint.config.mjs (strictTypeChecked + security + no-emoji)
- [x] Configure .prettierrc (organize-imports + tailwindcss plugins)
- [x] Configure .markdownlint.json
- [x] Configure postcss.config.mjs
- [x] Set up Husky (pre-commit + pre-push hooks)
- [x] Create check-no-emoji script
- [x] Configure next.config.ts (Sentry, security headers, CDN rewrite)
- [x] Create .env.example
- [x] Configure vercel.json (ignore dependabot branches)
- [x] Create vitest.config.ts + test setup
- [x] Create Sentry config files (client, server, edge, instrumentation)
- [x] Create app layout + globals.css (design tokens, dark mode)
- [x] Create app/page.tsx (placeholder)
- [x] Create app/global-error.tsx
- [x] Create lib/db/supabase.ts (admin client)
- [x] Create lib/utils/cron-auth.ts
- [x] Create app/api/health/route.ts
- [x] Write CLAUDE.md
- [x] Write README.md (badges, quick start, tech stack)
- [x] Create docs/tracker.md
- [x] Install all dependencies at latest versions
- [x] Verify npm run lint passes
- [x] Verify npm run format:check passes
- [x] Verify npm run type-check passes
- [x] Verify npm run build passes

## Phase 2: Database Design

- [x] Create Supabase project (x-archive-app, us-west-1)
- [x] Migration 001: tweets, tweet_entities, tweet_media, settings, deletion_log tables
- [x] Migration 002: tweet-media storage bucket
- [x] Migration 003: full-text search (tsvector + GIN index)
- [x] Generate types (types/database.ts)
- [x] Create lib/db/tweets.ts (CRUD operations)
- [x] Create lib/db/media.ts
- [x] Create lib/db/settings.ts
- [x] Create lib/db/deletion-log.ts
- [x] Create lib/db/search.ts (full-text search)
- [x] Create lib/db/entities.ts (URLs, hashtags, mentions)
- [x] Write tests for DB query functions (settings, search)

## Phase 2b: Authentication (Supabase Auth)

- [x] Install @supabase/ssr
- [x] Create lib/db/supabase-browser.ts (client-side Supabase client with cookie-based sessions)
- [x] Create lib/db/supabase-server.ts (server-side Supabase client for Server Components)
- [x] Create middleware.ts (refresh session, redirect unauthenticated users to /login)
- [x] Create app/login/page.tsx (email/password form, polished UI with shadcn components)
- [x] Create app/login/actions.ts (server actions for sign-in/sign-out)
- [x] Create app/api/auth/confirm/route.ts (email confirmation callback)
- [x] Create components/sign-out-button.tsx
- [x] Add RLS SELECT policies for authenticated user (migration 004)
- [x] Create user account in Supabase Auth dashboard
- [x] Add env vars to .env.local
- [x] Verify: unauthenticated users are redirected to /login
- [x] Verify: authenticated users can access all app routes
- [x] Verify: cron endpoints still work with CRON_SECRET
- [x] Set up xarchive.co domain on Vercel (deployed, SSL live)
- [x] Set Vercel production env vars (all 10 configured)
- [x] Configure Supabase Auth site URL to `https://xarchive.co`
- [x] Verify xarchive.co SSL cert is live

## Phase 3: Archive Import (Twitter Data Export)

- [x] Create lib/import/types.ts (Twitter export format types)
- [x] Create lib/import/parser.ts (parse tweets.js from zip)
- [x] Create lib/import/entity-extractor.ts (URLs, hashtags, mentions)
- [x] Create lib/import/media-downloader.ts (images to Supabase Storage)
- [x] Create lib/import/thread-reconstructor.ts (self-reply chains)
- [x] Create scripts/cli/import-archive.ts (CLI entry point)
- [x] Create app/import/page.tsx (CLI instructions page)
- [x] Write tests for parser (7 tests)
- [x] Write tests for entity extractor (6 tests)
- [x] Write tests for thread reconstructor (6 tests)
- [-] Test with real Twitter data export (not needed: API sync fetches full RT data)

## Phase 4: Browse UI

- [x] Create sidebar/layout component (shadcn Sidebar with nav icons)
- [x] Create TweetCard component (context line, natural images, metrics)
- [x] Create app/archive/page.tsx (infinite scroll, type tabs)
- [x] Create app/search/page.tsx (full-text search via Postgres FTS)
- [x] Create app/media/page.tsx (infinite scroll image grid)
- [x] Create app/links/page.tsx (clean table, deduplicated, domain extraction)
- [x] Create app/thread/[id]/page.tsx (threaded conversation view)
- [x] Create app/tweet/[id]/page.tsx (detail with media, entities, thread link)
- [x] Create app/stats/page.tsx (counts, type breakdown, top liked posts)
- [x] Create app/settings/page.tsx (per-type retention, viral threshold, keywords, toggles)
- [x] Create app/import/page.tsx (CLI instructions)
- [x] Responsive design (shadcn sidebar collapses on mobile)

## Phase 5: X API Integration

- [x] Create X Developer App (pat-x-archive, Read and Write permissions)
- [x] Configure OAuth 1.0a credentials (consumer key + access token for @doog)
- [x] Create lib/twitter/oauth.ts (OAuth 1.0a HMAC-SHA1 request signing)
- [x] Create lib/twitter/rate-limiter.ts (track x-rate-limit headers, auto-wait)
- [x] Create lib/twitter/api-client.ts (getMe, getUserTweets, getTweetById, deleteTweet, undoRetweet)
- [x] Create lib/twitter/sync.ts (sync with RT enrichment: full text + correct media from originals)
- [x] Create app/api/cron/sync-recent/route.ts (cron endpoint with CRON_SECRET auth)
- [x] Smoke test: getMe returns @doog, getUserTweets returns tweets with media
- [x] Add sync cron entry to vercel.json
- [x] Add X API env vars to Vercel production
- [x] Initial sync: 901 tweets archived

## Phase 6: Auto-Deletion System

- [x] Migration: per-type retention (post, reply, retweet, quote_tweet)
- [x] Regenerate TypeScript types
- [x] Create lib/deletion/scheduler.ts (per-type retention, viral threshold, keyword protection)
- [x] Create lib/deletion/executor.ts (deleteTweet vs undoRetweet, 404 handling, audit logging)
- [x] Create app/api/cron/delete-old-tweets/route.ts (CRON_SECRET auth, dry-run support)
- [x] Add cron entries to vercel.json (sync every 6hrs, delete daily at 6am UTC)
- [x] Implement dry-run mode (default on, logs what would be deleted without calling API)
- [x] Implement protection rules (viral threshold, keywords, is_protected flag)
- [x] Wire up settings page form (per-type retention, toggles, keywords)
- [x] Write tests for scheduler (7 tests)
- [x] Write tests for executor (3 tests)
- [x] Test end-to-end with dry-run enabled
- [ ] Enable auto-delete in production (manual, when ready)

## Phase 7: GitHub / DevOps

- [x] Create CI workflow (.github/workflows/ci.yml)
- [x] Create Dependabot config (.github/dependabot.yml)
- [x] Create Dependabot auto-merge workflow
- [x] Create GitHub Ruleset (require Test + Lint and Format + Build)
- [x] Enable workflow permissions (can_approve_pull_request_reviews)
- [x] Disable unused Wiki/Projects in repo settings
- [x] Set repo description, topics
- [x] Link Vercel project
- [x] Set Vercel environment variables (all 10)
- [x] Push initial commit and verify CI passes
- [x] Deploy to production (xarchive.co live)
- [-] Create Slack channel + GitHub notifications (optional, deferred)
