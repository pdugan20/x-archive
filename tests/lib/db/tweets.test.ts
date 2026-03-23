import { describe, expect, it, vi } from 'vitest';

// Track all .eq() calls across the chain
const eqCalls: [string, unknown][] = [];

// getTweets chain: from().select().order().range() then optionally .eq()
// getTweetCount chain: from().select()
// getRetentionCandidates chain: from().select().eq().eq().lt().order().limit()

function buildChain() {
  eqCalls.length = 0;

  const terminal = { data: [], error: null };

  const eqFn = vi.fn((...args: unknown[]) => {
    eqCalls.push(args as [string, unknown]);
    return {
      eq: eqFn,
      lt: ltFn,
      range: rangeFn,
      order: orderFn,
      then: resolveFn,
    };
  });

  const ltFn = vi.fn(() => ({
    order: orderFn,
  }));

  const limitFn = vi.fn(() => terminal);

  const rangeFn = vi.fn(() => ({
    eq: eqFn,
    then: resolveFn,
  }));

  const orderFn = vi.fn(() => ({
    range: rangeFn,
    limit: limitFn,
    eq: eqFn,
    then: resolveFn,
  }));

  const selectFn = vi.fn(() => ({
    order: orderFn,
    eq: eqFn,
    textSearch: vi.fn(() => ({ order: orderFn })),
    then: resolveFn,
  }));

  const fromFn = vi.fn(() => ({ select: selectFn }));

  // Make terminal thenable so await resolves
  const resolveFn = (resolve: (v: unknown) => void) => resolve(terminal);

  return { fromFn, eqCalls };
}

describe('getTweets', () => {
  it('does not filter by is_deleted (archive shows all tweets)', async () => {
    const { fromFn } = buildChain();

    vi.doMock('@/lib/db/supabase', () => ({
      getSupabaseAdmin: () => ({ from: fromFn }),
    }));

    const { getTweets } = await import('@/lib/db/tweets');
    await getTweets();

    const deletedFilter = eqCalls.find(([col]) => col === 'is_deleted');
    expect(deletedFilter).toBeUndefined();
  });

  it('filters by tweet_type when specified', async () => {
    const { fromFn } = buildChain();

    vi.doMock('@/lib/db/supabase', () => ({
      getSupabaseAdmin: () => ({ from: fromFn }),
    }));

    const { getTweets } = await import('@/lib/db/tweets');
    await getTweets({ type: 'reply' });

    const typeFilter = eqCalls.find(
      ([col, val]) => col === 'tweet_type' && val === 'reply'
    );
    expect(typeFilter).toBeDefined();
  });
});

describe('getTweetCount', () => {
  it('counts all tweets regardless of deletion status', async () => {
    const { fromFn } = buildChain();

    vi.doMock('@/lib/db/supabase', () => ({
      getSupabaseAdmin: () => ({ from: fromFn }),
    }));

    const { getTweetCount } = await import('@/lib/db/tweets');
    await getTweetCount();

    const deletedFilter = eqCalls.find(([col]) => col === 'is_deleted');
    expect(deletedFilter).toBeUndefined();
  });
});

describe('getRetentionCandidates', () => {
  it('filters by is_deleted=false (only target live tweets)', async () => {
    const { fromFn } = buildChain();

    vi.doMock('@/lib/db/supabase', () => ({
      getSupabaseAdmin: () => ({ from: fromFn }),
    }));

    const { getRetentionCandidates } = await import('@/lib/db/tweets');
    await getRetentionCandidates('2025-01-01T00:00:00Z');

    expect(eqCalls).toContainEqual(['is_deleted', false]);
    expect(eqCalls).toContainEqual(['is_protected', false]);
  });
});
