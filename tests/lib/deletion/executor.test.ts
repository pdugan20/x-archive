import type { Tables } from '@/types/database';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/deletion-log', () => ({
  logDeletion: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/lib/db/settings', () => ({
  updateSettings: vi.fn(() => Promise.resolve({ error: null })),
}));

const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));
vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ update: mockUpdate }),
  }),
}));

vi.mock('@/lib/twitter/api-client', () => ({
  deleteTweet: vi.fn(() => Promise.resolve({ deleted: true })),
  undoRetweet: vi.fn(() => Promise.resolve({ retweeted: false })),
  getMe: vi.fn(() =>
    Promise.resolve({ id: '123', username: 'doog', name: 'Pat' })
  ),
}));

const makeTweet = (
  overrides: Partial<Tables<'tweets'>> = {}
): Tables<'tweets'> => ({
  id: '1',
  tweet_type: 'post',
  full_text: 'test tweet',
  created_at: '2025-01-01T00:00:00Z',
  archived_at: '2026-01-01T00:00:00Z',
  retweet_count: 0,
  favorite_count: 0,
  reply_count: 0,
  quote_count: 0,
  bookmark_count: 0,
  view_count: 0,
  in_reply_to_tweet_id: null,
  in_reply_to_user_id: null,
  in_reply_to_screen_name: null,
  quoted_tweet_id: null,
  retweeted_tweet_id: null,
  quoted_tweet_text: null,
  quoted_tweet_author: null,
  conversation_id: null,
  thread_position: null,
  source: null,
  lang: null,
  is_deleted: false,
  deleted_at: null,
  is_protected: false,
  raw_json: null,
  import_source: 'api',
  fts: null as unknown,
  ...overrides,
});

describe('executeDeletions', () => {
  it('logs dry run without calling API', async () => {
    const { logDeletion } = await import('@/lib/db/deletion-log');
    const { executeDeletions } = await import('@/lib/deletion/executor');

    const result = await executeDeletions([makeTweet()], true);

    expect(result.skipped).toBe(1);
    expect(result.success).toBe(0);
    expect(logDeletion).toHaveBeenCalledWith(
      expect.objectContaining({ dry_run: true })
    );
  });

  it('calls deleteTweet for regular posts', async () => {
    const { deleteTweet } = await import('@/lib/twitter/api-client');
    const { executeDeletions } = await import('@/lib/deletion/executor');

    const result = await executeDeletions([makeTweet({ id: '100' })], false);

    expect(result.success).toBe(1);
    expect(deleteTweet).toHaveBeenCalledWith('100');
  });

  it('calls undoRetweet for retweets', async () => {
    const { undoRetweet } = await import('@/lib/twitter/api-client');
    const { executeDeletions } = await import('@/lib/deletion/executor');

    const result = await executeDeletions(
      [
        makeTweet({
          id: '200',
          tweet_type: 'retweet',
          retweeted_tweet_id: '999',
        }),
      ],
      false
    );

    expect(result.success).toBe(1);
    expect(undoRetweet).toHaveBeenCalledWith('123', '999');
  });
});
