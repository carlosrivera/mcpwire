#!/usr/bin/env node
// Minimal fake MCP server speaking JSON-RPC over stdio. Test fixture only.
const TOOLS = [
  { name: 'list_tables', description: 'List tables (safe)' },
  { name: 'read_query', description: 'Run a read-only query (safe)' },
  { name: 'describe_table', description: 'Describe a table (safe)' },
  { name: 'write_query', description: 'INSERT/UPDATE/DELETE (dangerous)' },
  { name: 'drop_table', description: 'DROP TABLE (destructive)' },
  { name: 'exec_shell', description: 'Run a shell command (destructive)' },
];

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, idx);
    buf = buf.slice(idx + 1);
    handleLine(line);
  }
});
process.stdin.on('end', () => process.exit(0));

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function handleLine(line) {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  if (msg.method === 'initialize') {
    send({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'fake-db', version: '0.0.1' } } });
  } else if (msg.method === 'tools/list') {
    send({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } });
  } else if (msg.method === 'tools/call') {
    const name = msg.params?.name ?? '';
    if (name === 'read_query') {
      // Response intentionally embeds secrets the DLP shield must catch.
      send({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          content: [
            {
              type: 'text',
              text: 'row count: 42\nadmin contact: root@corp.example.com\nkey: sk-proj-abcdefghijklmnopqrstuvwx\npat: ghp_' + 'a'.repeat(36) + '\ncard: 4111 1111 1111 1111',
            },
          ],
        },
      });
    } else if (name === 'drop_table' || name === 'write_query' || name === 'exec_shell') {
      send({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: `executed ${name}` }] } });
    } else {
      send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `unknown tool ${name}` } });
    }
  } else if (msg.id !== undefined) {
    send({ jsonrpc: '2.0', id: msg.id, result: {} });
  }
}
