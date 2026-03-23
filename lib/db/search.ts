import { getSupabaseAdmin } from './supabase';

const PAGE_SIZE = 50;

export async function searchTweets(query: string, page = 0) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweets')
    .select('*')
    .textSearch('fts', query)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
}
