import { TweetCard } from '@/components/tweet-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEntitiesByTweetId } from '@/lib/db/entities';
import { getMediaByTweetId } from '@/lib/db/media';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TweetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: tweet, error } = await supabase
    .from('tweets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    notFound();
  }

  const { data: entities } = await getEntitiesByTweetId(id);
  const { data: media } = await getMediaByTweetId(id);

  const urls = entities?.filter((e) => e.entity_type === 'url') ?? [];
  const hashtags = entities?.filter((e) => e.entity_type === 'hashtag') ?? [];
  const mentions = entities?.filter((e) => e.entity_type === 'mention') ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tweet Detail</h1>
      </div>

      <TweetCard tweet={tweet} />

      {media && media.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {media.map((m) => (
                <div
                  key={m.id}
                  className="relative aspect-video overflow-hidden rounded-md bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      m.storage_path ? `/cdn/${m.storage_path}` : m.original_url
                    }
                    alt={m.alt_text ?? 'Tweet media'}
                    className="size-full object-cover"
                  />
                  {m.media_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-sm font-medium text-white">
                        Video
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {urls.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {urls.map((url) => (
              <a
                key={url.id}
                href={url.expanded_url ?? url.value}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm text-muted-foreground hover:text-foreground"
              >
                {url.display_url ?? url.expanded_url ?? url.value}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {(hashtags.length > 0 || mentions.length > 0) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {hashtags.map((h) => (
                <Badge key={h.id} variant="secondary">
                  #{h.value}
                </Badge>
              ))}
              {mentions.map((m) => (
                <Badge key={m.id} variant="outline">
                  @{m.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tweet.conversation_id && tweet.thread_position != null && (
        <div className="mt-4">
          <a href={`/thread/${tweet.conversation_id}`}>
            <Button variant="outline">View Thread</Button>
          </a>
        </div>
      )}
    </div>
  );
}
