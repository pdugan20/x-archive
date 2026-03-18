import { describe, expect, it, vi } from 'vitest';

// Mock Supabase
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

describe('settings', () => {
  it('getSettings queries settings table with id=1', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 1,
        auto_delete_enabled: false,
        dry_run_mode: true,
        retention_days_post: 180,
        retention_days_reply: 180,
        retention_days_retweet: 180,
        retention_days_quote_tweet: 180,
        viral_threshold: 100,
        protected_keywords: [],
        last_sync_at: null,
        last_deletion_run_at: null,
        x_user_id: null,
        x_username: null,
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });

    const { getSettings } = await import('@/lib/db/settings');
    const settings = await getSettings();

    expect(mockFrom).toHaveBeenCalledWith('settings');
    expect(settings.retention_days_post).toBe(180);
    expect(settings.dry_run_mode).toBe(true);
  });
});
