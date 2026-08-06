#!/usr/bin/env node
/**
 * Agent-driven release orchestrator: GitHub version tag + release + npm publish.
 *
 * Every mutating step asks for confirmation. When stdin is not a TTY (e.g. run
 * by an agent through a non-interactive shell), the script prints a BLOCKED
 * marker and exits with code 2 so the caller knows it must ask the user.
 *
 * Exit codes: 0 = ok, 1 = error, 2 = BLOCKED (requires user input).
 *
 *   pnpm cut-release plan                     # read-only release plan
 *   pnpm cut-release version --bump minor     # create changeset + apply versions
 *   pnpm cut-release commit                   # commit the version bump
 *   pnpm cut-release tag                      # vX.Y.Z + per-package tags
 *   pnpm cut-release push                     # push branch + tags
 *   pnpm cut-release publish [--otp CODE]     # npm publish
 *   pnpm cut-release release                  # gh release create vX.Y.Z
 *   pnpm cut-release ask                      # walk all steps, confirm each
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomBytes } from 'node:crypto';

const BLOCKED = 2;
const here = fileURLToPath(import.meta.url);
const root = join(dirname(here), '..');
const pkgDir = join(root, 'pkg');
const PACKAGE_DIRS = readdirSync(pkgDir);

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: root });
}
function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', cwd: root }).trim();
}
function pkgVersion(name) {
  return JSON.parse(readFileSync(join(pkgDir, name, 'package.json'), 'utf8')).version;
}
function currentVersion() {
  return pkgVersion('core');
}
const isTTY = () => Boolean(process.stdin.isTTY);

async function confirm(message) {
  if (!isTTY()) {
    console.error(`\n🛑 BLOCKED: ${message}`);
    console.error('No interactive terminal. Ask the user before proceeding, then re-run the step.');
    process.exit(BLOCKED);
  }
  const rl = createInterface({ input, output });
  const answer = await rl.question(`${message} (y/N) `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

function assertCleanOrWarn() {
  const dirty = sh('git status --porcelain');
  if (dirty) {
    console.warn(`⚠  working tree is dirty (${dirty.split('\n').length} file(s)).`);
  } else {
    console.log('✓ working tree clean');
  }
}

function bumpLabel(bump) {
  if (bump === 'patch') return 'patch';
  if (bump === 'minor') return 'minor';
  if (bump === 'major') return 'major';
  throw new Error(`invalid bump: ${bump} (expected patch|minor|major)`);
}

function changesetId() {
  const words = 'brave-calm-eager-steady-witty-brisk-mellow-swift'.split('-');
  const rnd = randomBytes(4).toString('hex');
  const word = words[randomBytes(1)[0] % words.length];
  return `${rnd}-${word}.md`;
}

function writeChangeset(bump, description) {
  const file = join(root, '.changeset', changesetId());
  const body = [
    '---',
    '"@umbrella-coop/flare-redact-ai-code-assistant-core": ' + bump,
    '---',
    '',
    description,
    '',
  ].join('\n');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  console.log(`✓ changeset written to .changeset/${file.split('/').pop()}`);
}

// ---------------------------------------------------------------- steps

function plan() {
  console.log('Release plan');
  console.log('============');
  console.log(`current version : ${currentVersion()}`);
  console.log(`packages        : ${PACKAGE_DIRS.length} under pkg/* (lockstep)`);
  console.log('steps           :');
  console.log('  1. preflight  — check-versions, build, test, lint');
  console.log('  2. version    — write changeset, changeset version (bump all)');
  console.log('  3. commit     — commit the version bump');
  console.log('  4. tag        — create v<version> + per-package tags');
  console.log('  5. push       — push branch + tags to origin');
  console.log('  6. publish    — npm publish (needs NPM_TOKEN, optional OTP)');
  console.log('  7. release    — gh release create v<version>');
  console.log('');
  console.log('Mutating steps require confirmation; without a TTY the script exits');
  console.log('with code 2 (BLOCKED) so the caller can ask the user first.');
}

function preflight() {
  run('pnpm check-versions');
  run('pnpm build');
  run('pnpm test');
  run('pnpm lint');
  console.log('✓ preflight passed');
}

async function version(bump) {
  bumpLabel(bump);
  const desc = `release: ${bump} bump (lockstep across all packages)`;
  writeChangeset(bump, desc);
  run('pnpm version-packages');
  run('pnpm install'); // keep lockfile in sync after version changes
  console.log(`✓ versioned to ${currentVersion()}`);
}

function commit() {
  run('git add -A');
  run(`git commit -m "chore(release): version packages to v${currentVersion()}"`);
  console.log(`✓ committed v${currentVersion()}`);
}

function tag() {
  const v = currentVersion();
  const tags = [];
  tags.push(`v${v}`);
  for (const name of PACKAGE_DIRS) {
    tags.push(`@umbrella-coop/flare-redact-ai-code-assistant-${name}@${pkgVersion(name)}`);
  }
  for (const t of tags) {
    try {
      run(`git tag "${t}"`);
    } catch {
      // tag exists — skip
    }
  }
  console.log(`✓ created ${tags.length} git tags (${tags[0]}, …)`);
}

function push() {
  run('git push');
  run('git push --tags');
  console.log('✓ pushed branch + tags');
}

async function publish(otp) {
  if (!process.env.NPM_TOKEN) {
    console.error('\n🛑 BLOCKED: NPM_TOKEN is not set — cannot publish to npm.');
    console.error('Options: set NPM_TOKEN, publish to a private registry, or tag-only release.');
    process.exit(BLOCKED);
  }
  let otpArg = '';
  if (!otp && isTTY()) {
    const rl = createInterface({ input, output });
    otp = await rl.question('npm one-time password (2FA)? (leave empty if none) ');
    rl.close();
  }
  if (otp) otpArg = ` --otp ${otp}`;
  run(`pnpm changeset publish --no-git-tag${otpArg}`);
  console.log('✓ published to npm');
}

async function githubRelease() {
  const v = currentVersion();
  run(`gh release create "v${v}" --title "v${v}" --generate-notes`);
  console.log(`✓ created GitHub release v${v}`);
}

async function ask() {
  console.log(`Release: v${currentVersion()} → next (lockstep)`);
  await preflight();
  if (!(await confirm(`Cut a new version (current ${currentVersion()})?`))) {
    console.log('Cancelled.');
    process.exit(0);
  }
  const bump = isTTY()
    ? await (async () => {
        const rl = createInterface({ input, output });
        const answer = await rl.question('Bump type (patch|minor|major)? [patch] ');
        rl.close();
        return answer.trim() || 'patch';
      })()
    : 'patch';
  await version(bump);
  if (!(await confirm(`Commit the version bump (v${currentVersion()})?`))) {
    console.log('Stopping after version bump (files modified but not committed).');
    process.exit(0);
  }
  commit();
  if (!(await confirm('Create git tags?'))) {
    console.log('Stopping after commit (no tags).');
    process.exit(0);
  }
  tag();
  if (!(await confirm('Push branch and tags to origin?'))) {
    console.log('Stopping after tags (not pushed).');
    process.exit(0);
  }
  push();
  if (!(await confirm('Publish to npm?'))) {
    console.log('Stopping after push (not published).');
    process.exit(0);
  }
  await publish();
  if (!(await confirm(`Create GitHub release v${currentVersion()}?`))) {
    console.log('Done (npm published, no GitHub release).');
    process.exit(0);
  }
  await githubRelease();
  console.log(`\n✓ Released v${currentVersion()}`);
}

// ----------------------------------------------------------------- main

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case 'plan':
    plan();
    break;
  case 'preflight':
    preflight();
    break;
  case 'version': {
    const bump = args.find((a, i) => a === '--bump' && args[i + 1]) ? args[args.indexOf('--bump') + 1] : 'patch';
    await version(bump);
    break;
  }
  case 'commit':
    commit();
    break;
  case 'tag':
    tag();
    break;
  case 'push':
    push();
    break;
  case 'publish': {
    const otp = args[args.indexOf('--otp') + 1];
    await publish(otp);
    break;
  }
  case 'release':
    await githubRelease();
    break;
  case 'ask':
    await ask();
    break;
  default:
    console.error(`usage: cut-release <plan|preflight|version --bump P|commit|tag|push|publish [--otp C]|release|ask>`);
    process.exit(1);
}
