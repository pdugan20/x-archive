'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Tables } from '@/types/database';
import { useActionState } from 'react';
import { saveSettings } from './actions';

type Settings = Tables<'settings'>;

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { success?: boolean; error?: string } | null,
      formData: FormData
    ) => {
      const result = await saveSettings(formData);
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto_delete_enabled">Auto-delete enabled</Label>
          <Switch
            id="auto_delete_enabled"
            name="auto_delete_enabled"
            defaultChecked={settings.auto_delete_enabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="dry_run_mode">
            Dry-run mode
            <span className="block text-xs font-normal text-muted-foreground">
              Log deletions without actually deleting
            </span>
          </Label>
          <Switch
            id="dry_run_mode"
            name="dry_run_mode"
            defaultChecked={settings.dry_run_mode}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Retention (days)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="retention_days_post" className="text-xs">
              Posts
            </Label>
            <Input
              id="retention_days_post"
              name="retention_days_post"
              type="number"
              min={0}
              defaultValue={settings.retention_days_post}
            />
          </div>
          <div>
            <Label htmlFor="retention_days_reply" className="text-xs">
              Replies
            </Label>
            <Input
              id="retention_days_reply"
              name="retention_days_reply"
              type="number"
              min={0}
              defaultValue={settings.retention_days_reply}
            />
          </div>
          <div>
            <Label htmlFor="retention_days_retweet" className="text-xs">
              Retweets
            </Label>
            <Input
              id="retention_days_retweet"
              name="retention_days_retweet"
              type="number"
              min={0}
              defaultValue={settings.retention_days_retweet}
            />
          </div>
          <div>
            <Label htmlFor="retention_days_quote_tweet" className="text-xs">
              Quote Tweets
            </Label>
            <Input
              id="retention_days_quote_tweet"
              name="retention_days_quote_tweet"
              type="number"
              min={0}
              defaultValue={settings.retention_days_quote_tweet}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Set to 0 to never delete that type.
        </p>
      </div>

      <div>
        <Label htmlFor="viral_threshold">
          Viral protection threshold (likes)
        </Label>
        <Input
          id="viral_threshold"
          name="viral_threshold"
          type="number"
          min={0}
          defaultValue={settings.viral_threshold}
          className="mt-1 max-w-32"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Tweets with this many likes or more will not be deleted.
        </p>
      </div>

      <div>
        <Label htmlFor="protected_keywords">Protected keywords</Label>
        <Input
          id="protected_keywords"
          name="protected_keywords"
          defaultValue={(settings.protected_keywords ?? []).join(', ')}
          placeholder="keyword1, keyword2"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Comma-separated. Tweets containing these words will not be deleted.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {state?.success && (
        <p className="text-sm text-green-600">Settings saved.</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  );
}
