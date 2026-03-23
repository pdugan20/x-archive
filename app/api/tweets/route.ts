import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'all';
  const cursor = searchParams.get('cursor');
  const limit = 30;

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('tweets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type !== 'all') {
    query = query.eq('tweet_type', type);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: tweets, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Fetch media for these tweets
  const mediaMap: Record<string, typeof allMedia> = {};
  let allMedia: {
    id: string;
    tweet_id: string;
    media_type: string;
    original_url: string;
    storage_path: string | null;
    alt_text: string | null;
  }[] = [];

  if (tweets.length > 0) {
    const tweetIds = tweets.map((t) => t.id);
    const mediaResult = await supabase
      .from('tweet_media')
      .select('id, tweet_id, media_type, original_url, storage_path, alt_text')
      .in('tweet_id', tweetIds);

    allMedia = mediaResult.data ?? ([] as typeof allMedia);
    for (const m of allMedia) {
      const tid = m.tweet_id;
      mediaMap[tid] = [...(mediaMap[tid] ?? []), m];
    }
  }

  const nextCursor =
    tweets.length === limit ? tweets[tweets.length - 1].created_at : null;

  return Response.json({ tweets, media: mediaMap, nextCursor });
}
