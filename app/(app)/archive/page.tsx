import { TweetList } from '@/components/tweet-list';
import { Badge } from '@/components/ui/badge';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { TweetType } from '@/lib/db/tweets';
import type { Tables } from '@/types/database';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

const TWEET_TYPES: { label: string; value: TweetType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Posts', value: 'post' },
  { label: 'Replies', value: 'reply' },
  { label: 'Retweets', value: 'retweet' },
  { label: 'Quotes', value: 'quote_tweet' },
];

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const activeType = (params.type ?? 'all') as TweetType | 'all';

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('tweets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (activeType !== 'all') {
    query = query.eq('tweet_type', activeType);
  }

  const { data: tweets } = await query;

  // Fetch media
  const mediaMap: Record<string, Tables<'tweet_media'>[]> = {};
  if (tweets && tweets.length > 0) {
    const tweetIds = tweets.map((t) => t.id);
    const mediaResult = await supabase
      .from('tweet_media')
      .select('*')
      .in('tweet_id', tweetIds);

    const mediaList = mediaResult.data ?? ([] as Tables<'tweet_media'>[]);
    for (const m of mediaList) {
      const tid = m.tweet_id;
      mediaMap[tid] = [...(mediaMap[tid] ?? []), m];
    }
  }

  const { count: totalCount } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true });

  const nextCursor =
    tweets && tweets.length === PAGE_SIZE
      ? tweets[tweets.length - 1].created_at
      : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          {totalCount ?? 0} tweets archived
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        {TWEET_TYPES.map((t) => (
          <a
            key={t.value}
            href={t.value === 'all' ? '/archive' : `/archive?type=${t.value}`}
          >
            <Badge
              variant={activeType === t.value ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {t.label}
            </Badge>
          </a>
        ))}
      </div>

      <TweetList
        key={activeType}
        initialTweets={tweets ?? []}
        initialMedia={mediaMap}
        initialCursor={nextCursor}
        type={activeType}
      />
    </div>
  );
}
