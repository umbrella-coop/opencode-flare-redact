import { build } from 'esbuild';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(import.meta.url);
const pkgDir = resolve(dirname(here), '..');
const outfile = join(pkgDir, 'plugin', 'scripts', 'guard-hook.mjs');
mkdirSync(dirname(outfile), { recursive: true });

await build({
  entryPoints: [join(pkgDir, 'src', 'cli.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile,
  banner: { js: '#!/usr/bin/env node' },
});

chmodSync(outfile, 0o755);
console.log(`bundled ${outfile}`);
