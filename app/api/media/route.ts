import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = 36;

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('tweet_media')
    .select('*')
    .eq('media_type', 'photo')
    .order('tweet_id', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('tweet_id', cursor);
  }

  const { data: photos, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const nextCursor =
    photos.length === limit ? photos[photos.length - 1].tweet_id : null;

  return Response.json({ photos, nextCursor });
}
