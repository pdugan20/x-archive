import { subDays } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';

const mockSettings = {
  auto_delete_enabled: true,
  dry_run_mode: true,
  retention_days_post: 180,
  retention_days_reply: 180,
  retention_days_retweet: 30,
  retention_days_quote_tweet: 180,
  viral_threshold: 100,
  protected_keywords: ['keep'],
};

vi.mock('@/lib/db/settings', () => ({
  getSettings: vi.fn(() => Promise.resolve(mockSettings)),
}));

const mockTweets = [
  {
    id: '1',
    tweet_type: 'post',
    full_text: 'old post',
    created_at: subDays(new Date(), 200).toISOString(),
    favorite_count: 5,
    is_deleted: false,
    is_protected: false,
  },
  {
    id: '2',
    tweet_type: 'retweet',
    full_text: 'RT @someone: old retweet',
    created_at: subDays(new Date(), 45).toISOString(),
    favorite_count: 0,
    is_deleted: false,
    is_protected: false,
  },
  {
    id: '3',
    tweet_type: 'post',
    full_text: 'viral post',
    created_at: subDays(new Date(), 200).toISOString(),
    favorite_count: 500,
    is_deleted: false,
    is_protected: false,
  },
  {
    id: '4',
    tweet_type: 'post',
    full_text: 'keep this tweet',
    created_at: subDays(new Date(), 200).toISOString(),
    favorite_count: 0,
    is_deleted: false,
    is_protected: false,
  },
  {
    id: '5',
    tweet_type: 'post',
    full_text: 'recent post',
    created_at: subDays(new Date(), 10).toISOString(),
    favorite_count: 0,
    is_deleted: false,
    is_protected: false,
  },
];

const mockLimit = vi.fn(() =>
  Promise.resolve({ data: mockTweets, error: null })
);
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEqProtected = vi.fn(() => ({ order: mockOrder }));
const mockEqDeleted = vi.fn(() => ({ eq: mockEqProtected }));
const mockSelect = vi.fn(() => ({ eq: mockEqDeleted }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

describe('getCandidatesForDeletion', () => {
  it('returns tweets past their type-specific retention period', async () => {
    const { getCandidatesForDeletion } =
      await import('@/lib/deletion/scheduler');
    const { candidates } = await getCandidatesForDeletion();

    // Tweet 1: post, 200 days old, retention 180 -> eligible
    expect(candidates.some((c) => c.id === '1')).toBe(true);
  });

  it('applies retweet-specific retention period', async () => {
    const { getCandidatesForDeletion } =
      await import('@/lib/deletion/scheduler');
    const { candidates } = await getCandidatesForDeletion();

    // Tweet 2: retweet, 45 days old, retention 30 -> eligible
    expect(candidates.some((c) => c.id === '2')).toBe(true);
  });

  it('protects viral tweets above threshold', async () => {
    const { getCandidatesForDeletion } =
      await import('@/lib/deletion/scheduler');
    const { candidates } = await getCandidatesForDeletion();

    // Tweet 3: 500 likes >= 100 threshold -> protected
    expect(candidates.some((c) => c.id === '3')).toBe(false);
  });

  it('protects tweets matching keywords', async () => {
    const { getCandidatesForDeletion } =
      await import('@/lib/deletion/scheduler');
    const { candidates } = await getCandidatesForDeletion();

    // Tweet 4: contains "keep" -> protected
    expect(candidates.some((c) => c.id === '4')).toBe(false);
  });

  it('skips recent tweets within retention period', async () => {
    const { getCandidatesForDeletion } =
      await import('@/lib/deletion/scheduler');
    const { candidates } = await getCandidatesForDeletion();

    // Tweet 5: 10 days old, retention 180 -> not eligible
    expect(candidates.some((c) => c.id === '5')).toBe(false);
  });

  it('returns empty when auto-delete is disabled', async () => {
    const { getSettings } = await import('@/lib/db/settings');
    vi.mocked(getSettings).mockResolvedValueOnce({
      ...mockSettings,
      auto_delete_enabled: false,
      id: 1,
      last_sync_at: null,
      last_deletion_run_at: null,
      x_user_id: null,
      x_username: null,
      updated_at: '2026-01-01T00:00:00Z',
    });

    const { getCandidatesForDeletion } =
      await import('@/lib/deletion/scheduler');
    const { candidates } = await getCandidatesForDeletion();

    expect(candidates).toHaveLength(0);
  });

  it('reports dry_run status from settings', async () => {
    const { getCandidatesForDeletion } =
      await import('@/lib/deletion/scheduler');
    const { dryRun } = await getCandidatesForDeletion();

    expect(dryRun).toBe(true);
  });
});
