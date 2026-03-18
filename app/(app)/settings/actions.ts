'use server';

import { updateSettings } from '@/lib/db/settings';

export async function saveSettings(
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const retentionPost = parseInt(
    formData.get('retention_days_post') as string,
    10
  );
  const retentionReply = parseInt(
    formData.get('retention_days_reply') as string,
    10
  );
  const retentionRetweet = parseInt(
    formData.get('retention_days_retweet') as string,
    10
  );
  const retentionQuote = parseInt(
    formData.get('retention_days_quote_tweet') as string,
    10
  );
  const viralThreshold = parseInt(
    formData.get('viral_threshold') as string,
    10
  );
  const protectedKeywordsRaw =
    (formData.get('protected_keywords') as string | null) ?? '';
  const protectedKeywords = protectedKeywordsRaw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  // Switches send their value only when checked
  const autoDeleteEnabled = formData.get('auto_delete_enabled') === 'on';
  const dryRunMode = formData.get('dry_run_mode') === 'on';

  const { error } = await updateSettings({
    retention_days_post: isNaN(retentionPost) ? 180 : retentionPost,
    retention_days_reply: isNaN(retentionReply) ? 180 : retentionReply,
    retention_days_retweet: isNaN(retentionRetweet) ? 180 : retentionRetweet,
    retention_days_quote_tweet: isNaN(retentionQuote) ? 180 : retentionQuote,
    viral_threshold: isNaN(viralThreshold) ? 100 : viralThreshold,
    protected_keywords: protectedKeywords,
    auto_delete_enabled: autoDeleteEnabled,
    dry_run_mode: dryRunMode,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: `Failed to save settings: ${error.message}` };
  }

  return { success: true };
}
