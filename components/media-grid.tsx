'use client';

import type { Tables } from '@/types/database';
import { useCallback, useEffect, useRef, useState } from 'react';

type Media = Tables<'tweet_media'>;

function MediaImage({ photo }: { photo: Media }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const src = photo.storage_path
    ? `/cdn/${photo.storage_path}`
    : photo.original_url;

  return (
    <a
      href={`/tweet/${photo.tweet_id}`}
      className="group relative aspect-square overflow-hidden rounded-md bg-muted"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={photo.alt_text ?? 'Tweet image'}
        className="size-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

interface MediaGridProps {
  initialPhotos: Media[];
  initialCursor: string | null;
}

export function MediaGrid({ initialPhotos, initialCursor }: MediaGridProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);

    const res = await fetch(`/api/media?cursor=${cursor}`);
    const data = await res.json();

    setPhotos((prev) => [...prev, ...data.photos]);
    setCursor(data.nextCursor);
    setLoading(false);
  }, [cursor, loading]);

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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo) => (
          <MediaImage key={photo.id} photo={photo} />
        ))}
      </div>

      {photos.length === 0 && (
        <p className="py-12 text-sm text-muted-foreground">
          No images found. Import your Twitter archive to see media here.
        </p>
      )}

      <div ref={loaderRef} className="py-4 text-center">
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!cursor && photos.length > 0 && (
          <p className="text-sm text-muted-foreground">End of media</p>
        )}
      </div>
    </>
  );
}
