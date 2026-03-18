import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Import</h1>
        <p className="text-sm text-muted-foreground">
          Import your Twitter data export to populate the archive.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CLI Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download your Twitter data export from Settings &gt; Your Account
            &gt; Download an archive of your data, then run:
          </p>
          <pre className="rounded-md bg-muted p-3 text-sm">
            npm run import -- --file ~/Downloads/twitter-archive.zip
          </pre>
          <p className="text-sm text-muted-foreground">Options:</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>
              <code className="text-xs">--username &lt;handle&gt;</code> Your X
              username (default: doog)
            </li>
            <li>
              <code className="text-xs">--skip-media</code> Skip uploading
              images to storage
            </li>
            <li>
              <code className="text-xs">--dry-run</code> Parse without writing
              to database
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
