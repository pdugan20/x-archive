import { Card, CardContent } from '@/components/ui/card';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

// Domains to exclude (twitter/x media links, pic.twitter.com, etc.)
const EXCLUDED_DOMAINS = [
  'twitter.com',
  'x.com',
  'pic.twitter.com',
  'pic.x.com',
  't.co',
];

function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export default async function LinksPage() {
  const supabase = getSupabaseAdmin();

  // Fetch all URL entities at once
  const { data: urls, error } = await supabase
    .from('tweet_entities')
    .select('value, expanded_url, display_url, title')
    .eq('entity_type', 'url')
    .not('expanded_url', 'is', null);

  // Group by expanded_url, filter out twitter/x domains
  const grouped = new Map<
    string,
    { url: string; displayUrl: string; title: string | null; count: number }
  >();

  for (const entity of urls ?? []) {
    const expandedUrl = entity.expanded_url ?? entity.value;
    const domain = getDomain(expandedUrl);

    // Skip twitter/x internal links
    if (domain && EXCLUDED_DOMAINS.some((d) => domain.endsWith(d))) {
      continue;
    }

    const existing = grouped.get(expandedUrl);
    if (existing) {
      existing.count++;
      // Prefer entries that have a title
      if (!existing.title && entity.title) {
        existing.title = entity.title;
      }
    } else {
      grouped.set(expandedUrl, {
        url: expandedUrl,
        displayUrl: entity.display_url ?? expandedUrl,
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
          {sortedLinks.length} unique URLs shared in your tweets
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
                    className="block truncate text-xs text-muted-foreground hover:text-foreground"
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
