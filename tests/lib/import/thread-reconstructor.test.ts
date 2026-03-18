import { reconstructThreads } from '@/lib/import/thread-reconstructor';
import type { ParsedTweet } from '@/lib/import/types';
import { describe, expect, it } from 'vitest';

function makeTweet(overrides: Partial<ParsedTweet> = {}): ParsedTweet {
  return {
    id: '1',
    tweet_type: 'post',
    full_text: 'Hello',
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
    entities: {},
    ...overrides,
  };
}

describe('reconstructThreads', () => {
  it('detects a simple 3-tweet self-reply thread', () => {
    const tweets = [
      makeTweet({ id: '1', created_at: '2024-01-01T12:00:00.000Z' }),
      makeTweet({
        id: '2',
        tweet_type: 'reply',
        in_reply_to_tweet_id: '1',
        in_reply_to_screen_name: 'doog',
        created_at: '2024-01-01T12:01:00.000Z',
      }),
      makeTweet({
        id: '3',
        tweet_type: 'reply',
        in_reply_to_tweet_id: '2',
        in_reply_to_screen_name: 'doog',
        created_at: '2024-01-01T12:02:00.000Z',
      }),
    ];

    const assignments = reconstructThreads(tweets, 'doog');

    expect(assignments).toHaveLength(3);
    expect(assignments[0]).toEqual({
      tweetId: '1',
      conversationId: '1',
      threadPosition: 0,
    });
    expect(assignments[1]).toEqual({
      tweetId: '2',
      conversationId: '1',
      threadPosition: 1,
    });
    expect(assignments[2]).toEqual({
      tweetId: '3',
      conversationId: '1',
      threadPosition: 2,
    });
  });

  it('ignores replies to other users', () => {
    const tweets = [
      makeTweet({ id: '1' }),
      makeTweet({
        id: '2',
        tweet_type: 'reply',
        in_reply_to_tweet_id: '1',
        in_reply_to_screen_name: 'someoneelse',
      }),
    ];

    const assignments = reconstructThreads(tweets, 'doog');
    expect(assignments).toHaveLength(0);
  });

  it('ignores self-replies where parent is not in archive', () => {
    const tweets = [
      makeTweet({
        id: '2',
        tweet_type: 'reply',
        in_reply_to_tweet_id: '999',
        in_reply_to_screen_name: 'doog',
      }),
    ];

    const assignments = reconstructThreads(tweets, 'doog');
    expect(assignments).toHaveLength(0);
  });

  it('handles username case-insensitively', () => {
    const tweets = [
      makeTweet({ id: '1' }),
      makeTweet({
        id: '2',
        tweet_type: 'reply',
        in_reply_to_tweet_id: '1',
        in_reply_to_screen_name: 'Doog',
        created_at: '2024-01-01T12:01:00.000Z',
      }),
    ];

    const assignments = reconstructThreads(tweets, 'doog');
    expect(assignments).toHaveLength(2);
  });

  it('uses conversation_id from root tweet if available', () => {
    const tweets = [
      makeTweet({ id: '1', conversation_id: 'conv_abc' }),
      makeTweet({
        id: '2',
        tweet_type: 'reply',
        in_reply_to_tweet_id: '1',
        in_reply_to_screen_name: 'doog',
        created_at: '2024-01-01T12:01:00.000Z',
      }),
    ];

    const assignments = reconstructThreads(tweets, 'doog');
    expect(assignments[0].conversationId).toBe('conv_abc');
    expect(assignments[1].conversationId).toBe('conv_abc');
  });

  it('returns empty for standalone tweets', () => {
    const tweets = [makeTweet({ id: '1' }), makeTweet({ id: '2' })];

    const assignments = reconstructThreads(tweets, 'doog');
    expect(assignments).toHaveLength(0);
  });
});
