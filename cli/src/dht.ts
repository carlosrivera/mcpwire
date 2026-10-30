import Hyperswarm from 'hyperswarm';
import DHT from 'hyperdht';
import { isIPv4 } from 'node:net';

export interface PeerAddress { host: string; port: number }
export function parsePeerAddress(value: string): PeerAddress {
  const match = /^(.*):([1-9][0-9]{0,4})$/.exec(value);
  if (!match || !isIPv4(match[1]) || Number(match[2]) > 65535) {
    throw new Error('Peer address must be an IPv4 address and port');
  }
  return { host: match[1], port: Number(match[2]) };
}

class AddressedDHT extends DHT {
  constructor(private readonly peerAddresses: PeerAddress[], port?: number) {
    super({ ...swarmOpts(), ...(port === undefined ? {} : { port }) });
  }
  override connect(key: Buffer, opts: Record<string, unknown> & { relayAddresses?: PeerAddress[] } = {}) {
    if (this.peerAddresses.length === 0) return super.connect(key, opts);
    // These are handshake routes to the peer's DHT socket, not plaintext relays.
    // HyperDHT still authenticates the Noise key discovered for the topic.
    return super.connect(key, { ...opts, relayAddresses: [...this.peerAddresses, ...(opts.relayAddresses ?? [])] });
  }
}

/**
 * DHT bootstrap configuration.
 *
 * MCPWire rides the public Hyperswarm DHT by default (zero servers of ours).
 * For air-gapped labs, CI, or corporate networks you can point both sides at
 * your own bootstrap nodes:
 *
 *   MCPWIRE_BOOTSTRAP=10.0.0.5:49737,10.0.0.6:49737 mcpwire share …
 */
export function swarmOpts(): { bootstrap?: Array<{ host: string; port: number }> } {
  const raw = process.env.MCPWIRE_BOOTSTRAP?.trim();
  if (!raw) return {};
  const bootstrap = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [host, port] = s.split(':');
      const p = parseInt(port, 10);
      if (!host || !Number.isFinite(p) || p <= 0 || p > 65535) {
        throw new Error(`invalid MCPWIRE_BOOTSTRAP entry "${s}" (expected host:port)`);
      }
      return { host, port: p };
    });
  if (bootstrap.length === 0) return {};
  return { bootstrap };
}

// Inject our pinned DHT rather than Hyperswarm's floating transitive version.
// HyperDHT 6.33–6.34 can create half-open LAN connections (upstream #304).

export function createSwarm(options: { peerAddresses?: PeerAddress[]; port?: number } = {}): Hyperswarm {
  return new Hyperswarm({ dht: new AddressedDHT(options.peerAddresses ?? [], options.port) });
}
