// @vitest-environment node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { test } from 'vitest';

type PackageLock = {
  packages: Record<string, { version?: string }>;
};

type PackageJson = {
  overrides?: Record<string, string>;
};

const root = process.cwd();
const require = createRequire(import.meta.url);
const { load } = require('js-yaml') as {
  load: (source: string) => unknown;
};

test('security bridge installs only the explicit patched transitive versions', () => {
  const packageJson = JSON.parse(
    readFileSync(join(root, 'package.json'), 'utf8')
  ) as PackageJson;
  const packageLock = JSON.parse(
    readFileSync(join(root, 'package-lock.json'), 'utf8')
  ) as PackageLock;

  assert.deepEqual(packageJson.overrides, {
    '@hono/node-server': '2.0.11',
    'js-yaml': '4.3.0',
  });
  assert.equal(
    packageLock.packages['node_modules/@hono/node-server'].version,
    '2.0.11'
  );
  assert.equal(packageLock.packages['node_modules/js-yaml'].version, '4.3.0');
});

test('overridden Hono adapter serves a request with the existing Hono runtime', async () => {
  const app = new Hono();
  app.get('/health', (context) => context.json({ status: 'ok' }));

  const server = serve({
    fetch: app.fetch,
    hostname: '127.0.0.1',
    port: 0,
  });

  try {
    if (!server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
      });
    }

    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('overridden js-yaml preserves ordinary merge-key parsing', () => {
  const parsed = load(`
defaults: &defaults
  enabled: true
  retries: 2
service:
  <<: *defaults
  retries: 3
`);

  assert.deepEqual(parsed, {
    defaults: { enabled: true, retries: 2 },
    service: { enabled: true, retries: 3 },
  });
});
