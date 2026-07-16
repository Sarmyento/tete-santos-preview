/**
 * Configura core.hooksPath=.githooks (uma vez por clone / npm install).
 * Fail-soft: não quebra install se git estiver indisponível.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const hooksDir = join(process.cwd(), '.githooks');
if (!existsSync(hooksDir)) {
  console.warn('[setup-git-hooks] .githooks/ ausente — skip');
  process.exit(0);
}

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
} catch {
  console.warn('[setup-git-hooks] não é um git work tree — skip');
  process.exit(0);
}

try {
  execSync('git config core.hooksPath .githooks', { stdio: 'inherit' });
  console.log('[setup-git-hooks] core.hooksPath=.githooks');
} catch (err) {
  console.warn(
    '[setup-git-hooks] falha ao configurar hooksPath:',
    err instanceof Error ? err.message : err,
  );
  process.exit(0);
}
