import { parseTweet, parseTweetsJs } from '@/lib/import/parser';
import type { TwitterExportTweet } from '@/lib/import/types';
import { describe, expect, it } from 'vitest';

function makeTweet(
  overrides: Partial<TwitterExportTweet['tweet']> = {}
): TwitterExportTweet {
  return {
    tweet: {
      id_str: '123456789',
      full_text: 'Hello world',
      created_at: 'Mon Jan 01 12:00:00 +0000 2024',
      retweet_count: '5',
      favorite_count: '10',
      entities: { urls: [], hashtags: [], user_mentions: [] },
      ...overrides,
    },
  };
}

describe('parseTweet', () => {
  it('parses a basic post', () => {
    const result = parseTweet(makeTweet());

    expect(result.id).toBe('123456789');
    expect(result.tweet_type).toBe('post');
    expect(result.full_text).toBe('Hello world');
    expect(result.retweet_count).toBe(5);
    expect(result.favorite_count).toBe(10);
    expect(result.created_at).toBe('2024-01-01T12:00:00.000Z');
  });

  it('classifies a retweet', () => {
    const result = parseTweet(
      makeTweet({ full_text: 'RT @someone: Great tweet' })
    );
    expect(result.tweet_type).toBe('retweet');
  });

  it('classifies a reply', () => {
    const result = parseTweet(
      makeTweet({
        in_reply_to_status_id_str: '987654321',
        in_reply_to_screen_name: 'someone',
      })
    );
    expect(result.tweet_type).toBe('reply');
    expect(result.in_reply_to_tweet_id).toBe('987654321');
    expect(result.in_reply_to_screen_name).toBe('someone');
  });

  it('classifies a quote tweet', () => {
    const result = parseTweet(
      makeTweet({
        full_text: 'This is great https://t.co/abc123',
        entities: {
          urls: [
            {
              url: 'https://t.co/abc123',
              expanded_url: 'https://twitter.com/someone/status/111222333',
              display_url: 'twitter.com/someone/status...',
              indices: [15, 38],
            },
          ],
        },
      })
    );
    expect(result.tweet_type).toBe('quote_tweet');
    expect(result.quoted_tweet_id).toBe('111222333');
  });

  it('strips HTML from source', () => {
    const result = parseTweet(
      makeTweet({
        source:
          '<a href="http://twitter.com" rel="nofollow">Twitter Web App</a>',
      })
    );
    expect(result.source).toBe('Twitter Web App');
  });

  it('handles missing optional fields', () => {
    const result = parseTweet(
      makeTweet({
        reply_count: undefined,
        quote_count: undefined,
        conversation_id_str: undefined,
        lang: undefined,
      })
    );
    expect(result.reply_count).toBe(0);
    expect(result.quote_count).toBe(0);
    expect(result.conversation_id).toBeNull();
    expect(result.lang).toBeNull();
  });

  it('stores raw JSON', () => {
    const result = parseTweet(makeTweet());
    expect(result.raw_json).toBeDefined();
    expect((result.raw_json as Record<string, unknown>)['id_str']).toBe(
      '123456789'
    );
  });
});

describe('parseTweetsJs', () => {
  it('parses tweets.js content with prefix', () => {
    const content =
      'window.YTD.tweet.part0 = [{"tweet":{"id_str":"1","full_text":"test","created_at":"Mon Jan 01 12:00:00 +0000 2024","retweet_count":"0","favorite_count":"0","entities":{}}}]';
    const result = parseTweetsJs(content);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].full_text).toBe('test');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseTweetsJs('window.YTD.tweet.part0 = {invalid')).toThrow();
  });
});
