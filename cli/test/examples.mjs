// Initialize published examples and validate selected allowlist names, without
// making calls to credential-backed services. Requires uvx for Python servers.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const servers = JSON.parse(readFileSync(new URL('../../web/src/data/servers.json', import.meta.url)));
const folder = mkdtempSync(path.join(tmpdir(), 'mcpwire-git-example-'));
execFileSync('git', ['init', '-q', folder]);
const configs = [
  ['git', 'uvx', ['mcp-server-git', '--repository', folder]],
  ['fetch', 'uvx', ['mcp-server-fetch']],
  ['time', 'uvx', ['mcp-server-time']],
  ['sequential-thinking', 'npx', ['-y', '@modelcontextprotocol/server-sequential-thinking']],
  ['everything', 'npx', ['-y', '@modelcontextprotocol/server-everything']],
  ['notion', 'npx', ['-y', '@notionhq/notion-mcp-server'], { NOTION_TOKEN: 'test-token' }],
  ['context7', 'npx', ['-y', '@upstash/context7-mcp']],
  ['supabase', 'npx', ['-y', '@supabase/mcp-server-supabase', '--read-only'], { SUPABASE_ACCESS_TOKEN: 'sbp_' + 'a'.repeat(40) }],
];
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
      for (const tool of servers.find((server) => server.slug === slug).tools.filter((tool) => tool.risk === 'safe')) {
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
