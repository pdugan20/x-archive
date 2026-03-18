import type { TablesInsert } from '@/types/database';
import { getSupabaseAdmin } from './supabase';

export async function getEntitiesByTweetId(tweetId: string) {
  const supabase = getSupabaseAdmin();
  return supabase.from('tweet_entities').select('*').eq('tweet_id', tweetId);
}

export async function getUrlEntities(page = 0, pageSize = 50) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweet_entities')
    .select('*')
    .eq('entity_type', 'url')
    .not('expanded_url', 'is', null)
    .order('tweet_id', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
}

export async function getHashtags() {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweet_entities')
    .select('value')
    .eq('entity_type', 'hashtag');
}

export async function upsertEntities(
  entities: TablesInsert<'tweet_entities'>[]
) {
  const supabase = getSupabaseAdmin();
  return supabase.from('tweet_entities').insert(entities);
}
