import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'vitest';
import { parse } from 'yaml';

type JsonMap = Record<string, unknown>;

const root = process.cwd();
const workflowsDirectory = join(root, '.github/workflows');
const actionsDirectory = join(root, '.github/actions');

function yamlFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return yamlFiles(path);
    return /\.ya?ml$/.test(entry) ? [path] : [];
  });
}

function object(value: unknown, message: string): JsonMap {
  assert.equal(typeof value, 'object', message);
  assert.notEqual(value, null, message);
  assert.equal(Array.isArray(value), false, message);
  return value as JsonMap;
}

function validatePermissions(value: unknown, location: string): void {
  if (typeof value === 'string') {
    assert.equal(value, 'read-all', `${location} must be read-only`);
    return;
  }

  const permissions = object(value, `${location} must be explicit`);
  for (const [scope, access] of Object.entries(permissions)) {
    assert.ok(
      access === 'read' || access === 'none',
      `${location}.${scope} requests non-read access: ${String(access)}`
    );
  }
}

function validateWorkflow(source: string, location: string): void {
  const workflow = object(parse(source), `${location} must contain a YAML map`);
  assert.ok('permissions' in workflow, `${location} must declare permissions`);
  validatePermissions(workflow.permissions, `${location}.permissions`);

  const jobs = object(workflow.jobs, `${location}.jobs must be a map`);
  for (const [jobName, jobValue] of Object.entries(jobs)) {
    const job = object(jobValue, `${location}.jobs.${jobName} must be a map`);
    if ('permissions' in job) {
      validatePermissions(
        job.permissions,
        `${location}.jobs.${jobName}.permissions`
      );
    }

    const steps = Array.isArray(job.steps) ? job.steps : [];
    for (const [index, stepValue] of steps.entries()) {
      const step = object(
        stepValue,
        `${location}.jobs.${jobName}.steps[${index}] must be a map`
      );
      if (typeof step.uses === 'string' && !step.uses.startsWith('./')) {
        assert.match(
          step.uses,
          /^[^@\s]+@[0-9a-f]{40}$/,
          `${location} contains a mutable action reference: ${step.uses}`
        );
      }
    }
  }

  assert.doesNotMatch(
    source,
    /\bgh\s+pr\s+merge\b|enablePullRequestAutoMerge|\bauto-?merge\b/i,
    `${location} contains an unattended merge path`
  );
}

test('all workflows and local actions satisfy the least-privilege contract', () => {
  const files = [
    ...yamlFiles(workflowsDirectory),
    ...yamlFiles(actionsDirectory),
  ];
  assert.ok(files.length > 0, 'no workflow files found');

  for (const file of files) {
    validateWorkflow(readFileSync(file, 'utf8'), relative(root, file));
  }
});

test('token-based Dependabot auto-merge workflow is absent', () => {
  assert.equal(
    existsSync(join(workflowsDirectory, 'dependabot-auto-merge.yml')),
    false
  );
  assert.equal(
    existsSync(join(workflowsDirectory, 'dependabot-auto-merge.yaml')),
    false
  );
});

test('Dependabot groups encode the exact risk boundaries', () => {
  const config = object(
    parse(readFileSync(join(root, '.github/dependabot.yml'), 'utf8')),
    'dependabot config must be a YAML map'
  );
  assert.ok(Array.isArray(config.updates), 'dependabot updates must be a list');
  const npm = config.updates
    .map((value) => object(value, 'dependabot update must be a map'))
    .find((update) => update['package-ecosystem'] === 'npm');
  assert.ok(npm, 'npm Dependabot configuration is missing');

  assert.deepEqual(object(npm.groups, 'npm groups must be a map'), {
    formatter: {
      patterns: ['prettier', 'prettier-plugin-*'],
      'dependency-type': 'development',
      'update-types': ['minor', 'patch'],
    },
    'development-patches': {
      'dependency-type': 'development',
      'exclude-patterns': ['prettier', 'prettier-plugin-*'],
      'update-types': ['patch'],
    },
    'production-patches': {
      'dependency-type': 'production',
      'update-types': ['patch'],
    },
  });
});

test('formatter packages use exact versions', () => {
  const packageJson = JSON.parse(
    readFileSync(join(root, 'package.json'), 'utf8')
  ) as JsonMap;
  const devDependencies = object(
    packageJson.devDependencies,
    'devDependencies must be a map'
  );
  const formatters = Object.entries(devDependencies).filter(
    ([name]) => name === 'prettier' || name.startsWith('prettier-plugin-')
  );
  assert.ok(formatters.length >= 3, 'expected formatter packages are missing');

  for (const [name, version] of formatters) {
    assert.equal(typeof version, 'string', `${name} version must be a string`);
    assert.match(
      version as string,
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/,
      `${name} must use an exact version`
    );
  }
});

test.each([
  ['omitted permissions', 'jobs: { test: { steps: [] } }'],
  [
    'write-all permissions',
    'permissions: write-all\njobs: { test: { steps: [] } }',
  ],
  [
    'flow-style write permission',
    'permissions: { contents: write }\njobs: { test: { steps: [] } }',
  ],
  [
    'mutable flow-style action',
    'permissions: read-all\njobs: { test: { steps: [{ uses: actions/checkout@v7 }] } }',
  ],
  [
    'renamed auto-merge command',
    'permissions: read-all\njobs: { test: { steps: [{ run: "gh pr merge --auto" }] } }',
  ],
])('rejects %s', (_name, source) => {
  assert.throws(() => validateWorkflow(source, 'fixture.yaml'));
});
