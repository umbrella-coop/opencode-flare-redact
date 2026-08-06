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
const otp = process.env.NPM_OTP;

if (registryLoginConfigured) {
  console.log('NPM_TOKEN present — publishing to npm.');
  run(`pnpm changeset publish${otp ? ` --otp ${otp}` : ''}`);
} else if (process.env.CI) {
  console.error('NPM_TOKEN is not set — refusing to silently skip npm publish in CI.');
  console.error('Add an NPM_TOKEN repository secret (scope @umbrella-coop, access: public) and re-run.');
  process.exit(1);
} else {
  console.log('NPM_TOKEN not set — skipping npm publish.');
  console.log('Creating git tags for versioned packages.');
  run('pnpm changeset tag');
}
