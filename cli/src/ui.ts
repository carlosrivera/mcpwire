/**
 * Shared formatting and plain-text output for non-interactive sessions.
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

let logSink: ((message: string) => void) | null = null;
export function setLogSink(sink: typeof logSink): void { logSink = sink; }

export function log(msg: string): void {
  if (logSink) { logSink(msg); return; }
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

export function clientConfig(o: BannerOpts): string {
  const args = JSON.stringify(['-y', '@mcpwire/cli', 'join', o.ticket]);
  return [
    '{', '  "mcpServers": {', `    ${JSON.stringify(o.serverName)}: {`,
    '      "command": "npx",', `      "args": ${args}`,
    '    }', '  }', '}',
  ].join('\n');
}

export function printBanner(o: BannerOpts): void {
  process.stderr.write([
    `MCPWire v${o.version} · ${o.serverName} · Listening`,
    o.policyLine,
    `Secret scrubbing: ${o.redact ? 'on' : 'off'} · Approvals: ${o.confirm ? 'on' : 'off'}`,
    `TTL: ${o.ttlMs === null ? 'unlimited' : fmtCountdown(o.ttlMs)} · Call budget: ${o.maxCalls ?? 'unlimited'}`,
    ...(o.recordPath ? [`Recording: ${o.recordPath}`] : []),
    'Share this config with your peer:', clientConfig(o), '',
  ].join('\n') + '\n');
}

export function shortFingerprint(publicKey: Buffer | undefined): string {
  if (!publicKey) return '#unknown';
  const hex = publicKey.toString('hex');
  return `#${hex.slice(0, 4)}...${hex.slice(-3)}`;
}
