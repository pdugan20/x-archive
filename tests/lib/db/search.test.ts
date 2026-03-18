import { describe, expect, it, vi } from 'vitest';

const mockRange = vi.fn();
const mockOrder = vi.fn(() => ({ range: mockRange }));
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockTextSearch = vi.fn(() => ({ eq: mockEq }));
const mockSelect = vi.fn(() => ({ textSearch: mockTextSearch }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

describe('searchTweets', () => {
  it('performs full-text search on fts column', async () => {
    mockRange.mockResolvedValue({ data: [], error: null });

    const { searchTweets } = await import('@/lib/db/search');
    await searchTweets('hello world', 0);

    expect(mockFrom).toHaveBeenCalledWith('tweets');
    expect(mockTextSearch).toHaveBeenCalledWith('fts', 'hello world');
    expect(mockEq).toHaveBeenCalledWith('is_deleted', false);
  });

  it('paginates results by page number', async () => {
    mockRange.mockResolvedValue({ data: [], error: null });

    const { searchTweets } = await import('@/lib/db/search');
    await searchTweets('test', 2);

    expect(mockRange).toHaveBeenCalledWith(100, 149);
  });
});
