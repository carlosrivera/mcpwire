// Real SDK client -> CLI join -> Noise/DHT -> CLI share -> real MCP server.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createSocket } from 'node:dgram';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import DHT from 'hyperdht';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = path.join(root, 'dist/index.js');
const filesystem = fileURLToPath(import.meta.resolve('@modelcontextprotocol/server-filesystem/dist/index.js'));
const work = mkdtempSync(path.join(tmpdir(), 'mcpwire-e2e-'));
const socket = createSocket('udp4');
socket.bind(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const boot = DHT.bootstrapper(port, '127.0.0.1');
await boot.ready();
const isPublic = process.argv.includes('--public');
const env = { ...process.env, MCPWIRE_BOOTSTRAP: `127.0.0.1:${port}` };
if (isPublic) delete env.MCPWIRE_BOOTSTRAP;
const runs = Number(process.env.MCPWIRE_E2E_RUNS || 10);
assert(Number.isInteger(runs) && runs > 0);

async function runSession(kind, iteration) {
  const folder = path.join(work, `${kind}-${iteration}`);
  const { mkdirSync } = await import('node:fs');
  mkdirSync(folder);
  writeFileSync(path.join(folder, 'report.txt'), 'Revenue: 42\nContact: root@corp.example.com\n');
  const record = path.join(folder, 'session.wirelog');
  const isSqlite = kind === 'sqlite';
  const limited = kind === 'limited';
  const missing = kind === 'missing';
  const allow = isSqlite ? 'read_query,list_tables,describe_table' : 'read_file,list_directory';
  const command = missing ? ['mcpwire-nonexistent-test-command'] : isSqlite ? ['uvx', '--with', 'mcp<2', 'mcp-server-sqlite', '--db-path', path.join(folder, 'app.db')] : [process.execPath, filesystem, folder];
  // stderr is deliberately consumed without logging: logging can hide the LAN race.
  const host = spawn(process.execPath, [cli, 'share', '--allow', allow, '--redact-secrets', '--ttl', '60s', ...(limited ? ['--max-calls', '1'] : []), '--record', record, '--', ...command], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let hostLog = '';
  host.stderr.on('data', (data) => { hostLog += data; });
  let guestLog = '';
  let client;
  let timer;
  const check = async () => {
    const deadline = Date.now() + (isPublic ? 30000 : 5000);
    while (!/wire:\/\/[a-f0-9]{64}/.test(hostLog) && Date.now() < deadline && host.exitCode === null) await new Promise((resolve) => setTimeout(resolve, 10));
    const ticket = hostLog.match(/wire:\/\/[a-f0-9]{64}/)?.[0];
    assert(ticket, 'host must announce a ticket');
    client = new Client({ name: 'mcpwire-real-e2e', version: '1.0.0' });
    const transport = new StdioClientTransport({ command: process.execPath, args: [cli, 'join', ticket], env, stderr: 'pipe' });
    transport.stderr.on('data', (data) => { guestLog += data; });
    if (missing) {
      await assert.rejects(client.connect(transport), /closed|reset|error/i);
      assert(hostLog.includes('Child process error'));
      return;
    }
    await client.connect(transport);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((t) => t.name).sort(), allow.split(',').sort());
    if (isSqlite) {
      const result = await client.callTool({ name: 'read_query', arguments: { query: "SELECT 42 AS revenue, 'root@corp.example.com' AS contact" } });
      assert(!result.isError, JSON.stringify(result));
      const text = JSON.stringify(result);
      assert(text.includes('42'));
      assert(text.includes('[REDACTED_BY_MCPWIRE]'));
      assert(!text.includes('root@corp.example.com'));
    } else {
      if (limited) {
        writeFileSync(path.join(folder, 'report.txt'), 'Revenue: 42\n' + 'x'.repeat(256 * 1024));
        const final = await client.callTool({ name: 'read_file', arguments: { path: path.join(folder, 'report.txt') } });
        assert(!final.isError);
        assert(JSON.stringify(final).includes('Revenue: 42'));
        assert(JSON.stringify(final).length > 256 * 1024, 'final response must not be truncated');
        return;
      }
      const listing = await client.callTool({ name: 'list_directory', arguments: { path: folder } });
      assert(!listing.isError);
      assert(JSON.stringify(listing).includes('report.txt'));
      const result = await client.callTool({ name: 'read_file', arguments: { path: path.join(folder, 'report.txt') } });
      assert(!result.isError);
      const text = JSON.stringify(result);
      assert(text.includes('Revenue: 42'));
      assert(text.includes('[REDACTED_BY_MCPWIRE]'));
      assert(!text.includes('root@corp.example.com'));
    }
    const blockedTool = isSqlite ? 'write_query' : 'write_file';
    const args = isSqlite ? { query: 'CREATE TABLE should_not_exist (id INTEGER)' } : { path: path.join(folder, 'should-not-exist.txt'), content: 'bad' };
    await assert.rejects(client.callTool({ name: blockedTool, arguments: args }), /MCPWire Firewall/);
    if (!isSqlite) assert(!existsSync(path.join(folder, 'should-not-exist.txt')));
    const events = readFileSync(record, 'utf8').trim().split('\n').map(JSON.parse);
    assert(events.some((e) => e.t === 'redacted'));
    assert(events.some((e) => e.t === 'blocked' && e.tool === blockedTool));
  };
  try {
    await Promise.race([check(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('end-to-end session timed out')), (isPublic ? 60000 : 20000)); })]);
  } catch (error) {
    console.error(`\n${hostLog}\n${guestLog}`);
    throw error;
  } finally {
    clearTimeout(timer);
    await client?.close().catch(() => {});
    const exited = once(host, 'exit');
    if (host.exitCode === null && host.signalCode === null) {
      host.kill('SIGTERM');
      const force = setTimeout(() => host.kill('SIGKILL'), 3000);
      await exited;
      clearTimeout(force);
    }
  }
}

try {
  for (let i = 0; i < runs; i++) {
    await runSession('filesystem', i);
    console.log(`PASS filesystem ${i + 1}/${runs}: initialize, tools/list, read, redaction, denied write, recording`);
  }
  await runSession('missing', 0);
  console.log('PASS missing executable: client gets a connection error without hanging');
  await runSession('limited', 0);
  console.log('PASS call budget: final allowed response arrives before session closes');
  if (process.argv.includes('--sqlite')) {
    await runSession('sqlite', 0);
    console.log('PASS SQLite: initialize, tools/list, SELECT, redaction, denied write, recording');
  }
} finally {
  await boot.destroy({ force: true });
  rmSync(work, { recursive: true, force: true });
}
