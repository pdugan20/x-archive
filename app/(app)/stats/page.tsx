import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const supabase = getSupabaseAdmin();

  // Total tweets
  const { count: totalTweets } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true });

  // By type
  const { count: postCount } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true })
    .eq('tweet_type', 'post');

  const { count: replyCount } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true })
    .eq('tweet_type', 'reply');

  const { count: retweetCount } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true })
    .eq('tweet_type', 'retweet');

  const { count: quoteCount } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true })
    .eq('tweet_type', 'quote_tweet');

  // Deleted count
  const { count: deletedCount } = await supabase
    .from('tweets')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', true);

  // Media count
  const { count: mediaCount } = await supabase
    .from('tweet_media')
    .select('*', { count: 'exact', head: true });

  // URL count
  const { count: urlCount } = await supabase
    .from('tweet_entities')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', 'url');

  // Most liked tweets
  const { data: topTweets } = await supabase
    .from('tweets')
    .select('id, full_text, favorite_count, created_at')
    .eq('tweet_type', 'post')
    .order('favorite_count', { ascending: false })
    .limit(5);

  const stats = [
    { label: 'Total Tweets', value: totalTweets ?? 0 },
    { label: 'Posts', value: postCount ?? 0 },
    { label: 'Replies', value: replyCount ?? 0 },
    { label: 'Retweets', value: retweetCount ?? 0 },
    { label: 'Quotes', value: quoteCount ?? 0 },
    { label: 'Deleted', value: deletedCount ?? 0 },
    { label: 'Media', value: mediaCount ?? 0 },
    { label: 'Links Shared', value: urlCount ?? 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stats</h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most Liked Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {topTweets && topTweets.length > 0 ? (
            <div className="space-y-3">
              {topTweets.map((tweet) => (
                <a
                  key={tweet.id}
                  href={`/tweet/${tweet.id}`}
                  className="block rounded-md p-2 hover:bg-accent/5"
                >
                  <p className="line-clamp-2 text-sm">{tweet.full_text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tweet.favorite_count} likes
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No data yet. Import your archive to see stats.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
