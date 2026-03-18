import { TweetCard } from '@/components/tweet-card';
import { Input } from '@/components/ui/input';
import { searchTweets } from '@/lib/db/search';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? '';
  const page = parseInt(params.page ?? '0', 10);

  const { data: tweets, error } = query
    ? await searchTweets(query, page)
    : { data: null, error: null };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      </div>

      <form action="/search" method="GET" className="mb-6">
        <Input
          name="q"
          placeholder="Search your tweets..."
          defaultValue={query}
          className="max-w-md"
        />
      </form>

      {error && (
        <p className="text-sm text-destructive">
          Search failed: {error.message}
        </p>
      )}

      {query && tweets && (
        <p className="mb-4 text-sm text-muted-foreground">
          {tweets.length} result{tweets.length !== 1 ? 's' : ''} for &quot;
          {query}&quot;
        </p>
      )}

      <div className="space-y-3">
        {tweets?.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>

      {query && tweets?.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No tweets found matching &quot;{query}&quot;
        </p>
      )}

      {!query && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Enter a search term to find tweets in your archive.
        </p>
      )}
    </div>
  );
}
