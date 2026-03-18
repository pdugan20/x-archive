import { TweetCard } from '@/components/tweet-card';
import { Badge } from '@/components/ui/badge';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { TweetType } from '@/lib/db/tweets';

export const dynamic = 'force-dynamic';

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
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const activeType = (params.type ?? 'all') as TweetType | 'all';
  const page = parseInt(params.page ?? '0', 10);
  const pageSize = 50;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('tweets')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (activeType !== 'all') {
    query = query.eq('tweet_type', activeType);
  }

  const { data: tweets, error } = await query;

  // Get counts per type
  const { count: totalCount } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false);

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

      {error && (
        <p className="text-sm text-destructive">
          Failed to load tweets: {error.message}
        </p>
      )}

      <div className="space-y-3">
        {tweets?.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>

      {(!tweets || tweets.length === 0) && !error && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No tweets found. Import your Twitter archive to get started.
        </p>
      )}

      {tweets && tweets.length === pageSize && (
        <div className="mt-6 flex justify-center gap-4">
          {page > 0 && (
            <a
              href={`/archive?type=${activeType}&page=${page - 1}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Previous
            </a>
          )}
          <a
            href={`/archive?type=${activeType}&page=${page + 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Next
          </a>
        </div>
      )}
    </div>
  );
}
