#!/usr/bin/env node
/**
 * Enforce lockstep semantic versioning: every workspace package must share the
 * same version, so a single release moves the whole monorepo together.
 *
 * Run via: pnpm check-versions
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(import.meta.url);
const root = join(here, '..', '..');
const pkgDir = join(root, 'pkg');

const versions = new Map();
for (const name of readdirSync(pkgDir)) {
  const file = join(pkgDir, name, 'package.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  versions.set(name, pkg.version);
}

const unique = new Set(versions.values());
if (unique.size !== 1) {
  console.error('Package versions diverge (lockstep required):');
  for (const [name, version] of versions) console.error(`  ${name}: ${version}`);
  process.exit(1);
}

console.log(`lockstep version ${[...unique][0]} across ${versions.size} packages`);
