// pnpm's workspace hoisting can hide bogon's undeclared b4a import. Exercise
// the actual npm layout when another package depends on the published CLI.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const work = mkdtempSync(join(tmpdir(), 'mcpwire-install-'));
const env = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: tmpdir(), NODE_PATH: '', NODE_OPTIONS: '' };
try {
  const cliTarball = join(work, 'cli.tgz');
  execFileSync('pnpm', ['--dir', root, 'pack', '--out', cliTarball], { stdio: 'pipe' });
  const consumer = join(work, 'consumer');
  mkdirSync(consumer);
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    name: 'mcpwire-install-fixture', version: '1.0.0', type: 'module',
    bin: { 'mcpwire-install-fixture': 'check.mjs' },
    dependencies: { '@mcpwire/cli': `file:${cliTarball}` },
  }));
  writeFileSync(join(consumer, 'check.mjs'), `#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {createSwarm}=await import(pathToFileURL(require.resolve('@mcpwire/cli/dist/dht.js')).href);
assert.equal(typeof createSwarm,'function');
const {runShare}=await import(pathToFileURL(require.resolve('@mcpwire/cli/dist/share.js')).href);
const {runJoin}=await import(pathToFileURL(require.resolve('@mcpwire/cli/dist/join.js')).href);
assert.equal(typeof runShare,'function');
assert.equal(typeof runJoin,'function');
console.log('Fresh wrapped npx install loaded native DHT, share and join.');
`, { mode: 0o755 });
  const wrapper = join(work, 'consumer.tgz');
  execFileSync('pnpm', ['--dir', consumer, 'pack', '--out', wrapper], { stdio: 'pipe', env });
  const output = execFileSync('npx', ['--yes', '--loglevel=error', '--cache', join(work, 'cache'), `--package=${wrapper}`, 'mcpwire-install-fixture'], { cwd: work, env, encoding: 'utf8', timeout: 120000 });
  assert.match(output, /Fresh wrapped npx install loaded native DHT, share and join/);
  process.stdout.write(output);
} finally {
  rmSync(work, { recursive: true, force: true });
}
