import { Card, CardContent } from '@/components/ui/card';
import { getUrlEntities } from '@/lib/db/entities';

export const dynamic = 'force-dynamic';

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '0', 10);

  const { data: urls, error } = await getUrlEntities(page, 50);

  // Group by expanded_url for deduplication
  const grouped = new Map<
    string,
    { url: string; displayUrl: string; title: string | null; count: number }
  >();

  for (const entity of urls ?? []) {
    const key = entity.expanded_url ?? entity.value;
    const existing = grouped.get(key);
    if (existing) {
      existing.count++;
    } else {
      grouped.set(key, {
        url: entity.expanded_url ?? entity.value,
        displayUrl: entity.display_url ?? key,
        title: entity.title,
        count: 1,
      });
    }
  }

  const sortedLinks = [...grouped.values()].sort((a, b) => b.count - a.count);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
        <p className="text-sm text-muted-foreground">
          URLs shared in your tweets
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Failed to load links: {error.message}
        </p>
      )}

      <div className="space-y-2">
        {sortedLinks.map((link) => (
          <Card key={link.url}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {link.title && (
                    <p className="truncate text-sm font-medium">{link.title}</p>
                  )}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-muted-foreground hover:text-foreground"
                  >
                    {link.displayUrl}
                  </a>
                </div>
                {link.count > 1 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {link.count}x
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedLinks.length === 0 && !error && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No links found in your archive.
        </p>
      )}
    </div>
  );
}
