import type { TablesInsert } from '@/types/database';
import { getSupabaseAdmin } from './supabase';

export async function getMediaByTweetId(tweetId: string) {
  const supabase = getSupabaseAdmin();
  return supabase.from('tweet_media').select('*').eq('tweet_id', tweetId);
}

export async function getMediaByType(
  mediaType: 'photo' | 'video' | 'animated_gif',
  page = 0,
  pageSize = 50
) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweet_media')
    .select('*, tweets!inner(created_at)')
    .eq('media_type', mediaType)
    .order('tweet_id', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
}

export async function getAllPhotos(page = 0, pageSize = 50) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweet_media')
    .select('*')
    .eq('media_type', 'photo')
    .order('tweet_id', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
}

export async function upsertMedia(media: TablesInsert<'tweet_media'>[]) {
  const supabase = getSupabaseAdmin();
  return supabase.from('tweet_media').upsert(media, { onConflict: 'id' });
}

export async function updateMediaStoragePath(id: string, storagePath: string) {
  const supabase = getSupabaseAdmin();
  return supabase
    .from('tweet_media')
    .update({ storage_path: storagePath })
    .eq('id', id);
}
