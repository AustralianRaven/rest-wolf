#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { execSync, spawnSync } = require('child_process');

const ELECTRON_PKG = path.join(__dirname, '..', 'packages', 'bruno-electron', 'package.json');

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

function shCapture(cmd) {
  return execSync(cmd, { stdio: ['pipe', 'pipe', 'inherit'] }).toString().trim();
}

function bump(version, type) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version);
  if (!m) throw new Error(`Cannot parse version: ${version}`);
  let [, major, minor, patch, pre] = m;
  major = +major; minor = +minor; patch = +patch;

  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    case 'prerelease': {
      if (pre) {
        const parts = pre.split('.');
        const last = parts[parts.length - 1];
        if (/^\d+$/.test(last)) parts[parts.length - 1] = String(+last + 1);
        else parts.push('1');
        return `${major}.${minor}.${patch}-${parts.join('.')}`;
      }
      return `${major}.${minor}.${patch + 1}-rc.0`;
    }
    default: throw new Error(`Unknown bump type: ${type}`);
  }
}

async function main() {
  const status = shCapture('git status --porcelain');
  if (status) {
    console.error('Working tree is not clean. Commit or stash changes first.');
    process.exit(1);
  }

  const currentBranch = shCapture('git rev-parse --abbrev-ref HEAD');
  if (currentBranch !== 'main') {
    console.warn(`You are on "${currentBranch}", not "main". The release branch will fork from here.`);
  }

  sh('git fetch origin --tags');

  const pkg = JSON.parse(fs.readFileSync(ELECTRON_PKG, 'utf8'));
  const current = pkg.version;
  console.log(`Current version: ${current}`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const types = ['patch', 'minor', 'major', 'prerelease'];
  console.log('\nSelect bump type:');
  types.forEach((t, i) => console.log(`  ${i + 1}) ${t}  ->  ${bump(current, t)}`));
  const choice = (await rl.question('Enter 1-4 (default 1): ')).trim() || '1';
  const idx = parseInt(choice, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= types.length) {
    console.error('Invalid selection');
    process.exit(1);
  }
  const type = types[idx];
  const next = bump(current, type);

  const confirm = (await rl.question(`\nBump ${current} -> ${next} and open a release PR? [y/N]: `)).trim().toLowerCase();
  rl.close();
  if (confirm !== 'y' && confirm !== 'yes') {
    console.log('Aborted.');
    process.exit(0);
  }

  const branch = `release/v${next}`;
  sh(`git checkout -b ${branch}`);

  pkg.version = next;
  fs.writeFileSync(ELECTRON_PKG, JSON.stringify(pkg, null, 2) + '\n');

  sh(`git add ${path.relative(process.cwd(), ELECTRON_PKG).replace(/\\/g, '/')}`);
  sh(`git commit -m "chore(release): v${next}"`);
  sh(`git push -u origin ${branch}`);

  const title = `Release v${next}`;
  const body = [
    `## Release v${next}`,
    '',
    `Bumps RestWolf from \`${current}\` to \`${next}\`.`,
    '',
    'Merging this PR will trigger the release workflow:',
    '',
    `- Tag \`v${next}\` is pushed`,
    '- Installers are built and published for Windows, macOS, Linux',
    '- The GitHub release is un-drafted'
  ].join('\n');

  const gh = spawnSync('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body, '--label', 'release'], { stdio: 'inherit' });
  if (gh.status !== 0) {
    console.warn('\n`gh pr create` failed (or `release` label missing). Branch is pushed — open the PR manually.');
    process.exit(gh.status ?? 1);
  }

  console.log(`\nDone. Once the PR is merged, the release workflow will publish v${next}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
