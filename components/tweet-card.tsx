import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Tables } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

type Tweet = Tables<'tweets'>;

const typeLabels: Record<string, string> = {
  post: 'Post',
  reply: 'Reply',
  retweet: 'Retweet',
  quote_tweet: 'Quote',
};

const typeVariants: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  post: 'default',
  reply: 'secondary',
  retweet: 'outline',
  quote_tweet: 'secondary',
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function TweetCard({ tweet }: { tweet: Tweet }) {
  const timeAgo = formatDistanceToNow(new Date(tweet.created_at), {
    addSuffix: true,
  });

  return (
    <Card className="transition-colors hover:bg-accent/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant={typeVariants[tweet.tweet_type] ?? 'default'}>
                {typeLabels[tweet.tweet_type] ?? tweet.tweet_type}
              </Badge>
              {tweet.is_protected && (
                <Badge variant="outline" className="text-xs">
                  Protected
                </Badge>
              )}
              {tweet.is_deleted && (
                <Badge variant="destructive" className="text-xs">
                  Deleted
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>

            <a
              href={`/tweet/${tweet.id}`}
              className="block text-sm leading-relaxed whitespace-pre-wrap"
            >
              {tweet.full_text}
            </a>

            {tweet.in_reply_to_screen_name && (
              <p className="mt-1 text-xs text-muted-foreground">
                Replying to @{tweet.in_reply_to_screen_name}
              </p>
            )}

            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span title="Replies">
                {formatNumber(tweet.reply_count)} replies
              </span>
              <span title="Retweets">
                {formatNumber(tweet.retweet_count)} retweets
              </span>
              <span title="Likes">
                {formatNumber(tweet.favorite_count)} likes
              </span>
              {tweet.view_count != null && tweet.view_count > 0 && (
                <span title="Views">
                  {formatNumber(tweet.view_count)} views
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
