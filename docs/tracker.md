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
- [ ] Write tests for DB query functions

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
- [ ] Create your user account in Supabase Auth dashboard
- [ ] Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
- [ ] Verify: unauthenticated users are redirected to /login
- [ ] Verify: authenticated users can access all app routes
- [ ] Verify: cron endpoints still work with CRON_SECRET (bypass auth middleware)
- [ ] Set up xarchive.co domain on Vercel
- [ ] Configure Supabase Auth site URL to <https://xarchive.co>

## Phase 3: Archive Import (Twitter Data Export)

- [ ] Create lib/import/parser.ts (parse tweets.js from zip)
- [ ] Create lib/import/entity-extractor.ts (URLs, hashtags, mentions)
- [ ] Create lib/import/media-downloader.ts (images to Supabase Storage)
- [ ] Create lib/import/thread-reconstructor.ts (self-reply chains)
- [ ] Create scripts/cli/import-archive.ts (CLI entry point)
- [ ] Create app/import/page.tsx (web UI for import)
- [ ] Create app/api/import/route.ts (upload handler)
- [ ] Write tests for parser
- [ ] Write tests for entity extractor
- [ ] Write tests for thread reconstructor
- [ ] Test with real Twitter data export

## Phase 4: Browse UI

- [ ] Create sidebar/layout component
- [ ] Create TweetCard component
- [ ] Create app/archive/page.tsx (timeline with type tabs, date filter, pagination)
- [ ] Create app/search/page.tsx (full-text search)
- [ ] Create app/media/page.tsx (image grid with lightbox)
- [ ] Create app/links/page.tsx (extracted URLs, grouped by domain)
- [ ] Create app/thread/[id]/page.tsx (thread view)
- [ ] Create app/tweet/[id]/page.tsx (single tweet detail)
- [ ] Create app/stats/page.tsx (dashboard: tweets/month, top domains, etc.)
- [ ] Create app/settings/page.tsx (retention, protection rules)
- [ ] Responsive design (mobile sidebar collapse)

## Phase 5: X API Integration

- [ ] Create X Developer App (pay-per-use tier)
- [ ] Complete OAuth 2.0 flow for user tokens
- [ ] Create lib/twitter/api-client.ts (read, delete, unretweet)
- [ ] Create lib/twitter/oauth.ts (token refresh)
- [ ] Create lib/twitter/rate-limiter.ts
- [ ] Create app/api/cron/sync-recent/route.ts (fetch new tweets)
- [ ] Add sync cron entry to vercel.json
- [ ] Test API client with real credentials

## Phase 6: Auto-Deletion System

- [ ] Create lib/deletion/scheduler.ts (find candidates, apply protection rules)
- [ ] Create lib/deletion/executor.ts (delete via API, log results)
- [ ] Create app/api/cron/delete-old-tweets/route.ts
- [ ] Add deletion cron entry to vercel.json
- [ ] Implement dry-run mode
- [ ] Implement protection rules (viral threshold, keywords, pinned)
- [ ] Wire up settings page form
- [ ] Write tests for scheduler
- [ ] Write tests for executor
- [ ] Test end-to-end with dry-run enabled
- [ ] Enable auto-delete in production

## Phase 7: GitHub / DevOps

- [x] Create CI workflow (.github/workflows/ci.yml)
- [x] Create Dependabot config (.github/dependabot.yml)
- [x] Create Dependabot auto-merge workflow
- [x] Create GitHub Ruleset (require Test + Lint and Format + Build)
- [x] Enable workflow permissions (can_approve_pull_request_reviews)
- [x] Disable unused Wiki/Projects in repo settings
- [x] Set repo description, topics
- [ ] Link Vercel project
- [ ] Set Vercel environment variables
- [x] Push initial commit and verify CI passes
- [ ] Create Slack channel + GitHub notifications (optional)
