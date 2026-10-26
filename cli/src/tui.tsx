/** Interactive host console. Ink owns rendering and keyboard input on stderr. */
import React, { useEffect, useState } from 'react';
import { Box, Text, render, useInput } from 'ink';
import { spawn } from 'node:child_process';
import { stripVTControlCharacters } from 'node:util';
import { EventEmitter } from 'node:events';
import { fmtCountdown, type BannerOpts, setLogSink, clientConfig } from './ui.js';
import type { SessionStats } from './share.js';

// Explicit colors keep the console legible across terminal ANSI palettes.
const palette = {
  lemon: '#EAF36B', text: '#E7EBE5', muted: '#AEB7AD', border: '#66725B',
  ink: '#24291E', success: '#B9D995', warning: '#E9C879', error: '#F29B8F',
};
const breath = ['#8D9653', '#A8B15B', '#C5CE63', '#EAF36B', '#F5FAA7', '#EAF36B', '#C5CE63', '#A8B15B'];

function LiveIndicator({ ready }: { ready: boolean }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (process.env.NO_COLOR !== undefined) return;
    const timer = setInterval(() => setFrame(n => (n + 1) % breath.length), 240);
    return () => clearInterval(timer);
  }, []);
  return <Text color={palette.muted}><Text color={breath[frame]}>{ready ? '●' : '◌'}</Text> {ready ? 'Listening' : 'Connecting'}</Text>;
}

function ActivityLine({ line }: { line: string }) {
  const timestamp = line.match(/^\d{2}:\d{2}:\d{2}  /)?.[0] ?? '';
  const message = line.slice(timestamp.length);
  const color = /\[ERR\]|error:|failed/i.test(message) ? palette.error
    : /BLOCKED|DENIED|redacted/i.test(message) ? palette.warning
    : /\[OK\]|Peer connected/.test(message) ? palette.success
    : /CALL:/.test(message) ? palette.lemon : palette.text;
  return <Text color={color}><Text color={palette.muted}>{timestamp}</Text>{message || ' '}</Text>;
}

export type Decision = 'allow' | 'deny' | 'always';
interface Approval { tool: string; args: unknown; resolve: (answer: Decision) => void }

// Child output and peer-supplied strings must never become terminal commands.
export const terminalText = (value: string): string => stripVTControlCharacters(value).replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');

export class ConsoleModel extends EventEmitter {
  events: string[] = [];
  approvals: Approval[] = [];
  ready = false;
  closed = false;
  constructor(public options: BannerOpts, public stats: SessionStats) { super(); }
  update = () => { this.emit('change'); };
  log = (message: string) => {
    const time = new Date().toTimeString().slice(0, 8);
    // Emoji widths vary between terminal fonts; keep log prefixes text-only.
    for (const line of terminalText(message).split('\n')) {
      const text = line.replace(/^[\p{Extended_Pictographic}\uFE0F]+\s*/u, '');
      this.events.push(`${time}  ${text}`);
    }
    this.events = this.events.slice(-200);
    this.update();
  };
  confirm = (tool: string, args: unknown): Promise<Decision> => {
    if (this.closed) return Promise.resolve('deny');
    return new Promise(resolve => { this.approvals.push({ tool, args, resolve }); this.update(); });
  };
  decide(answer: Decision) { this.approvals.shift()?.resolve(answer); this.update(); }
  close() {
    this.closed = true;
    for (const approval of this.approvals.splice(0)) approval.resolve('deny');
    this.update();
  }
}

async function copy(text: string): Promise<void> {
  const [command, args] = process.platform === 'darwin' ? ['pbcopy', []] as const
    : process.platform === 'win32' ? ['clip.exe', []] as const
    : process.env.WAYLAND_DISPLAY ? ['wl-copy', []] as const : ['xclip', ['-selection', 'clipboard']] as const;
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [...args], { stdio: ['pipe', 'ignore', 'ignore'] });
    child.on('error', reject);
    child.stdin.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error('clipboard unavailable')));
    child.stdin.end(text);
  });
}

export function ShareConsole({ model, onQuit, output = process.stderr }: {
  model: ConsoleModel; onQuit: () => void; output?: NodeJS.WriteStream;
}) {
  const [, refresh] = useState(0);
  const [tab, setTab] = useState<'config' | 'activity'>('config');
  const [offset, setOffset] = useState(0);
  const [notice, setNotice] = useState('');
  const [approvalOffset, setApprovalOffset] = useState(0);
  const [size, setSize] = useState({ columns: output.columns || 80, rows: output.rows || 24 });
  useEffect(() => {
    const update = () => refresh(n => n + 1);
    const resize = () => setSize({ columns: output.columns || 80, rows: output.rows || 24 });
    model.on('change', update);
    output.on('resize', resize);
    const tick = setInterval(update, 1000);
    return () => { model.off('change', update); output.off('resize', resize); clearInterval(tick); };
  }, [model, output]);
  const approval = model.approvals[0];
  useEffect(() => setApprovalOffset(0), [approval]);
  const { options: o, stats } = model;
  const bodyHeight = Math.max(1, size.rows - 14);
  useInput((input, key) => {
    if ((key.ctrl && input === 'c') || input === 'q') { onQuit(); return; }
    if (approval) {
      if (key.upArrow) setApprovalOffset(n => Math.max(0, n - 1));
      if (key.downArrow) setApprovalOffset(n => n + 1);
      if (input === 'y') model.decide('allow');
      if (input === 'n' || key.escape) model.decide('deny');
      if (input === 'a') model.decide('always');
      return;
    }
    if (input === '1') { setTab('config'); setOffset(0); }
    if (input === '2') { setTab('activity'); setOffset(0); }
    if (key.tab || key.leftArrow || key.rightArrow) { setTab(t => t === 'config' ? 'activity' : 'config'); setOffset(0); }
    if (key.upArrow) setOffset(n => tab === 'activity' ? n + 1 : Math.max(0, n - 1));
    if (key.downArrow) setOffset(n => tab === 'activity' ? Math.max(0, n - 1) : n + 1);
    if (input === 'c' || input === 't') {
      void copy(input === 'c' ? clientConfig(o) : o.ticket)
        .then(() => setNotice(input === 'c' ? 'Config copied' : 'Ticket copied'))
        .catch(() => setNotice('Clipboard unavailable. Select the config text to copy.'));
    }
  });
  const elapsed = Date.now() - stats.startedAt;
  const config = clientConfig(o).split('\n');
  // Config wraps inside the viewport; the full value is always copied intact.
  const width = Math.max(1, size.columns - 6);
  const lines = (tab === 'config' ? config : model.events.length ? model.events : ['Waiting for a peer to connect.']).flatMap(line => {
    const chars = Array.from(terminalText(line));
    return Array.from({ length: Math.max(1, Math.ceil(chars.length / width)) }, (_, i) => chars.slice(i * width, (i + 1) * width).join(''));
  });
  const argumentChars = Array.from(terminalText(JSON.stringify(approval?.args ?? {})));
  const argumentLines = Array.from({ length: Math.max(1, Math.ceil(argumentChars.length / width)) }, (_, i) => argumentChars.slice(i * width, (i + 1) * width).join(''));
  const argumentHeight = Math.max(1, bodyHeight - 2);
  const argumentStart = Math.min(approvalOffset, Math.max(0, argumentLines.length - argumentHeight));
  const maxOffset = Math.max(0, lines.length - bodyHeight);
  const scroll = Math.min(offset, maxOffset);
  const start = tab === 'activity' ? Math.max(0, lines.length - bodyHeight - scroll) : scroll;
  if (size.rows < 15 || size.columns < 32) return <Box flexDirection="column" width={size.columns}>
    <Text color={palette.lemon}>MCPWire · <LiveIndicator ready={model.ready} /></Text>
    <Text wrap="truncate">{approval ? `Approve ${terminalText(approval.tool)}? y / n / a` : 'Enlarge terminal · c copy config · q quit'}</Text>
  </Box>;
  return <Box flexDirection="column" width={size.columns} height={size.rows - 1} paddingX={1}>
    <Box justifyContent="space-between"><Text bold color={palette.lemon}>MCPWire <Text color={palette.muted}>v{o.version}</Text></Text><LiveIndicator ready={model.ready} /></Box>
    <Text bold color={palette.text} wrap="truncate">{terminalText(o.serverName)} <Text color={palette.muted}> / encrypted P2P session</Text></Text>
    <Text color={palette.muted} wrap="truncate">{terminalText(o.policyLine)}</Text>
    <Text color={palette.muted} wrap="truncate">Scrubbing <Text color={o.redact ? palette.success : palette.text}>{o.redact ? 'on' : 'off'}</Text> · Approvals <Text color={o.confirm ? palette.lemon : palette.text}>{o.confirm ? 'on' : 'off'}</Text> · TTL <Text color={palette.text}>{o.ttlMs === null ? 'unlimited' : fmtCountdown(o.ttlMs - elapsed)}</Text></Text>
    <Text color={palette.muted} wrap="truncate"><Text bold color={palette.lemon}>{stats.peers}</Text> connected · <Text bold color={palette.lemon}>{stats.calls}{o.maxCalls === null ? '' : `/${o.maxCalls}`}</Text> calls · <Text color={stats.blocked ? palette.warning : palette.text}>{stats.blocked}</Text> blocked · <Text color={stats.redactions ? palette.warning : palette.text}>{stats.redactions}</Text> redacted</Text>
    <Text color={palette.muted} wrap="truncate">Uptime {fmtCountdown(elapsed)}{o.recordPath ? ` · Recording ${terminalText(o.recordPath)}` : ''}</Text>
    <Box marginTop={1} gap={3}><Text bold backgroundColor={tab === 'config' ? palette.lemon : undefined} color={tab === 'config' ? palette.ink : palette.muted}> 1 Config </Text><Text bold backgroundColor={tab === 'activity' ? palette.lemon : undefined} color={tab === 'activity' ? palette.ink : palette.muted}> 2 Activity </Text><Text color={palette.muted}>{lines.length > bodyHeight ? '↑/↓ scroll' : ''}</Text></Box>
    <Box flexDirection="column" borderStyle="single" borderLeft={false} borderRight={false} borderColor={approval ? palette.lemon : palette.border} flexGrow={1} overflow="hidden" paddingX={1}>
      {approval ? <>
        <Text bold color={palette.lemon}>Approval required · {terminalText(approval.tool)}</Text>
        {argumentLines.slice(argumentStart, argumentStart + argumentHeight).map((line, i) => <Text key={i}>{line}</Text>)}
        <Text bold wrap="truncate">y allow · n deny · a always · ↑/↓ inspect</Text>
      </> : lines.slice(start, start + bodyHeight).map((line, i) => tab === 'config' ? <Text key={i} color={palette.text}>{line || ' '}</Text> : <ActivityLine key={i} line={line} />)}
    </Box>
    <Text color={palette.muted} wrap="truncate">{notice || (tab === 'config' ? 'Add this config to your peer’s MCP client.' : 'Live activity · newest events at the bottom.')}</Text>
    <Text color={palette.muted} wrap="truncate"><Text bold color={palette.lemon}>tab</Text> switch · <Text bold color={palette.lemon}>c</Text> copy config · <Text bold color={palette.lemon}>t</Text> copy ticket · <Text bold color={palette.lemon}>q</Text> stop</Text>
  </Box>;
}

export function startConsole(options: BannerOpts, stats: SessionStats, onQuit: () => void) {
  const model = new ConsoleModel(options, stats);
  process.stderr.write('\x1b[?1049h');
  const app = render(<ShareConsole model={model} onQuit={onQuit} />, {
    stdout: process.stderr, stderr: process.stderr, stdin: process.stdin,
    exitOnCtrlC: false, patchConsole: false,
  });
  setLogSink(model.log);
  let closed = false;
  const stop = () => {
    if (closed) return;
    closed = true;
    model.close();
    setLogSink(null);
    app.unmount();
    process.stderr.write('\x1b[?1049l');
    process.off('exit', stop);
  };
  process.once('exit', stop);
  return { model, stop };
}
