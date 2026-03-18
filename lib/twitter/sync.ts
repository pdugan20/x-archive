import { upsertEntities } from '@/lib/db/entities';
import { updateSettings } from '@/lib/db/settings';
import { upsertTweets } from '@/lib/db/tweets';
import type { TablesInsert } from '@/types/database';
import {
  getMe,
  getUserTweets,
  type XMediaObject,
  type XTweet,
} from './api-client';

function classifyTweetType(
  tweet: XTweet
): 'post' | 'reply' | 'retweet' | 'quote_tweet' {
  const refTypes = tweet.referenced_tweets?.map((r) => r.type) ?? [];
  if (refTypes.includes('retweeted')) return 'retweet';
  if (refTypes.includes('quoted')) return 'quote_tweet';
  if (refTypes.includes('replied_to')) return 'reply';
  return 'post';
}

function convertTweet(tweet: XTweet): TablesInsert<'tweets'> {
  const tweetType = classifyTweetType(tweet);
  const replied = tweet.referenced_tweets?.find((r) => r.type === 'replied_to');
  const quoted = tweet.referenced_tweets?.find((r) => r.type === 'quoted');
  const retweeted = tweet.referenced_tweets?.find(
    (r) => r.type === 'retweeted'
  );

  return {
    id: tweet.id,
    tweet_type: tweetType,
    full_text: tweet.text,
    created_at: tweet.created_at,
    retweet_count: tweet.public_metrics.retweet_count,
    favorite_count: tweet.public_metrics.like_count,
    reply_count: tweet.public_metrics.reply_count,
    quote_count: tweet.public_metrics.quote_count,
    bookmark_count: tweet.public_metrics.bookmark_count,
    view_count: tweet.public_metrics.impression_count,
    in_reply_to_tweet_id: replied?.id ?? null,
    in_reply_to_user_id: tweet.in_reply_to_user_id ?? null,
    quoted_tweet_id: quoted?.id ?? null,
    retweeted_tweet_id: retweeted?.id ?? null,
    conversation_id: tweet.conversation_id ?? null,
    source: tweet.source ?? null,
    lang: tweet.lang ?? null,
    raw_json: tweet as unknown as import('@/types/database').Json,
    import_source: 'api',
  };
}

function convertEntities(tweet: XTweet): TablesInsert<'tweet_entities'>[] {
  const entities: TablesInsert<'tweet_entities'>[] = [];

  if (tweet.entities?.urls) {
    for (const url of tweet.entities.urls) {
      // Skip twitter status URLs (quote tweet refs)
      if (/twitter\.com\/\w+\/status\/\d+/.test(url.expanded_url)) continue;
      if (/x\.com\/\w+\/status\/\d+/.test(url.expanded_url)) continue;

      entities.push({
        tweet_id: tweet.id,
        entity_type: 'url',
        value: url.url,
        expanded_url: url.expanded_url,
        display_url: url.display_url,
        title: url.title ?? null,
        start_index: url.start,
        end_index: url.end,
      });
    }
  }

  if (tweet.entities?.hashtags) {
    for (const h of tweet.entities.hashtags) {
      entities.push({
        tweet_id: tweet.id,
        entity_type: 'hashtag',
        value: h.tag.toLowerCase(),
        start_index: h.start,
        end_index: h.end,
      });
    }
  }

  if (tweet.entities?.mentions) {
    for (const m of tweet.entities.mentions) {
      entities.push({
        tweet_id: tweet.id,
        entity_type: 'mention',
        value: m.username,
        start_index: m.start,
        end_index: m.end,
      });
    }
  }

  if (tweet.entities?.cashtags) {
    for (const c of tweet.entities.cashtags) {
      entities.push({
        tweet_id: tweet.id,
        entity_type: 'cashtag',
        value: c.tag,
        start_index: c.start,
        end_index: c.end,
      });
    }
  }

  return entities;
}

function convertMedia(
  tweet: XTweet,
  mediaObjects: XMediaObject[]
): TablesInsert<'tweet_media'>[] {
  const mediaKeys = tweet.attachments?.media_keys ?? [];
  const results: TablesInsert<'tweet_media'>[] = [];

  for (const key of mediaKeys) {
    const media = mediaObjects.find((m) => m.media_key === key);
    if (!media) continue;

    results.push({
      id: media.media_key,
      tweet_id: tweet.id,
      media_type: media.type,
      original_url: media.url ?? media.preview_image_url ?? '',
      width: media.width ?? null,
      height: media.height ?? null,
      alt_text: media.alt_text ?? null,
      duration_ms: media.duration_ms ?? null,
      video_url: media.type === 'video' ? (media.url ?? null) : null,
    });
  }

  return results;
}

/**
 * Sync recent tweets from the X API into the database.
 * Fetches tweets since the last sync, or the most recent 100 if no prior sync.
 */
export async function syncRecentTweets(): Promise<{
  synced: number;
  entities: number;
  media: number;
}> {
  // Get the authenticated user's ID
  const me = await getMe();
  let totalSynced = 0;
  let totalEntities = 0;
  let totalMedia = 0;

  // Find our most recent tweet in the DB to use as since_id
  const { getSupabaseAdmin } = await import('@/lib/db/supabase');
  const supabase = getSupabaseAdmin();
  const { data: latestTweet } = await supabase
    .from('tweets')
    .select('id')
    .eq('import_source', 'api')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const sinceId = latestTweet?.id;

  let nextToken: string | undefined;
  do {
    const result = await getUserTweets(me.id, {
      sinceId,
      maxResults: 100,
      paginationToken: nextToken,
    });

    if (result.tweets.length === 0) break;

    // Convert and upsert tweets
    const tweetRows = result.tweets.map(convertTweet);
    const { error: tweetsError } = await upsertTweets(tweetRows);
    if (tweetsError) {
      console.error(`[SYNC] Failed to upsert tweets: ${tweetsError.message}`);
    }

    // Convert and insert entities
    const entityRows = result.tweets.flatMap(convertEntities);
    if (entityRows.length > 0) {
      const { error: entitiesError } = await upsertEntities(entityRows);
      if (entitiesError) {
        console.error(
          `[SYNC] Failed to insert entities: ${entitiesError.message}`
        );
      }
    }

    // Convert and upsert media
    const mediaRows = result.tweets.flatMap((t) =>
      convertMedia(t, result.media)
    );
    if (mediaRows.length > 0) {
      const { upsertMedia: upsertMediaFn } = await import('@/lib/db/media');
      const { error: mediaError } = await upsertMediaFn(mediaRows);
      if (mediaError) {
        console.error(`[SYNC] Failed to upsert media: ${mediaError.message}`);
      }
    }

    totalSynced += result.tweets.length;
    totalEntities += entityRows.length;
    totalMedia += mediaRows.length;
    nextToken = result.nextToken;
  } while (nextToken);

  // Update settings
  await updateSettings({
    last_sync_at: new Date().toISOString(),
    x_user_id: me.id,
    x_username: me.username,
  });

  return { synced: totalSynced, entities: totalEntities, media: totalMedia };
}
