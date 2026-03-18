'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Tables } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

type Tweet = Tables<'tweets'>;
type Media = Tables<'tweet_media'>;

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

// Strip t.co URLs from tweet text for cleaner display
function cleanTweetText(text: string): string {
  return text.replace(/\s*https:\/\/t\.co\/\w+/g, '').trim();
}

function TweetImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="size-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function TweetCard({ tweet, media }: { tweet: Tweet; media?: Media[] }) {
  const timeAgo = formatDistanceToNow(new Date(tweet.created_at), {
    addSuffix: true,
  });

  const photos = media?.filter((m) => m.media_type === 'photo') ?? [];

  return (
    <Card className="transition-colors hover:bg-accent/5">
      <CardContent className="p-4">
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
            {cleanTweetText(tweet.full_text)}
          </a>

          {tweet.in_reply_to_screen_name && (
            <p className="mt-1 text-xs text-muted-foreground">
              Replying to @{tweet.in_reply_to_screen_name}
            </p>
          )}

          {photos.length > 0 && (
            <div
              className={`mt-2 grid gap-1 overflow-hidden rounded-lg ${
                photos.length === 1
                  ? 'grid-cols-1'
                  : photos.length <= 4
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
              }`}
            >
              {photos.slice(0, 4).map((photo) => (
                <div key={photo.id} className="relative aspect-video bg-muted">
                  <TweetImage
                    src={
                      photo.storage_path
                        ? `/cdn/${photo.storage_path}`
                        : photo.original_url
                    }
                    alt={photo.alt_text ?? 'Tweet image'}
                  />
                </div>
              ))}
            </div>
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
              <span title="Views">{formatNumber(tweet.view_count)} views</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
