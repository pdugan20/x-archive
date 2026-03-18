import { getAllPhotos } from '@/lib/db/media';

export const dynamic = 'force-dynamic';

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '0', 10);
  const pageSize = 48;

  const { data: photos, error } = await getAllPhotos(page, pageSize);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
        <p className="text-sm text-muted-foreground">
          Images from your archived tweets
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Failed to load media: {error.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {photos?.map((photo) => (
          <a
            key={photo.id}
            href={`/tweet/${photo.tweet_id}`}
            className="group relative aspect-square overflow-hidden rounded-md bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                photo.storage_path
                  ? `/cdn/${photo.storage_path}`
                  : photo.original_url
              }
              alt={photo.alt_text ?? 'Tweet image'}
              className="size-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </a>
        ))}
      </div>

      {(!photos || photos.length === 0) && !error && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No images found. Import your Twitter archive to see media here.
        </p>
      )}

      {photos && photos.length === pageSize && (
        <div className="mt-6 flex justify-center gap-4">
          {page > 0 && (
            <a
              href={`/media?page=${page - 1}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Previous
            </a>
          )}
          <a
            href={`/media?page=${page + 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Next
          </a>
        </div>
      )}
    </div>
  );
}
