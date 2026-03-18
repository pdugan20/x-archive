import { logDeletion } from '@/lib/db/deletion-log';
import { updateSettings } from '@/lib/db/settings';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { deleteTweet, getMe, undoRetweet } from '@/lib/twitter/api-client';
import type { Tables } from '@/types/database';

type Tweet = Tables<'tweets'>;

interface DeletionResult {
  success: number;
  failed: number;
  skipped: number;
}

/**
 * Execute deletions for a list of candidate tweets.
 * Handles retweets (undoRetweet) vs regular tweets (deleteTweet).
 * Logs every attempt to the deletion_log table.
 */
export async function executeDeletions(
  candidates: Tweet[],
  dryRun: boolean
): Promise<DeletionResult> {
  const result: DeletionResult = { success: 0, failed: 0, skipped: 0 };
  const supabase = getSupabaseAdmin();

  let userId: string | undefined;
  if (!dryRun) {
    const me = await getMe();
    userId = me.id;
  }

  for (const tweet of candidates) {
    const isRetweet = tweet.tweet_type === 'retweet';

    if (dryRun) {
      // Log as dry run without calling the API
      await logDeletion({
        tweet_id: tweet.id,
        tweet_type: tweet.tweet_type,
        tweet_text: tweet.full_text.substring(0, 500),
        tweet_created_at: tweet.created_at,
        deletion_reason: 'retention_expired',
        dry_run: true,
        was_retweet: isRetweet,
      });
      result.skipped++;
      continue;
    }

    try {
      const responseCode = 200;

      if (isRetweet && userId) {
        // Retweets use the unretweet endpoint
        const retweetedId = tweet.retweeted_tweet_id ?? tweet.id;
        await undoRetweet(userId, retweetedId);
      } else {
        await deleteTweet(tweet.id);
      }

      // Mark as deleted in our DB
      await supabase
        .from('tweets')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', tweet.id);

      // Log success
      await logDeletion({
        tweet_id: tweet.id,
        tweet_type: tweet.tweet_type,
        tweet_text: tweet.full_text.substring(0, 500),
        tweet_created_at: tweet.created_at,
        deletion_reason: 'retention_expired',
        api_response_code: responseCode,
        dry_run: false,
        was_retweet: isRetweet,
      });

      result.success++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      // If 404, the tweet was already deleted — mark it as such
      const is404 = message.includes('404');
      if (is404) {
        await supabase
          .from('tweets')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq('id', tweet.id);
      }

      await logDeletion({
        tweet_id: tweet.id,
        tweet_type: tweet.tweet_type,
        tweet_text: tweet.full_text.substring(0, 500),
        tweet_created_at: tweet.created_at,
        deletion_reason: 'retention_expired',
        api_response_code: is404 ? 404 : 500,
        api_error: message,
        dry_run: false,
        was_retweet: isRetweet,
      });

      if (is404) {
        result.success++; // Already gone, count as success
      } else {
        result.failed++;
        console.error(
          `[DELETE] Failed to delete tweet ${tweet.id}: ${message}`
        );
      }
    }
  }

  // Update last deletion run timestamp
  await updateSettings({
    last_deletion_run_at: new Date().toISOString(),
  });

  return result;
}
