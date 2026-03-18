import { MediaGrid } from '@/components/media-grid';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 36;

export default async function MediaPage() {
  const supabase = getSupabaseAdmin();

  const { data: photos } = await supabase
    .from('tweet_media')
    .select('*')
    .eq('media_type', 'photo')
    .order('tweet_id', { ascending: false })
    .limit(PAGE_SIZE);

  const nextCursor =
    photos && photos.length === PAGE_SIZE
      ? photos[photos.length - 1].tweet_id
      : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
        <p className="text-sm text-muted-foreground">
          Images from your archived tweets
        </p>
      </div>

      <MediaGrid initialPhotos={photos ?? []} initialCursor={nextCursor} />
    </div>
  );
}
