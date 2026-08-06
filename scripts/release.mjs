#!/usr/bin/env node
/**
 * Release runner for the changesets CI/CD pipeline.
 *
 * Publishes versioned packages to npm when NPM_TOKEN is available; otherwise
 * falls back to creating git tags only (useful for git-distributed plugins such
 * as Claude Code / Copilot marketplaces).
 *
 * Run via: pnpm release
 */
import { execSync } from 'node:child_process';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

const registryLoginConfigured = process.env.NPM_TOKEN;

if (registryLoginConfigured) {
  console.log('NPM_TOKEN present — publishing to npm.');
  run('pnpm changeset publish');
} else {
  console.log('NPM_TOKEN not set — skipping npm publish.');
  console.log('Creating git tags for versioned packages.');
  run('pnpm changeset tag');
}
