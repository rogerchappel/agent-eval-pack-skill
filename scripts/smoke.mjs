import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const outputDirectory = mkdtempSync(join(tmpdir(), 'agent-eval-pack-smoke-'));
try {
  const result = spawnSync(process.execPath, [
    'bin/agent-eval-pack.js', 'build', 'fixtures/success-run.md', '--out', outputDirectory
  ], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(`${result.stdout || ''}${result.stderr || ''}`);
    throw new Error(`smoke build exited ${result.status}`);
  }
} finally {
  rmSync(outputDirectory, { recursive: true, force: true });
}
