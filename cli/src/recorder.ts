/**
 * Session Flight Recorder — appends one JSON object per line (ndjson)
 * to a local .wirelog file. The file never leaves the host machine;
 * it can be dragged into mcpwire.co/replay for a DevTools-style audit.
 */
import { appendFileSync, writeFileSync } from 'node:fs';

export class Recorder {
  private path: string | null;
  private closed = false;
  redactions = 0;

  constructor(path?: string) {
    this.path = path ?? null;
    if (this.path) writeFileSync(this.path, ''); // truncate previous session
  }

  get active(): boolean {
    return this.path !== null;
  }

  write(event: Record<string, unknown>): void {
    if (!this.path || this.closed) return;
    try {
      appendFileSync(this.path, JSON.stringify({ ts: Date.now(), ...event }) + '\n');
    } catch {
      // Recording must never break the tunnel.
    }
  }

  meta(info: Record<string, unknown>): void {
    this.write({ t: 'meta', v: 1, ...info });
  }

  peer(event: 'connected' | 'disconnected', extra: Record<string, unknown> = {}): void {
    this.write({ t: 'peer', event, ...extra });
  }

  request(id: unknown, method: string, extra: Record<string, unknown> = {}): void {
    this.write({ t: 'req', id, method, ...extra });
  }

  response(id: unknown, extra: Record<string, unknown> = {}): void {
    this.write({ t: 'res', id, ...extra });
  }

  blocked(tool: string, reason: 'firewall' | 'hitl' | 'max-calls'): void {
    this.write({ t: 'blocked', tool, reason });
  }

  end(reason: string, stats: Record<string, unknown>): void {
    this.write({ t: 'end', reason, ...stats });
    this.closed = true;
  }
}
