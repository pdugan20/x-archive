import { extractEntities } from '@/lib/import/entity-extractor';
import type { ParsedTweet } from '@/lib/import/types';
import { describe, expect, it } from 'vitest';

function makeParsedTweet(overrides: Partial<ParsedTweet> = {}): ParsedTweet {
  return {
    id: '123',
    tweet_type: 'post',
    full_text: 'Hello world',
    created_at: '2024-01-01T12:00:00.000Z',
    retweet_count: 0,
    favorite_count: 0,
    reply_count: 0,
    quote_count: 0,
    in_reply_to_tweet_id: null,
    in_reply_to_user_id: null,
    in_reply_to_screen_name: null,
    quoted_tweet_id: null,
    retweeted_tweet_id: null,
    conversation_id: null,
    source: null,
    lang: null,
    raw_json: {},
    entities: { urls: [], hashtags: [], user_mentions: [] },
    ...overrides,
  };
}

describe('extractEntities', () => {
  it('extracts URLs', () => {
    const tweet = makeParsedTweet({
      entities: {
        urls: [
          {
            url: 'https://t.co/abc',
            expanded_url: 'https://example.com',
            display_url: 'example.com',
            indices: [10, 33],
          },
        ],
      },
    });

    const entities = extractEntities(tweet);
    expect(entities).toHaveLength(1);
    expect(entities[0].entity_type).toBe('url');
    expect(entities[0].expanded_url).toBe('https://example.com');
  });

  it('skips twitter status URLs (quote tweet references)', () => {
    const tweet = makeParsedTweet({
      entities: {
        urls: [
          {
            url: 'https://t.co/abc',
            expanded_url: 'https://twitter.com/user/status/123',
            display_url: 'twitter.com/user/status...',
            indices: [10, 33],
          },
        ],
      },
    });

    const entities = extractEntities(tweet);
    expect(entities).toHaveLength(0);
  });

  it('extracts hashtags in lowercase', () => {
    const tweet = makeParsedTweet({
      entities: {
        hashtags: [{ text: 'JavaScript', indices: [0, 11] }],
      },
    });

    const entities = extractEntities(tweet);
    expect(entities).toHaveLength(1);
    expect(entities[0].entity_type).toBe('hashtag');
    expect(entities[0].value).toBe('javascript');
  });

  it('extracts mentions', () => {
    const tweet = makeParsedTweet({
      entities: {
        user_mentions: [
          { screen_name: 'elonmusk', id_str: '44196397', indices: [0, 9] },
        ],
      },
    });

    const entities = extractEntities(tweet);
    expect(entities).toHaveLength(1);
    expect(entities[0].entity_type).toBe('mention');
    expect(entities[0].value).toBe('elonmusk');
  });

  it('extracts multiple entity types', () => {
    const tweet = makeParsedTweet({
      entities: {
        urls: [
          {
            url: 'https://t.co/x',
            expanded_url: 'https://example.com',
            display_url: 'example.com',
            indices: [20, 43],
          },
        ],
        hashtags: [{ text: 'test', indices: [0, 5] }],
        user_mentions: [{ screen_name: 'user', id_str: '1', indices: [6, 11] }],
      },
    });

    const entities = extractEntities(tweet);
    expect(entities).toHaveLength(3);
  });

  it('returns empty array for tweet with no entities', () => {
    const tweet = makeParsedTweet({ entities: {} });
    expect(extractEntities(tweet)).toHaveLength(0);
  });
});
