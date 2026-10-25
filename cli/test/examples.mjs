import { loadCatalog, readEntries } from '../../catalog/load.mjs';
import { resolveLaunch } from '../../catalog/normalize.mjs';
// Initialize published examples and validate selected allowlist names, without
// making calls to credential-backed services. Requires uvx for Python servers.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const servers = loadCatalog();
const folder = mkdtempSync(path.join(tmpdir(), 'mcpwire-git-example-'));
execFileSync('git', ['init', '-q', folder]);
const entries = readEntries();
// Only this reviewed set is executed; adding a catalog folder does not run code.
const fixtures = [
  ['git', {repository:folder}],
  ['fetch', {}],
  ['time', {}],
  ['sequential-thinking', {}],
  ['everything', {}],
  ['notion', {}, {NOTION_TOKEN:'test-token'}],
  ['context7', {}],
  ['supabase', {project_ref:'test-project'}, {SUPABASE_ACCESS_TOKEN:'sbp_' + 'a'.repeat(40)}],
  ['figma', {}, {FIGMA_API_KEY:'test-token'}],
];
const configs = fixtures.map(([slug, inputs, credentials]) => {
  const entry = entries.find(entry => entry.folder === slug);
  const launch = resolveLaunch(entry.server, entry.policy, inputs);
  return [slug, launch.command, launch.args, credentials];
});
try {
  const results = await Promise.allSettled(configs.map(async ([slug, command, args, credentials]) => {
    const client = new Client({ name: 'mcpwire-example-test', version: '1' });
    const env = { PATH: process.env.PATH, ...credentials };
    for (const key of ['UV_CACHE_DIR', 'npm_config_cache']) if (process.env[key]) env[key] = process.env[key];
    const transport = new StdioClientTransport({ command, args, env, stderr: 'pipe' });
    let stderr = '';
    transport.stderr.on('data', (data) => { stderr += data; });
    let timer;
    try {
      await Promise.race([client.connect(transport), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${slug}: initialization timed out`)), 45000); })]);
      const response = await client.listTools();
      const actual = new Set(response.tools.map((tool) => tool.name));
      const server = servers.find((server) => server.slug === slug);
      for (const tool of server.tools.filter((tool) => server.defaults.allow.includes(tool.name))) {
        assert(actual.has(tool.name), `${slug}: allowlisted tool ${tool.name} does not exist`);
      }
      console.log(`PASS ${slug}: MCP initialization and guide allowlist verified`);
    } catch (error) {
      throw new Error(`${slug}: ${error.message}\n${stderr}`);
    } finally {
      clearTimeout(timer);
      await client.close().catch(() => {});
    }
  }));
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) throw new AggregateError(failures.map((result) => result.reason), 'Example verification failed');
} finally {
  rmSync(folder, { recursive: true, force: true });
}
