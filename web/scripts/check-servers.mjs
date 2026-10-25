import { loadCatalog } from '../../catalog/load.mjs';
// Validate command/package routing without starting services or using credentials.
import assert from 'node:assert/strict';
const servers = loadCatalog();
const failures = [];
const results = await Promise.allSettled(servers.map(async (server) => {
  const names = server.tools.map((tool) => tool.name);
  assert.equal(new Set(names).size, names.length, `${server.slug}: duplicate tools`);
  assert(!server.command.includes('undefined'), `${server.slug}: invalid command`);
  const npm = server.launch.command === 'npx';
  if (npm) {
    assert(server.launch.args.includes(`${server.package}@${server.packageVersion}`), `${server.slug}: package and launch arguments differ`);
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(server.package)}`, { signal: AbortSignal.timeout(15000) });
    assert(response.ok, `${server.slug}: npm package returns ${response.status}`);
    const metadata = await response.json();
    assert(metadata.versions[server.packageVersion]?.bin, `${server.slug}: npm package has no CLI`);
  } else if (server.launch.command === 'uvx') {
    assert(server.launch.args.includes(`${server.package}==${server.packageVersion}`), `${server.slug}: Python package and launch arguments differ`);
    const response = await fetch(`https://pypi.org/pypi/${server.package}/${server.packageVersion}/json`, { signal: AbortSignal.timeout(15000) });
    assert(response.ok, `${server.slug}: PyPI package returns ${response.status}`);
  } else {
    throw Error(`${server.slug}: unsupported command runner`);
  }
  return server.slug;
}));
for (let i = 0; i < results.length; i++) {
  const result = results[i];
  if (result.status === 'rejected') failures.push(`${servers[i].slug}: ${result.reason.message}`);
}
if (failures.length) throw new Error(failures.join('\n'));
console.log(`PASS: ${servers.length} guide packages exist, npm packages expose CLI binaries, and command runners match.`);
