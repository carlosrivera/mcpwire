/**
 * HOST side — `mcpwire share`.
 * Spawns the local MCP server as an isolated child process per peer and pipes
 * JSON-RPC through a Hyperswarm Noise-encrypted P2P socket, enforcing:
 *   - Tool whitelist/blacklist (L7 JSON-RPC firewall, incl. tools/list filtering)
 *   - Human-in-the-Loop confirmation (--confirm)
 *   - Ephemeral TTL + max-calls kill-switch
 *   - Secret scrubbing (DLP) on everything that leaves the machine
 *   - Optional .wirelog session recording
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import readline from 'node:readline';
import type { Duplex } from 'node:stream';
import {
  type Policy,
  parsePolicy,
  policySummary,
  isCallAllowed,
  filterToolList,
  deniedByHostError,
  deniedByHumanError,
} from './firewall.js';
import { scrubSecrets, scrubMessage } from './scrub.js';
import { Recorder } from './recorder.js';
import { createSwarm } from './dht.js';
import { ANSI, log, fmtMs, parseDuration, fmtCountdown, printBanner, shortFingerprint, type BannerOpts } from './ui.js';

export interface SessionStats {
  startedAt: number;
  calls: number;
  blocked: number;
  redactions: number;
  peers: number;
  inFlight?: number;
}

export interface ShareContext {
  cmd: string;
  cmdArgs: string[];
  policy: Policy;
  redact: boolean;
  confirm: boolean;
  maxCalls: number | null;
  recorder: Recorder;
  stats: SessionStats;
  console?: { log: (message: string) => void; confirm: (tool: string, args: unknown) => Promise<'allow' | 'deny' | 'always'> };
  onLimit?: (reason: 'max-calls') => void;
}

export interface ShareArgs {
  allow?: string;
  deny?: string;
  redact: boolean;
  confirm: boolean;
  ttl: string | null;
  maxCalls: number | null;
  record?: string;
  name?: string;
  cmd: string;
  cmdArgs: string[];
}

// ---------------------------------------------------------------------------
// Human-in-the-Loop terminal prompt
// ---------------------------------------------------------------------------

let hitlReader: readline.Interface | null = null;
let hitlResolve: ((answer: string) => void) | null = null;

function hitlLine(line: string): void {
  const cb = hitlResolve;
  hitlResolve = null;
  cb?.(line.trim().toLowerCase());
}

function askConfirm(tool: string, args: unknown): Promise<'allow' | 'deny' | 'always'> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      log(`${ANSI.yellow}⚠️  --confirm requires an interactive terminal; DENYING call to '${tool}' by default.${ANSI.reset}`);
      resolve('deny');
      return;
    }
    const preview = (JSON.stringify(args ?? {}) ?? '{}').slice(0, 200);
    process.stderr.write(
      `\n⚠️  ${ANSI.bold}[PEER CALL]${ANSI.reset} Agent wants to run: ` +
        `${ANSI.cyan}${tool}${ANSI.reset}${ANSI.dim}(${preview})${ANSI.reset}\n` +
        `   ${ANSI.bold}[Allow (y) / Deny (n) / Always Allow Tool (a)]${ANSI.reset} > `,
    );
    if (!hitlReader) {
      hitlReader = readline.createInterface({ input: process.stdin, terminal: false });
      hitlReader.on('line', hitlLine);
      hitlReader.on('close', () => hitlLine('n'));
    }
    hitlResolve = (answer) => {
      if (answer === 'y' || answer === 'allow') resolve('allow');
      else if (answer === 'a' || answer === 'always') resolve('always');
      else resolve('deny');
    };
  });
}

// ---------------------------------------------------------------------------
// One connected peer = one isolated MCP child process
// ---------------------------------------------------------------------------

export function handlePeerConnection(socket: Duplex, fingerprint: string, ctx: ShareContext): void {
  const { policy, recorder, stats } = ctx;

  log(`🤝 Peer connected ${ANSI.dim}(Noise fingerprint: ${fingerprint})${ANSI.reset} — launching isolated MCP child process`);
  recorder.peer('connected', { fingerprint });
  stats.peers++;

  const child = spawn(ctx.cmd, ctx.cmdArgs, { stdio: ['pipe', 'pipe', ctx.console ? 'pipe' : 'inherit'] });
  if (!child.stdin || !child.stdout) {
    log(`${ANSI.red}💀 Failed to open pipes to child process.${ANSI.reset}`);
    socket.destroy();
    return;
  }
  const childErrors = child.stderr ? readline.createInterface({ input: child.stderr }) : null;
  childErrors?.on('line', line => ctx.console?.log(`server: ${line}`));
  const pending = new Map<string, { tool?: string; start: number }>();

  child.on('error', (err) => {
    log(`${ANSI.red}💀 Child process error: ${err.message}${ANSI.reset}`);
    socket.destroy(err);
  });
  child.stdin.on('error', (err) => socket.destroy(err));
  child.on('exit', (code) => {
    if (code !== null && code !== 0) log(`${ANSI.yellow}🔌 MCP child exited with code ${code}${ANSI.reset}`);
    socket.end();
  });

  let cleanedUp = false;

  // HITL decisions are serialized so concurrent calls never interleave prompts.
  let confirmTail: Promise<void> = Promise.resolve();

  const forwardCall = (line: string, msg: any, tool: string) => {
    if (ctx.maxCalls !== null && stats.calls >= ctx.maxCalls) {
      stats.blocked++;
      recorder.blocked(tool, 'max-calls');
      socket.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: '[MCPWire] Session call budget exhausted.' } }) + '\n');
      return;
    }
    stats.calls++;
    if (msg.id !== undefined) {
      pending.set(JSON.stringify(msg.id), { tool, start: Date.now() });
      stats.inFlight = (stats.inFlight ?? 0) + 1;
    }
    recorder.request(msg.id, 'tools/call', {
      tool,
      argsPreview: (JSON.stringify(msg.params?.arguments ?? {}) ?? '{}').slice(0, 200),
    });
    const preview = (JSON.stringify(msg.params?.arguments ?? {}) ?? '{}').slice(0, 160);
    log(`⚡ CALL: ${ANSI.cyan}${tool}${ANSI.reset}${ANSI.dim}(${preview})${ANSI.reset}`);
    child.stdin!.write(line + '\n');
    if (ctx.maxCalls !== null && stats.calls >= ctx.maxCalls && msg.id === undefined) {
      ctx.onLimit?.('max-calls');
    }
  };

  const peerLines = readline.createInterface({ input: socket });
  peerLines.on('line', (line) => {
    if (cleanedUp || !line.trim()) return;
    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch {
      child.stdin!.write(line + '\n');
      return;
    }
    if (!msg || typeof msg !== 'object' || !msg.method) {
      child.stdin!.write(line + '\n'); // responses from peer (rare) — pass through
      return;
    }

    if (msg.method === 'tools/call') {
      const tool: string = msg.params?.name ?? '(unknown)';

      if (!isCallAllowed(policy, tool)) {
        stats.blocked++;
        log(`${ANSI.red}🛑 [BLOCKED] Peer tried to call unauthorized tool: ${tool}${ANSI.reset}`);
        recorder.blocked(tool, 'firewall');
        socket.write(JSON.stringify(deniedByHostError(msg.id, tool)) + '\n');
        return;
      }

      if (ctx.confirm && !policy.sessionAllowed.has(tool)) {
        if (!ctx.console) process.stderr.write('\x07'); // terminal beep
        confirmTail = confirmTail.then(async () => {
          if (socket.destroyed) return;
          const decision = await (ctx.console ? ctx.console.confirm(tool, msg.params?.arguments) : askConfirm(tool, msg.params?.arguments));
          if (socket.destroyed) return;
          if (decision === 'deny') {
            stats.blocked++;
            log(`${ANSI.red}🛑 [DENIED BY HOST] ${tool}${ANSI.reset}`);
            recorder.blocked(tool, 'hitl');
            socket.write(JSON.stringify(deniedByHumanError(msg.id, tool)) + '\n');
            return;
          }
          if (decision === 'always') {
            policy.sessionAllowed.add(tool);
            log(`${ANSI.green}✅ Always-allow granted for '${tool}' (this session only).${ANSI.reset}`);
          }
          forwardCall(line, msg, tool);
        });
        confirmTail.catch(() => {});
      } else {
        forwardCall(line, msg, tool);
      }
      return;
    }

    if (msg.method === 'tools/list') {
      log('🔍 Peer requested tools/list -> filtering schema before it leaves the machine…');
    }
    recorder.request(msg.id, msg.method);
    child.stdin!.write(line + '\n');
  });

  const childLines = readline.createInterface({ input: child.stdout });
  childLines.on('line', (line) => {
    if (cleanedUp || !line.trim()) return;
    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch {
      socket.write((ctx.redact ? scrubSecrets(line).text : line) + '\n');
      return;
    }

    if (msg?.result?.tools && Array.isArray(msg.result.tools)) {
      const originalCount = msg.result.tools.length;
      const { kept, blockedCount } = filterToolList(policy, msg.result.tools);
      msg.result.tools = kept;
      log(
        `🔍 tools/list -> ${ANSI.green}${kept.length} exposed${ANSI.reset}, ${ANSI.red}${blockedCount} blocked${ANSI.reset}` +
          ` (server advertises ${originalCount})`,
      );
    }

    let out: string;
    if (ctx.redact) {
      const r = scrubMessage(msg);
      if (r.count > 0) {
        stats.redactions += r.count;
        log(`🔒 DLP redacted ${ANSI.bold}${r.count}${ANSI.reset} secret${r.count > 1 ? 's' : ''} ${ANSI.dim}(${r.kinds.join(', ')})${ANSI.reset}`);
        recorder.write({ t: 'redacted', id: msg?.id, count: r.count, kinds: r.kinds });
      }
      out = r.text;
    } else {
      out = JSON.stringify(msg);
    }

    let completedTool = false;
    const idKey = msg?.id !== undefined ? JSON.stringify(msg.id) : null;
    if (idKey !== null) {
      const pend = pending.get(idKey);
      if (pend) {
        const ms = Date.now() - pend.start;
        pending.delete(idKey);
        completedTool = Boolean(pend.tool);
        stats.inFlight = Math.max(0, (stats.inFlight ?? 0) - 1);
        recorder.response(msg.id, { ok: !msg.error, ms, tool: pend.tool });
        if (pend.tool) {
          log(
            `   ↳ ${pend.tool} ${ANSI.dim}->${ANSI.reset} ${fmtMs(ms)} ` +
              (msg.error ? `${ANSI.red}[ERR]${ANSI.reset}` : `${ANSI.green}[OK]${ANSI.reset}`),
          );
        }
      }
    }
    socket.write(out + '\n');
    if (completedTool && ctx.maxCalls !== null && stats.calls >= ctx.maxCalls && (stats.inFlight ?? 0) === 0) {
      // Let the last response reach the client before shutting down the swarm.
      const force = setTimeout(() => ctx.onLimit?.('max-calls'), 1000);
      force.unref();
      socket.once('close', () => { clearTimeout(force); ctx.onLimit?.('max-calls'); });
      socket.end();
    }
  });

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    log(`🔌 Peer disconnected ${ANSI.dim}(${fingerprint})${ANSI.reset} — killing isolated child process.`);
    recorder.peer('disconnected', { fingerprint });
    stats.peers = Math.max(0, stats.peers - 1);
    stats.inFlight = Math.max(0, (stats.inFlight ?? 0) - pending.size);
    child.kill();
    peerLines.close();
    childLines.close();
    childErrors?.close();
  };
  const connectionError = (error: Error) => {
    if (!cleanedUp) log(`Peer ${fingerprint} connection closed: ${error.message}`);
    cleanup();
    socket.destroy();
  };
  // readline re-emits input stream errors on its own Interface. Handling the
  // socket alone leaves these errors unhandled and crashes the entire host.
  peerLines.on('error', connectionError);
  childLines.on('error', connectionError);
  childErrors?.on('error', connectionError);
  socket.on('close', cleanup);
  socket.on('error', connectionError);
}

// ---------------------------------------------------------------------------
// Host entrypoint
// ---------------------------------------------------------------------------

export function deriveServerName(args: ShareArgs): string {
  if (args.name) return args.name;
  const joined = [args.cmd, ...args.cmdArgs].join(' ');
  const m = joined.match(/(?:^|[\/\s@])(?:server-|mcp-server-)([a-zA-Z0-9_-]+)/);
  if (m) return `teleported-${m[1].replace(/-mcp$/, '')}`;
  const m2 = joined.match(/([a-zA-Z0-9_-]+)-mcp(?:[\/\s"']|$)/);
  if (m2) return `teleported-${m2[1]}`;
  return 'teleported-mcp';
}

export async function runShare(args: ShareArgs, version: string): Promise<void> {
  const topic = crypto.randomBytes(32); // 256-bit unique tunnel key
  const ticket = `wire://${topic.toString('hex')}`;

  const policy = parsePolicy(args.allow, args.deny);
  const recorder = new Recorder(args.record);
  const stats: SessionStats = { startedAt: Date.now(), calls: 0, blocked: 0, redactions: 0, peers: 0 };
  const ttlMs = args.ttl ? parseDuration(args.ttl) : null;
  if (args.ttl && ttlMs === null) {
    process.stderr.write(`mcpwire: invalid --ttl value "${args.ttl}" (use e.g. 30m, 90s, 1h)\n`);
    process.exit(1);
  }
  const serverName = deriveServerName(args);

  const swarm = createSwarm();
  let stopped = false;
  let terminal: ReturnType<typeof import('./tui.js')['startConsole']> | undefined;

  const shutdown = (reason: string) => {
    if (stopped) return;
    stopped = true;
    terminal?.stop();
    hitlReader?.close();
    recorder.end(reason, {
      durationMs: Date.now() - stats.startedAt,
      calls: stats.calls,
      blocked: stats.blocked,
      redactions: stats.redactions,
      peers: stats.peers,
    });
    const dur = fmtMs(Date.now() - stats.startedAt);
    process.stderr.write('\n');
    log(`${ANSI.bold}☠️  Tunnel closed${ANSI.reset} ${ANSI.dim}(reason: ${reason}, uptime: ${dur})${ANSI.reset}`);
    log(
      `📊 Session: ${ANSI.bold}${stats.calls}${ANSI.reset} calls · ${ANSI.red}${stats.blocked} blocked${ANSI.reset} · ` +
        `${ANSI.yellow}${stats.redactions} secrets redacted${ANSI.reset} · ${stats.peers} peer(s)`,
    );
    swarm
      .destroy()
      .catch(() => {})
      .finally(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };

  const ctx: ShareContext = {
    cmd: args.cmd,
    cmdArgs: args.cmdArgs,
    policy,
    redact: args.redact,
    confirm: args.confirm,
    maxCalls: args.maxCalls,
    recorder,
    stats,
    onLimit: (reason) => shutdown(reason),
  };

  const discovery = swarm.join(topic, { server: true, client: false });
  swarm.on('connection', (socket) => {
    handlePeerConnection(socket, shortFingerprint(socket.remotePublicKey), ctx);
  });
  swarm.on('error', (err: Error) => log(`${ANSI.red}🌩️  Swarm error: ${err.message}${ANSI.reset}`));

  const banner: BannerOpts = {
    version, ticket, policyLine: policySummary(policy), redact: args.redact,
    ttlMs, maxCalls: args.maxCalls, serverName,
    recordPath: args.record ?? null, confirm: args.confirm,
  };
  process.on('SIGINT', () => shutdown('sigint'));
  process.on('SIGTERM', () => shutdown('sigterm'));
  if (process.stdin.isTTY && process.stderr.isTTY && process.env.TERM !== 'dumb') {
    const { startConsole } = await import('./tui.js');
    if (stopped) return;
    terminal = startConsole(banner, stats, () => shutdown('user'));
    ctx.console = terminal.model;
  }
  try {
    await discovery.flushed();
  } catch (error) {
    terminal?.stop();
    await swarm.destroy();
    throw error;
  }
  if (stopped) return;
  if (terminal) { terminal.model.ready = true; terminal.model.update(); }
  else printBanner(banner);

  recorder.meta({
    name: serverName,
    ticket,
    cmd: [args.cmd, ...args.cmdArgs].join(' '),
    policy: { allow: args.allow ?? null, deny: args.deny ?? null, confirm: args.confirm },
    redact: args.redact,
    ttlMs,
    maxCalls: args.maxCalls,
    version,
  });

  if (ttlMs !== null) {
    const deadline = Date.now() + ttlMs;
    const ttlTimer = setTimeout(() => {
      log(`${ANSI.yellow}⏳ TTL expired — tunnel self-destructing.${ANSI.reset}`);
      shutdown('ttl');
    }, ttlMs);
    ttlTimer.unref?.();
    const tick = setInterval(() => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return;
      log(`${ANSI.dim}⏳ TTL: ${fmtCountdown(remaining)} remaining${ANSI.reset}`);
    }, 60_000);
    tick.unref?.();
  }

}
