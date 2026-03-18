import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSettings } from '@/lib/db/settings';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure retention periods and deletion rules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deletion Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">X Username:</span>{' '}
            {settings.x_username ? `@${settings.x_username}` : 'Not connected'}
          </p>
          <p>
            <span className="text-muted-foreground">Last Sync:</span>{' '}
            {settings.last_sync_at
              ? new Date(settings.last_sync_at).toLocaleString()
              : 'Never'}
          </p>
          <p>
            <span className="text-muted-foreground">Last Deletion Run:</span>{' '}
            {settings.last_deletion_run_at
              ? new Date(settings.last_deletion_run_at).toLocaleString()
              : 'Never'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
