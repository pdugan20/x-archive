import { getSettings } from '@/lib/db/settings';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { Tables } from '@/types/database';
import { subDays } from 'date-fns';

type Tweet = Tables<'tweets'>;

interface RetentionConfig {
  post: number;
  reply: number;
  retweet: number;
  quote_tweet: number;
}

/**
 * Get tweets that are candidates for deletion based on per-type retention settings.
 * Applies protection rules: viral threshold, protected keywords, is_protected flag.
 */
export async function getCandidatesForDeletion(
  limit = 50
): Promise<{ candidates: Tweet[]; dryRun: boolean }> {
  const settings = await getSettings();

  if (!settings.auto_delete_enabled) {
    return { candidates: [], dryRun: settings.dry_run_mode };
  }

  const retention: RetentionConfig = {
    post: settings.retention_days_post,
    reply: settings.retention_days_reply,
    retweet: settings.retention_days_retweet,
    quote_tweet: settings.retention_days_quote_tweet,
  };

  const supabase = getSupabaseAdmin();

  // Query all non-deleted, non-protected tweets
  const { data: tweets, error } = await supabase
    .from('tweets')
    .select('*')
    .eq('is_deleted', false)
    .eq('is_protected', false)
    .order('created_at', { ascending: true })
    .limit(limit * 2); // Fetch extra since we'll filter some out

  if (error) {
    throw new Error(`Failed to fetch deletion candidates: ${error.message}`);
  }

  if (tweets.length === 0) {
    return { candidates: [], dryRun: settings.dry_run_mode };
  }

  const now = new Date();
  const candidates = tweets.filter((tweet) => {
    // Check per-type retention
    const tweetType = tweet.tweet_type as keyof RetentionConfig;
    const retentionDays = retention[tweetType];

    // 0 means never delete
    if (retentionDays === 0) return false;

    const cutoff = subDays(now, retentionDays);
    if (new Date(tweet.created_at) >= cutoff) return false;

    // Protect viral tweets
    if (tweet.favorite_count >= settings.viral_threshold) return false;

    // Protect tweets matching keywords
    const keywords = settings.protected_keywords ?? [];
    if (
      keywords.some((kw) =>
        tweet.full_text.toLowerCase().includes(kw.toLowerCase())
      )
    ) {
      return false;
    }

    return true;
  });

  return {
    candidates: candidates.slice(0, limit),
    dryRun: settings.dry_run_mode,
  };
}
