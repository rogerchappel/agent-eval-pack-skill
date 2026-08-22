import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'agent-eval-pack-smoke-'));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    process.stderr.write(`${result.stdout || ''}${result.stderr || ''}`);
    throw new Error(`${command} ${args.join(' ')} exited ${result.status}`);
  }
  return result;
}

try {
  const pack = run('npm', ['pack', '--json', '--pack-destination', temporaryDirectory]);
  const [{ filename, files }] = JSON.parse(pack.stdout);
  const packagedFiles = new Set(files.map(({ path }) => path));
  const required = [
    'bin/agent-eval-pack.js',
    'src/index.js',
    'fixtures/success-run.md',
    'fixtures/mixed-run.md',
    'docs/SCHEMA.md',
    'docs/REDACTION.md',
    'docs/RELEASE_CANDIDATE.md',
    'SKILL.md',
    'README.md',
    'LICENSE',
    'SECURITY.md',
    'CHANGELOG.md'
  ];

  const missing = required.filter((entry) => !packagedFiles.has(entry));
  if (missing.length > 0) {
    throw new Error(`package smoke missing entries:\n${missing.join('\n')}`);
  }

  const consumerDirectory = join(temporaryDirectory, 'consumer');
  run('npm', ['init', '--yes'], { cwd: temporaryDirectory });
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(temporaryDirectory, filename)], {
    cwd: temporaryDirectory
  });

  const packageDirectory = join(temporaryDirectory, 'node_modules', 'agent-eval-pack-skill');
  const documentedCli = ['exec', '--', 'agent-eval-pack'];
  run('npm', [...documentedCli, 'build', join(packageDirectory, 'fixtures', 'success-run.md'), '--out', consumerDirectory], {
    cwd: temporaryDirectory
  });
  run('npm', [...documentedCli, 'validate', join(consumerDirectory, 'evals.json')], {
    cwd: temporaryDirectory
  });

  const evals = JSON.parse(readFileSync(join(consumerDirectory, 'evals.json'), 'utf8'));
  if (!Array.isArray(evals.cases) || evals.cases.length !== 1) {
    throw new Error('installed-package smoke did not create one valid eval case');
  }
  if (!readFileSync(join(consumerDirectory, 'review-brief.md'), 'utf8').trim()) {
    throw new Error('installed-package smoke created an empty review brief');
  }

  console.log('package smoke passed');
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
