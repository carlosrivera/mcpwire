import Hyperswarm from 'hyperswarm';
import DHT from 'hyperdht';

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

export function createSwarm(): Hyperswarm {
  return new Hyperswarm({ dht: new DHT(swarmOpts()) });
}
