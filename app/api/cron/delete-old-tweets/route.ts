import { validateCronAuth } from '@/lib/utils/cron-auth';

export async function GET(request: Request) {
  if (!validateCronAuth(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { getCandidatesForDeletion } =
      await import('@/lib/deletion/scheduler');
    const { executeDeletions } = await import('@/lib/deletion/executor');

    const { candidates, dryRun } = await getCandidatesForDeletion();

    if (candidates.length === 0) {
      return Response.json({
        status: 'ok',
        message: 'No tweets eligible for deletion',
        dry_run: dryRun,
      });
    }

    const result = await executeDeletions(candidates, dryRun);

    return Response.json({
      status: 'ok',
      dry_run: dryRun,
      candidates: candidates.length,
      deleted: result.success,
      failed: result.failed,
      skipped: result.skipped,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[CRON] Deletion failed: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
