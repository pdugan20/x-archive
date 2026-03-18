import type { TablesInsert } from '@/types/database';
import type { ParsedTweet } from './types';

/**
 * Extract entities (URLs, hashtags, mentions, cashtags) from a parsed tweet
 * into rows ready for the tweet_entities table.
 */
export function extractEntities(
  tweet: ParsedTweet
): TablesInsert<'tweet_entities'>[] {
  const entities: TablesInsert<'tweet_entities'>[] = [];
  const { entities: raw } = tweet;

  // URLs
  if (raw.urls) {
    for (const url of raw.urls) {
      // Skip twitter.com status URLs (these are quote tweet references, not shared links)
      if (
        url.expanded_url &&
        /twitter\.com\/\w+\/status\/\d+/.test(url.expanded_url)
      ) {
        continue;
      }

      entities.push({
        tweet_id: tweet.id,
        entity_type: 'url',
        value: url.url,
        expanded_url: url.expanded_url,
        display_url: url.display_url,
        start_index: url.indices[0],
        end_index: url.indices[1],
      });
    }
  }

  // Hashtags
  if (raw.hashtags) {
    for (const hashtag of raw.hashtags) {
      entities.push({
        tweet_id: tweet.id,
        entity_type: 'hashtag',
        value: hashtag.text.toLowerCase(),
        start_index: hashtag.indices[0],
        end_index: hashtag.indices[1],
      });
    }
  }

  // Mentions
  if (raw.user_mentions) {
    for (const mention of raw.user_mentions) {
      entities.push({
        tweet_id: tweet.id,
        entity_type: 'mention',
        value: mention.screen_name,
        start_index: mention.indices[0],
        end_index: mention.indices[1],
      });
    }
  }

  // Cashtags (symbols)
  if (raw.symbols) {
    for (const symbol of raw.symbols) {
      entities.push({
        tweet_id: tweet.id,
        entity_type: 'cashtag',
        value: symbol.text,
        start_index: symbol.indices[0],
        end_index: symbol.indices[1],
      });
    }
  }

  return entities;
}

/**
 * Extract entities from multiple tweets.
 */
export function extractAllEntities(
  tweets: ParsedTweet[]
): TablesInsert<'tweet_entities'>[] {
  return tweets.flatMap(extractEntities);
}
