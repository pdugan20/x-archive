import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

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

  const { data: urls, error } = await supabase
    .from('tweet_entities')
    .select('value, expanded_url, display_url, title')
    .eq('entity_type', 'url')
    .not('expanded_url', 'is', null);

  const grouped = new Map<
    string,
    { url: string; domain: string; title: string | null; count: number }
  >();

  for (const entity of urls ?? []) {
    const expandedUrl = entity.expanded_url ?? entity.value;
    const domain = getDomain(expandedUrl);

    if (!domain || EXCLUDED_DOMAINS.some((d) => domain.endsWith(d))) {
      continue;
    }

    const existing = grouped.get(expandedUrl);
    if (existing) {
      existing.count++;
      if (!existing.title && entity.title) {
        existing.title = entity.title;
      }
    } else {
      grouped.set(expandedUrl, {
        url: expandedUrl,
        domain,
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

      {sortedLinks.length > 0 ? (
        <div className="max-w-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Link</th>
                <th className="pb-2 text-right font-medium">Shared</th>
              </tr>
            </thead>
            <tbody>
              {sortedLinks.map((link) => (
                <tr key={link.url} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {link.title ? (
                        <>
                          <span className="line-clamp-1">{link.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {link.domain}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          {link.domain}
                          {link.url
                            .replace(/^https?:\/\/(www\.)?/, '')
                            .replace(link.domain, '')
                            .substring(0, 40)}
                        </span>
                      )}
                    </a>
                  </td>
                  <td className="py-2 text-right text-muted-foreground">
                    {link.count > 1 ? `${link.count}x` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-12 text-sm text-muted-foreground">
          No links found in your archive.
        </p>
      )}
    </div>
  );
}
