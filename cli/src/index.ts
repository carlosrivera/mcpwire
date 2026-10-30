#!/usr/bin/env node
/**
 * mcpwire — P2P tool teleportation for AI agents.
 * Share the capability, never the credentials.
 */
import { createRequire } from 'node:module';
import { runShare, type ShareArgs } from './share.js';
import { runJoin } from './join.js';
import { parsePeerAddress, type PeerAddress } from './dht.js';

const pkg = createRequire(import.meta.url)('../package.json') as { version: string };
const VERSION = pkg.version;

const HELP = `
${'⚡'} @mcpwire/cli v${VERSION} — P2P Tool Teleportation for AI Agents
${'─'.repeat(62)}
Share a local MCP server with a remote peer over an E2EE
Noise-encrypted P2P tunnel. No cloud. No relay servers. $0 infra.

USAGE
  npx -y @mcpwire/cli share [flags] -- <command to run your MCP server>
  npx -y @mcpwire/cli join wire://<ticket> [--peer-address <IPv4:port>]

  (or if installed globally via 'npm i -g @mcpwire/cli': mcpwire share ...)

JOIN FLAGS
  --peer-address <IPv4:port>  Handshake route to a forwarded DHT socket (repeat up to 8)

SHARE FLAGS
  --port <n>          Bind the DHT UDP socket to this port; fail if unavailable
  --allow <list>      Comma-separated tool whitelist (peer can't even see others)
  --deny <list>       Comma-separated tool blacklist (wins over --allow)
  --redact-secrets    DLP: redact API keys / JWTs / emails / cards in responses
  --confirm           Human-in-the-Loop: approve each tools/call in your terminal
  --ttl <duration>    Tunnel self-destructs after e.g. 15m, 30s, 1h (default: none)
  --max-calls <n>     Tunnel self-destructs after n tool calls
  --record <file>     Write a .wirelog audit trail (replay it at mcpwire.co/replay)
  --name <name>       Name shown in the generated mcpServers config snippet

EXAMPLES
  # Run directly with npx to see help:
  npx -y @mcpwire/cli

  # Share SQLite read tools with secret scrubbing for 30 minutes (requires uvx):
  npx -y @mcpwire/cli share --allow "read_query,list_tables,describe_table" \\
    --redact-secrets --ttl 30m -- uvx --with 'mcp<2' mcp-server-sqlite --db-path \\
    ./app.db

  # Share GitHub MCP but never allow destructive tools, approve every call:
  npx -y @mcpwire/cli share --deny "push_files,fork_repository,create_repository" --confirm \\
    -- npx -y @modelcontextprotocol/server-github

  # Guest side (inside claude_desktop_config.json / .cursor/mcp.json):
  npx -y @mcpwire/cli join wire://7f9a2b8c4e1d0a...

Full docs & visual policy builder: https://mcpwire.co
`.trim();

function fail(msg: string): never {
  process.stderr.write(`mcpwire: ${msg}\n\n${HELP}\n`);
  process.exit(1);
}

function parseShareArgs(rest: string[]): ShareArgs {
  const valueFlags = new Set(['--allow', '--deny', '--ttl', '--max-calls', '--record', '--name', '--port']);
  const args: ShareArgs = {
    allow: undefined,
    deny: undefined,
    redact: false,
    confirm: false,
    ttl: null,
    maxCalls: null,
    record: undefined,
    name: undefined,
    cmd: '',
    cmdArgs: [],
  };
  const command: string[] = [];
  let inCommand = false;

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (inCommand || a === '--') {
      inCommand = true;
      command.push(a === '--' && command.length === 0 ? '' : a);
      if (a === '--') continue;
      continue;
    }
    if (a === '--redact-secrets' || a === '--redact') args.redact = true;
    else if (a === '--confirm') args.confirm = true;
    else if (valueFlags.has(a)) {
      const v = rest[++i];
      if (v === undefined) fail(`flag ${a} expects a value`);
      if (a === '--allow') args.allow = v;
      else if (a === '--deny') args.deny = v;
      else if (a === '--ttl') args.ttl = v;
      else if (a === '--record') args.record = v;
      else if (a === '--name') args.name = v;
      else if (a === '--port') {
        if (!/^[1-9][0-9]{0,4}$/.test(v) || Number(v) > 65535) fail('--port expects an integer from 1 to 65535');
        args.port = Number(v);
      }
      else if (a === '--max-calls') {
        const n = parseInt(v, 10);
        if (!Number.isFinite(n) || n <= 0) fail(`--max-calls expects a positive integer (got "${v}")`);
        args.maxCalls = n;
      }
    } else {
      fail(`unknown flag "${a}"`);
    }
  }
  const cmdParts = command.slice(1).filter((p, idx) => !(idx === 0 && p === ''));
  if (cmdParts.length === 0) fail('missing MCP server command after "--"');
  args.cmd = cmdParts[0];
  args.cmdArgs = cmdParts.slice(1);
  return args;
}

async function main(): Promise<void> {
  const [mode, ...rest] = process.argv.slice(2);

  if (mode === 'share') {
    await runShare(parseShareArgs(rest), VERSION);
  } else if (mode === 'join') {
    const ticket = rest[0];
    if (!ticket) fail('join requires a wire:// ticket, e.g. mcpwire join wire://7f9a2b8c…');
    const peerAddresses: PeerAddress[] = [];
    for (let i = 1; i < rest.length; i += 2) {
      if (rest[i] !== '--peer-address' || !rest[i + 1] || peerAddresses.length === 8) fail('join accepts up to 8 --peer-address values');
      peerAddresses.push(parsePeerAddress(rest[i + 1]));
    }
    await runJoin(ticket, peerAddresses);
  } else if (mode === '--version' || mode === '-v') {
    process.stdout.write(`mcpwire v${VERSION}\n`);
  } else {
    process.stdout.write(HELP + '\n');
  }
}

main().catch((err) => {
  process.stderr.write(`mcpwire: fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
