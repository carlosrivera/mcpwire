// Test suite: unit tests for scrub/firewall/duration + offline e2e through the
// real handlePeerConnection() code path (via stream.duplexPair), + optional
// real P2P e2e through hyperswarm on a private local bootstrapper.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createSocket } from 'node:dgram';
import { once } from 'node:events';
import { duplexPair } from 'node:stream';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = (p) => path.join(root, '..', 'dist', p);

const { scrubSecrets } = await import(dist('scrub.js'));
const { parsePolicy, isCallAllowed, filterToolList } = await import(dist('firewall.js'));
const { parseDuration } = await import(dist('ui.js'));
const { handlePeerConnection } = await import(dist('share.js'));
const { Recorder } = await import(dist('recorder.js'));

let passed = 0;
function ok(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ✅ ${name}`);
    })
    .catch((err) => {
      console.error(`  ❌ ${name}\n     ${err.message}`);
      process.exitCode = 1;
    });
}

console.log('\n🧪 mcpwire test suite\n');

// ---------------------------------------------------------------- unit: scrub
await ok('scrub: redacts OpenAI-style keys', () => {
  const r = scrubSecrets('key sk-proj-abcdefghijklmnopqrstuvwx here');
  assert.equal(r.count, 1);
  assert(r.text.includes('[REDACTED_BY_MCPWIRE]'));
  assert(!r.text.includes('sk-proj-'));
});

await ok('scrub: redacts GitHub/Slack/GitLab tokens', () => {
  const r = scrubSecrets(`ghp_${'a'.repeat(36)} xoxb-1234567890abcdefghijklmnop glpat-${'b'.repeat(24)}`);
  assert.equal(r.count, 3);
});

await ok('scrub: redacts emails', () => {
  const r = scrubSecrets('contact ceo@acme-corp.com asap');
  assert.equal(r.count, 1);
});

await ok('scrub: redacts Luhn-valid cards but not random 16-digit ids', () => {
  const r = scrubSecrets('pay with 4111 1111 1111 1111 ref 1234567812345678');
  assert.equal(r.count, 1);
  assert(r.text.includes('1234567812345678'));
});

await ok('scrub: redacts JWTs', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N65IjLZqI';
  const r = scrubSecrets(`token ${jwt} end`);
  assert.equal(r.count, 1);
});

await ok('scrub: large file content does not stall email detection', () => {
  const body = 'x'.repeat(512 * 1024);
  const started = performance.now();
  const r = scrubSecrets(body + '\nroot@corp.example.com');
  assert.equal(r.text, body + '\n[REDACTED_BY_MCPWIRE]');
  assert(performance.now() - started < 2000, 'redaction must not block the event loop');
});

await ok('scrub: leaves benign text untouched', () => {
  const r = scrubSecrets('SELECT count(*) FROM orders LIMIT 5');
  assert.equal(r.count, 0);
  assert.equal(r.text, 'SELECT count(*) FROM orders LIMIT 5');
});

// ------------------------------------------------------------- unit: firewall
await ok('firewall: whitelist blocks non-listed tools', () => {
  const p = parsePolicy('read_query,list_tables');
  assert.equal(isCallAllowed(p, 'read_query'), true);
  assert.equal(isCallAllowed(p, 'drop_table'), false);
});

await ok('firewall: explicit empty allowlist exposes no tools', () => {
  const p = parsePolicy('');
  assert.equal(isCallAllowed(p, 'read_query'), false);
  assert.deepEqual(filterToolList(p, [{ name: 'read_query' }]).kept, []);
});

await ok('firewall: blacklist wins over whitelist', () => {
  const p = parsePolicy('read_query,write_query', 'write_query');
  assert.equal(isCallAllowed(p, 'read_query'), true);
  assert.equal(isCallAllowed(p, 'write_query'), false);
});

await ok('firewall: null allow = everything except deny', () => {
  const p = parsePolicy(undefined, 'drop_table');
  assert.equal(isCallAllowed(p, 'exec_shell'), true);
  assert.equal(isCallAllowed(p, 'drop_table'), false);
});

await ok('firewall: tools/list keeps only allowed + counts blocked', () => {
  const p = parsePolicy('read_query,list_tables,describe_table');
  const { kept, blockedCount } = filterToolList(p, [
    { name: 'read_query' },
    { name: 'drop_table' },
    { name: 'list_tables' },
  ]);
  assert.deepEqual(kept.map((t) => t.name), ['read_query', 'list_tables']);
  assert.equal(blockedCount, 1);
});

// ------------------------------------------------------------- unit: duration
await ok('duration: parses 30m / 15s / 1h / bare seconds / rejects junk', () => {
  assert.equal(parseDuration('30m'), 1_800_000);
  assert.equal(parseDuration('15s'), 15_000);
  assert.equal(parseDuration('1h'), 3_600_000);
  assert.equal(parseDuration('90'), 90_000);
  assert.equal(parseDuration('1h30m'), 5_400_000);
  assert.equal(parseDuration('bananas'), null);
});

// -------------------------------------------------- offline e2e: proxy session
// Drives the REAL handlePeerConnection() (firewall + scrub + recorder) with a
// duplex pair and the fake MCP server, no network involved.
async function offlineE2e() {
  const wirelog = path.join(root, 'session-e2e.wirelog');
  const recorder = new Recorder(wirelog);
  recorder.meta({ name: 'test-session', ticket: 'wire://' + '0'.repeat(64), cmd: 'fake', policy: {}, redact: true });
  const stats = { startedAt: Date.now(), calls: 0, blocked: 0, redactions: 0, peers: 0 };
  const [peerSide, hostSide] = duplexPair();

  handlePeerConnection(hostSide, '#test...abc', {
    cmd: process.execPath,
    cmdArgs: [path.join(root, 'fake-server.mjs')],
    policy: parsePolicy('read_query,list_tables,describe_table'),
    redact: true,
    confirm: false,
    maxCalls: null,
    recorder,
    stats,
  });

  const responses = [];
  hostSide.on('data', () => {}); // keep flowing
  peerSide.on('data', (chunk) => {
    for (const line of chunk.toString().split('\n')) {
      if (line.trim()) {
        try {
          responses.push(JSON.parse(line));
        } catch {}
      }
    }
  });

  const send = (obj) => peerSide.write(JSON.stringify(obj) + '\n');
  const waitResponses = (n, timeoutMs = 10_000) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout waiting for ${n} responses (got ${responses.length})`)), timeoutMs);
      const check = () => {
        if (responses.length >= n) {
          clearTimeout(t);
          resolve();
        } else setTimeout(check, 50);
      };
      check();
    });

  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  await waitResponses(2);

  const toolsResp = responses.find((r) => r.id === 2);
  assert.deepEqual(
    toolsResp.result.tools.map((t) => t.name),
    ['list_tables', 'read_query', 'describe_table'],
    'tools/list must expose ONLY whitelisted tools',
  );

  send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'drop_table', arguments: { sql: 'DROP TABLE users' } } });
  send({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'read_query', arguments: { sql: 'SELECT * FROM users LIMIT 5' } } });
  await waitResponses(4);

  const blocked = responses.find((r) => r.id === 3);
  assert.equal(blocked.error.code, -32601, 'unauthorized call must be blocked with JSON-RPC error');
  assert(blocked.error.message.includes('MCPWire Firewall'));

  const allowed = responses.find((r) => r.id === 4);
  const text = allowed.result.content[0].text;
  assert(!text.includes('sk-proj-') && !text.includes('ghp_') && !text.includes('@corp.example.com'), 'secrets must be scrubbed');
  assert(!text.includes('4111 1111 1111 1111'), 'card must be scrubbed');
  assert(text.includes('[REDACTED_BY_MCPWIRE]'));
  assert(text.includes('row count: 42'), 'benign data must survive');

  assert.equal(stats.calls, 1);
  assert.equal(stats.blocked, 1);
  assert.ok(stats.redactions >= 4, `expected >=4 redactions, got ${stats.redactions}`);

  peerSide.destroy();
  hostSide.destroy();

  // wirelog audit trail
  await new Promise((r) => setTimeout(r, 150));
  const log = readFileSync(wirelog, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const kinds = new Set(log.map((e) => e.t));
  for (const k of ['meta', 'peer', 'req', 'res', 'blocked', 'redacted']) assert(kinds.has(k), `wirelog missing "${k}" event`);
  const blockedEvt = log.find((e) => e.t === 'blocked');
  assert.equal(blockedEvt.tool, 'drop_table');
}
await ok('offline e2e: firewall + DLP + wirelog over duplex pair', offlineE2e);

// --------------------------------------------------- real P2P e2e (hyperswarm)
// Boots a private local DHT bootstrap node (loopback UDP) so the full
// share -> DHT -> join -> Noise-encrypted tunnel path runs even offline.
await ok('P2P e2e: share -> join over hyperswarm DHT', async () => {
  const { default: DHT } = await import('hyperdht');
  const reservation = createSocket('udp4');
  reservation.bind(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const boot = DHT.bootstrapper(port, '127.0.0.1');
  await boot.ready();
  const bootAddr = boot.address();
  const env = { ...process.env, MCPWIRE_BOOTSTRAP: `127.0.0.1:${bootAddr.port}` };

  const record = path.join(root, 'session-p2p.wirelog');
  const host = spawn(process.execPath, [dist('index.js'), 'share',
    '--allow', 'read_query,list_tables',
    '--redact-secrets',
    '--record', record,
    '--ttl', '2m',
    '--', process.execPath, path.join(root, 'fake-server.mjs'),
  ], { stdio: ['ignore', 'pipe', 'pipe'], env });

  let ticket = '';
  const hostErr = [];
  host.stderr.on('data', (c) => {
    const s = c.toString();
    hostErr.push(s);
    const m = s.match(/wire:\/\/[0-9a-f]{64}/);
    if (m) ticket = m[0];
  });

  const deadline = Date.now() + 15_000;
  while (!ticket && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
  if (!ticket) {
    host.kill();
    console.log('     ⚠️ no ticket emitted (host stderr tail): ' + hostErr.slice(-3).join('').slice(-300));
    throw new Error('share never emitted a wire:// ticket');
  }

  const guest = spawn(process.execPath, [dist('index.js'), 'join', ticket], { stdio: ['pipe', 'pipe', 'pipe'], env });

  const out = [];
  guest.stdout.on('data', (c) => out.push(c.toString()));
  const guestErr = [];
  guest.stderr.on('data', (c) => guestErr.push(c.toString()));

  const send = (obj) => guest.stdin.write(JSON.stringify(obj) + '\n');
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'read_query', arguments: { sql: 'SELECT * FROM users' } } });
  send({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'drop_table', arguments: {} } });

  const joined = await new Promise((resolve) => {
    const responseDeadline = Date.now() + 20_000;
    const t = setTimeout(() => resolve(null), 20_000);
    const check = () => {
      const s = out.join('');
      if (s.includes('"id":3') && s.includes('"id":4')) {
        clearTimeout(t);
        resolve(s);
      } else if (Date.now() < responseDeadline) setTimeout(check, 150);
    };
    check();
  });

  host.kill('SIGINT');
  guest.kill('SIGINT');
  await boot.destroy().catch(() => {});

  if (joined === null) {
    console.log('     host stderr: ' + hostErr.join('').slice(-500).replace(/\n/g, ' | '));
    console.log('     guest stderr: ' + guestErr.join('').slice(-200).replace(/\n/g, ' | '));
    throw new Error('P2P share/join connection timed out');
  }

  const toolsLine = joined.split('\n').find((l) => l.includes('"id":2') || l.includes('"id": 2'));
  const tools = JSON.parse(toolsLine);
  assert.deepEqual(tools.result.tools.map((t) => t.name), ['list_tables', 'read_query'], 'P2P tools/list filtering');

  const replies = joined.trim().split('\n').map((line) => JSON.parse(line));
  const read = replies.find((reply) => reply.id === 3);
  assert(!read.error, 'P2P tool call must succeed');
  assert(read.result.content[0].text.includes('row count: 42'));
  assert(read.result.content[0].text.includes('[REDACTED_BY_MCPWIRE]'));
  assert(!read.result.content[0].text.includes('sk-proj-'));
  assert.equal(replies.find((reply) => reply.id === 4).error.code, -32601);

  const wirelogLines = readFileSync(record, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const kinds = new Set(wirelogLines.map((e) => e.t));
  for (const k of ['meta', 'peer', 'req']) assert(kinds.has(k), `P2P wirelog missing "${k}" event`);
});

console.log(`\n${process.exitCode ? '💥 FAILURES' : '🎉 all good'} — ${passed} tests passed\n`);
