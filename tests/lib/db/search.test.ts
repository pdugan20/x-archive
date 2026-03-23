import { describe, expect, it, vi } from 'vitest';

const mockRange = vi.fn();
const mockOrder = vi.fn(() => ({ range: mockRange }));
const mockTextSearch = vi.fn(() => ({ order: mockOrder }));
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
  });

  it('paginates results by page number', async () => {
    mockRange.mockResolvedValue({ data: [], error: null });

    const { searchTweets } = await import('@/lib/db/search');
    await searchTweets('test', 2);

    expect(mockRange).toHaveBeenCalledWith(100, 149);
  });
});
