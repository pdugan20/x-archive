import { validateCronAuth } from '@/lib/utils/cron-auth';

export async function GET(request: Request) {
  if (!validateCronAuth(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { syncRecentTweets } = await import('@/lib/twitter/sync');
    const result = await syncRecentTweets();

    return Response.json({
      status: 'ok',
      synced: result.synced,
      entities: result.entities,
      media: result.media,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[CRON] Sync failed: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
