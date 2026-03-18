import { TweetCard } from '@/components/tweet-card';
import { getTweetsByConversation } from '@/lib/db/tweets';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: tweets, error } = await getTweetsByConversation(id);

  if (error || tweets.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Thread</h1>
        <p className="text-sm text-muted-foreground">
          {tweets.length} tweet{tweets.length !== 1 ? 's' : ''} in thread
        </p>
      </div>

      <div className="relative space-y-0">
        {tweets.map((tweet, index) => (
          <div key={tweet.id} className="relative">
            {index < tweets.length - 1 && (
              <div className="absolute top-0 bottom-0 left-6 w-px bg-border" />
            )}
            <div className="relative pb-3">
              <TweetCard tweet={tweet} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
