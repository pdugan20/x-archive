import type { TablesInsert } from '@/types/database';
import { getSupabaseAdmin } from './supabase';

export type TweetType = 'post' | 'reply' | 'retweet' | 'quote_tweet';

const PAGE_SIZE = 50;

export async function getTweets({
  type,
  page = 0,
  includeDeleted = false,
}: {
  type?: TweetType;
  page?: number;
  includeDeleted?: boolean;
} = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('tweets')
    .select('*')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (type) {
    query = query.eq('tweet_type', type);
  }

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  return query;
}

export async function getTweetById(id: string) {
  const supabase = getSupabaseAdmin();
  return supabase.from('tweets').select('*').eq('id', id).single();
}

export async function getTweetsByConversation(conversationId: string) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweets')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('thread_position', { ascending: true });
}

export async function getTweetsByDateRange(start: string, end: string) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweets')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false });
}

export async function upsertTweets(tweets: TablesInsert<'tweets'>[]) {
  const supabase = getSupabaseAdmin();
  return supabase.from('tweets').upsert(tweets, { onConflict: 'id' });
}

export async function updateTweet(
  id: string,
  updates: { is_protected?: boolean; is_deleted?: boolean; deleted_at?: string }
) {
  const supabase = getSupabaseAdmin();
  return supabase.from('tweets').update(updates).eq('id', id);
}

export async function getTweetCount() {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false);
}

export async function getRetentionCandidates(cutoffDate: string, limit = 50) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweets')
    .select('*')
    .eq('is_deleted', false)
    .eq('is_protected', false)
    .lt('created_at', cutoffDate)
    .order('created_at', { ascending: true })
    .limit(limit);
}
