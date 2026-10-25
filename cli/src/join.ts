/**
 * GUEST side — `mcpwire join wire://<ticket>`.
 * Runs inside the peer's MCP client (Claude Desktop / Cursor). Speaks pure
 * stdio JSON-RPC on stdout and bridges every line through the Noise-encrypted
 * P2P socket back to the host. Zero cloud, zero relay servers of ours.
 */
import type { Duplex } from 'node:stream';
import { shortFingerprint } from './ui.js';
import { createSwarm } from './dht.js';

export async function runJoin(ticketArg: string): Promise<void> {
  const hex = ticketArg.replace(/^wire:\/\//i, '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    process.stderr.write(
      'mcpwire: invalid ticket. Expected wire://<64 hex chars> as printed by "mcpwire share" on the host.\n',
    );
    process.exit(1);
  }
  const topic = Buffer.from(hex, 'hex');

  const swarm = createSwarm();
  let bridged = false;
  let stopping = false;

  swarm.on('connection', (socket: Duplex & { remotePublicKey?: Buffer }) => {
    if (bridged) {
      socket.destroy(); // one host tunnel per join process
      return;
    }
    bridged = true;
    process.stderr.write(
      `mcpwire: 🤝 connected to host ${shortFingerprint(socket.remotePublicKey)} — bridging stdio <-> P2P tunnel\n`,
    );
    socket.once('data', () => clearTimeout(connectTimer));
    process.stdin.pipe(socket);
    // Noise sockets use streamx: its pipe() does not support Node's
    // { end: false } option. Bridge explicitly so stdout drains before exit.
    const resume = () => socket.resume();
    process.stdout.on('drain', resume);
    socket.on('data', (chunk: Buffer) => {
      if (!process.stdout.write(chunk)) socket.pause();
    });
    socket.on('end', () => socket.end());
    socket.on('close', () => {
      process.stderr.write('mcpwire: host tunnel closed. Exiting.\n');
      clearTimeout(connectTimer);
      process.stdout.off('drain', resume);
      process.stdout.write('', () => die(Number(process.exitCode) || 0));
    });
    socket.on('error', (error) => {
      process.stderr.write(`mcpwire: tunnel error: ${error.message}\n`);
      process.exitCode = 1;
      socket.destroy();
    });
    process.stdin.on('end', () => socket.end());
    process.stdin.on('close', () => socket.end());
  });

  swarm.on('error', (err: Error) => {
    process.stderr.write(`mcpwire: swarm error: ${err.message}\n`);
  });

  const die = (code = 0) => {
    if (stopping) return;
    stopping = true;
    clearTimeout(connectTimer);
    swarm
      .destroy()
      .catch(() => {})
      .finally(() => process.exit(code));
    setTimeout(() => process.exit(code), 1000).unref();
  };
  const connectTimer = setTimeout(() => {
    process.stderr.write('mcpwire: connection timed out before the host responded. Check that the host is running and the ticket is current.\n');
    die(1);
  }, 30_000);
  process.on('SIGINT', () => die());
  process.on('SIGTERM', () => die());

  // Cold DHT clients can race LAN discovery against NAT analysis, producing
  // a half-open socket (hyperdht#304). Finish bootstrap before the first dial.
  await swarm.dht.fullyBootstrapped();
  swarm.join(topic, { server: false, client: true });
}
