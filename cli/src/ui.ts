/**
 * TUI helpers — cyberpunk-flavoured banner + timestamped stderr logging.
 * Everything goes to stderr: stdout stays reserved for MCP stdio transport.
 */

const isTTY = process.stderr.isTTY === true;

export const ANSI = {
  reset: isTTY ? '\x1b[0m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  dim: isTTY ? '\x1b[2m' : '',
  green: isTTY ? '\x1b[38;5;46m' : '',
  cyan: isTTY ? '\x1b[38;5;51m' : '',
  yellow: isTTY ? '\x1b[38;5;226m' : '',
  red: isTTY ? '\x1b[38;5;203m' : '',
  magenta: isTTY ? '\x1b[38;5;213m' : '',
  grey: isTTY ? '\x1b[38;5;245m' : '',
};

export function log(msg: string): void {
  const ts = new Date().toTimeString().slice(0, 8);
  process.stderr.write(`${ANSI.grey}[${ts}]${ANSI.reset} ${msg}\n`);
}

export function fmtMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10) * 1000; // bare number = seconds
  let ms: number | null = null;
  const segRe = /(\d+)(ms|s|m|h)/g;
  let m: RegExpExecArray | null;
  let rest = trimmed;
  while ((m = segRe.exec(trimmed)) !== null) {
    const val = parseInt(m[1], 10);
    ms = (ms ?? 0) + val * (m[2] === 'ms' ? 1 : m[2] === 's' ? 1000 : m[2] === 'm' ? 60_000 : 3_600_000);
    rest = rest.replace(m[0], '');
  }
  if (ms === null || rest.trim() !== '') return null;
  return ms;
}

export function fmtCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
    : `${m}m ${String(sec).padStart(2, '0')}s`;
}

export interface BannerOpts {
  version: string;
  ticket: string;
  policyLine: string;
  redact: boolean;
  ttlMs: number | null;
  maxCalls: number | null;
  serverName: string;
  recordPath: string | null;
  confirm: boolean;
}

export function printBanner(o: BannerOpts): void {
  const W = 76;
  const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

  const ttlLine = o.ttlMs !== null ? `${fmtCountdown(o.ttlMs)} remaining` : 'no limit';
  const shield = o.redact
    ? `${ANSI.green}🔒 Secret Scrubbing ON${ANSI.reset}`
    : `${ANSI.yellow}🔓 Secret Scrubbing OFF${ANSI.reset}`;

  const box: string[] = [];
  box.push(`┌${'─'.repeat(W)}┐`);
  const title = `⚡ MCPWIRE P2P TELEPORTER v${o.version} — E2EE NOISE TUNNEL READY`;
  box.push(`│${title}${' '.repeat(Math.max(0, W - strip(title).length))}│`);
  box.push(`├${'─'.repeat(W)}┤`);
  const rows: Array<[string, string]> = [
    ['Status', '🟢 Listening on Distributed Hash Table (Zero-Server P2P)'],
    ['Firewall', `🛡️  ${strip(o.policyLine)}`],
    ['DLP Shield', `${strip(shield)} | TTL: ${ttlLine}`],
  ];
  if (o.confirm) rows.push(['HITL', '⚠️  Human-in-the-Loop: every tools/call needs [y/n] in this terminal']);
  if (o.maxCalls !== null) rows.push(['Kill-Switch', `⚛️  Auto-destroy after ${o.maxCalls} tool calls`]);
  if (o.recordPath) rows.push(['Recorder', `🎥 ${o.recordPath}`]);
  for (const [label, value] of rows) {
    const content = `${label.padEnd(13)}${value}`;
    box.push(`│ ${content}${' '.repeat(Math.max(0, W - 1 - strip(content).length))}│`);
  }
  box.push(`├${'─'.repeat(W)}┤`);
  const head = '👉 SHARE THIS CONFIG WITH YOUR PEER (Cursor / Claude Desktop):';
  box.push(`│ ${head}${' '.repeat(Math.max(0, W - 1 - strip(head).length))}│`);
  box.push(`│${' '.repeat(W)}│`);
  const cfg = [
    `  "mcpServers": {`,
    `    "${o.serverName}": {`,
    `      "command": "npx",`,
    `      "args": ["-y", "@mcpwire/cli", "join", "${o.ticket}"]`,
    `    }`,
    `  }`,
  ];
  for (const c of cfg) box.push(`│${ANSI.cyan}${c}${' '.repeat(Math.max(0, W - strip(c).length))}${ANSI.reset}│`);
  box.push(`└${'─'.repeat(W)}┘`);
  process.stderr.write('\n' + box.join('\n') + '\n\n');
}

export function shortFingerprint(publicKey: Buffer | undefined): string {
  if (!publicKey) return '#unknown';
  const hex = publicKey.toString('hex');
  return `#${hex.slice(0, 4)}...${hex.slice(-3)}`;
}
