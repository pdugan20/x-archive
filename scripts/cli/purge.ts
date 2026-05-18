#!/usr/bin/env tsx

/**
 * CLI to purge (permanently delete from X) your own archived tweets.
 *
 * Scope is selectable so you can choose what counts as "your own":
 *   - default:           posts + replies
 *   - --include-quotes:  posts + replies + quote tweets
 * Retweets are never touched by this command.
 *
 * Deletion is paced in batches to respect the X API limit of 50 deletions
 * per 15 minutes. The run is fully resumable — already-deleted tweets are
 * skipped, so re-running after an interruption simply continues.
 *
 * Usage:
 *   npm run purge -- --dry-run                 Preview what would be deleted
 *   npm run purge                              Delete posts + replies
 *   npm run purge -- --include-quotes          Also delete quote tweets
 *   npm run purge -- --include-protected       Also delete is_protected tweets
 *   npm run purge -- --no-sync                 Skip the pre-purge X sync
 *   npm run purge -- --yes                     Skip the confirmation prompt
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { executeDeletions } from '@/lib/deletion/executor';
import { syncRecentTweets } from '@/lib/twitter/sync';
import type { Tables } from '@/types/database';
import { createInterface } from 'node:readline/promises';

// Load .env.local so the script works the same as `npm run dev`.
// If the file is absent, assume env vars are already exported.
try {
  process.loadEnvFile('.env.local');
} catch {
  // No .env.local — rely on the ambient environment.
}

// -- Argument parsing --

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

if (hasFlag('help')) {
  console.log(
    [
      'Usage: npm run purge -- [options]',
      '',
      'Permanently deletes your own tweets from X. Retweets are never touched.',
      '',
      'Options:',
      '  --dry-run            Preview the candidates without deleting anything',
      '  --include-quotes     Include quote tweets (default: posts + replies only)',
      '  --include-protected  Include tweets flagged is_protected',
      '  --no-sync            Skip the pre-purge sync from the X API',
      '  --yes                Skip the interactive confirmation prompt',
      '  --help               Show this message',
    ].join('\n')
  );
  process.exit(0);
}

const dryRun = hasFlag('dry-run');
const includeQuotes = hasFlag('include-quotes');
const includeProtected = hasFlag('include-protected');
const skipSync = hasFlag('no-sync');
const autoYes = hasFlag('yes');

// "Your own" tweets: posts and replies you wrote. Quote tweets are opt-in.
const scopeTypes = includeQuotes
  ? ['post', 'reply', 'quote_tweet']
  : ['post', 'reply'];

const BATCH_SIZE = 45; // headroom under the X limit of 50 per 15 minutes
const RATE_WINDOW_MS = 15 * 60 * 1000 + 30_000; // 15 min + 30s buffer

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

type Tweet = Tables<'tweets'>;

/** Count non-deleted tweets in scope, optionally only the protected ones. */
async function countInScope(onlyProtected: boolean): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false)
    .eq('is_protected', onlyProtected)
    .in('tweet_type', scopeTypes);
  if (error) {
    throw new Error(`Failed to count tweets: ${error.message}`);
  }
  return count ?? 0;
}

/** Fetch the next batch of deletion candidates, oldest first. */
async function fetchBatch(): Promise<Tweet[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('tweets')
    .select('*')
    .eq('is_deleted', false)
    .in('tweet_type', scopeTypes)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);
  if (!includeProtected) {
    query = query.eq('is_protected', false);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch candidates: ${error.message}`);
  }
  return data;
}

async function confirm(count: number): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `\nThis will PERMANENTLY delete ${count} tweet(s) from X. ` +
      `This cannot be undone.\nType DELETE to proceed: `
  );
  rl.close();
  return answer.trim() === 'DELETE';
}

// -- Main --

async function main(): Promise<void> {
  console.log(`[INFO] Purge scope: ${scopeTypes.join(', ')}`);
  console.log(`[INFO] Mode: ${dryRun ? 'DRY RUN (no deletions)' : 'LIVE'}`);

  // Freshen the archive so the candidate set reflects the live account.
  if (skipSync) {
    console.log('[INFO] Skipping pre-purge sync (--no-sync)');
  } else {
    console.log('[INFO] Syncing recent tweets from X...');
    const synced = await syncRecentTweets();
    console.log(
      `[INFO] Sync complete: ${synced.synced} tweets, ${synced.media} media`
    );
  }

  const total = await countInScope(false);
  const protectedCount = await countInScope(true);

  console.log(`[INFO] Candidates in scope: ${total}`);
  if (protectedCount > 0) {
    console.log(
      `[INFO] Protected tweets in scope: ${protectedCount} ` +
        `(${includeProtected ? 'INCLUDED via --include-protected' : 'skipped'})`
    );
  }

  if (total === 0 && !(includeProtected && protectedCount > 0)) {
    console.log('[INFO] Nothing to purge. Done.');
    return;
  }

  if (dryRun) {
    const sample = await fetchBatch();
    console.log('\n[INFO] Dry run — first candidates (oldest first):');
    for (const t of sample.slice(0, 10)) {
      const text = t.full_text.replace(/\s+/g, ' ').substring(0, 70);
      console.log(`  ${t.created_at}  ${t.tweet_type.padEnd(11)}  ${text}`);
    }
    console.log('\n[INFO] Dry run complete. No tweets were deleted.');
    return;
  }

  const target = includeProtected ? total + protectedCount : total;
  if (!autoYes) {
    const ok = await confirm(target);
    if (!ok) {
      console.log('[INFO] Confirmation not given. Aborted.');
      return;
    }
  }

  let deleted = 0;
  let failed = 0;
  let batchNum = 0;
  let zeroProgressBatches = 0;

  for (;;) {
    const batch = await fetchBatch();
    if (batch.length === 0) break;

    batchNum++;
    console.log(
      `\n[INFO] Batch ${batchNum}: deleting ${batch.length} tweet(s)...`
    );
    const res = await executeDeletions(batch, false, 'manual_purge');
    deleted += res.success;
    failed += res.failed;
    console.log(
      `[INFO] Batch ${batchNum}: ${res.success} deleted, ${res.failed} failed`
    );

    if (res.success === 0) {
      zeroProgressBatches++;
      if (zeroProgressBatches >= 3) {
        console.error(
          '[ERROR] Three consecutive batches made no progress. ' +
            'Aborting — check the errors above. Re-run to resume.'
        );
        break;
      }
    } else {
      zeroProgressBatches = 0;
    }

    const remaining = await countInScope(false);
    const remainingProtected = includeProtected ? await countInScope(true) : 0;
    if (remaining + remainingProtected === 0) break;

    const mins = Math.ceil(RATE_WINDOW_MS / 60000);
    console.log(
      `[INFO] ${remaining + remainingProtected} tweet(s) remaining. ` +
        `Waiting ${mins} min for the X rate-limit window to reset...`
    );
    await sleep(RATE_WINDOW_MS);
  }

  console.log('\n[SUCCESS] Purge run finished.');
  console.log(`  Deleted: ${deleted}`);
  console.log(`  Failed:  ${failed}`);
  if (failed > 0) {
    console.log(
      '  Note: failed tweets are not marked deleted — re-run to retry them.'
    );
  }
}

main().catch((err: unknown) => {
  console.error('[ERROR] Purge failed:', err);
  process.exit(1);
});
