'use client';

import { TweetCard } from '@/components/tweet-card';
import type { Tables } from '@/types/database';
import { useCallback, useEffect, useRef, useState } from 'react';

type Tweet = Tables<'tweets'>;
type Media = Tables<'tweet_media'>;

interface TweetListProps {
  initialTweets: Tweet[];
  initialMedia: Record<string, Media[]>;
  initialCursor: string | null;
  type: string;
}

export function TweetList({
  initialTweets,
  initialMedia,
  initialCursor,
  type,
}: TweetListProps) {
  const [tweets, setTweets] = useState(initialTweets);
  const [mediaMap, setMediaMap] = useState(initialMedia);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);

    const params = new URLSearchParams({ type, cursor });
    const res = await fetch(`/api/tweets?${params.toString()}`);
    const data = await res.json();

    setTweets((prev) => [...prev, ...data.tweets]);
    setMediaMap((prev) => ({ ...prev, ...data.media }));
    setCursor(data.nextCursor);
    setLoading(false);
  }, [cursor, loading, type]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="max-w-2xl space-y-3">
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} media={mediaMap[tweet.id]} />
        ))}
      </div>

      {tweets.length === 0 && (
        <p className="py-12 text-sm text-muted-foreground">
          No tweets found. Import your Twitter archive to get started.
        </p>
      )}

      <div ref={loaderRef} className="py-4 text-center">
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!cursor && tweets.length > 0 && (
          <p className="text-sm text-muted-foreground">End of archive</p>
        )}
      </div>
    </>
  );
}
