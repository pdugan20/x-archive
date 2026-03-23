'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Tables } from '@/types/database';
import { format } from 'date-fns';
import { useState } from 'react';

type Tweet = Tables<'tweets'>;
type Media = Tables<'tweet_media'>;

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

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
      className="w-full rounded-lg border border-border"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function TweetCard({ tweet, media }: { tweet: Tweet; media?: Media[] }) {
  const date = format(new Date(tweet.created_at), 'MMM d, yyyy');

  const photos = media?.filter((m) => m.media_type === 'photo') ?? [];
  const hasPhotos = photos.length > 0;

  const isRetweet = tweet.tweet_type === 'retweet';
  const isReply = tweet.tweet_type === 'reply';
  const isQuote = tweet.tweet_type === 'quote_tweet';

  const rtMatch = /^RT @(\w+): (.*)$/s.exec(cleanTweetText(tweet.full_text));
  const displayText = rtMatch ? rtMatch[2] : cleanTweetText(tweet.full_text);

  return (
    <a href={`/tweet/${tweet.id}`} className="block">
      <Card className="!py-0 transition-colors hover:bg-accent/5">
        <CardContent className="space-y-2 p-4">
          {/* Context line: who + when */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              {isRetweet && rtMatch ? (
                <>
                  <span className="text-muted-foreground">RT</span>
                  <span className="font-medium">@{rtMatch[1]}</span>
                </>
              ) : isReply && tweet.in_reply_to_screen_name ? (
                <>
                  <span className="font-medium">@doog</span>
                  <span className="text-muted-foreground">replied to</span>
                  <span className="font-medium">
                    @{tweet.in_reply_to_screen_name}
                  </span>
                </>
              ) : isQuote ? (
                <>
                  <span className="font-medium">@doog</span>
                  <span className="text-muted-foreground">quoted</span>
                </>
              ) : (
                <span className="font-medium">@doog</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {tweet.is_protected && (
                <Badge variant="outline" className="text-[10px]">
                  Protected
                </Badge>
              )}
              {tweet.is_deleted && (
                <Badge variant="destructive" className="text-[10px]">
                  Deleted from X
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{date}</span>
            </div>
          </div>

          {/* Tweet text */}
          <p className="text-sm leading-relaxed">{displayText}</p>

          {/* Image */}
          {hasPhotos && (
            <TweetImage
              src={
                photos[0].storage_path
                  ? `/cdn/${photos[0].storage_path}`
                  : photos[0].original_url
              }
              alt={photos[0].alt_text ?? 'Tweet image'}
            />
          )}

          {/* Metrics */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            {tweet.reply_count > 0 && (
              <span>{formatNumber(tweet.reply_count)} replies</span>
            )}
            {tweet.retweet_count > 0 && (
              <span>{formatNumber(tweet.retweet_count)} retweets</span>
            )}
            {tweet.favorite_count > 0 && (
              <span>{formatNumber(tweet.favorite_count)} likes</span>
            )}
            {tweet.view_count != null && tweet.view_count > 0 && (
              <span>{formatNumber(tweet.view_count)} views</span>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
