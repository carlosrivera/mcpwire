// Minimal ambient types for hyperswarm@4 (the package ships no .d.ts).
declare module 'hyperswarm' {
  import { Duplex } from 'node:stream';

  interface NoiseSocket extends Duplex {
    remotePublicKey?: Buffer;
    publicKey?: Buffer;
  }

  interface HyperswarmOptions {
    dht?: { fullyBootstrapped(): Promise<void> };
    keyPair?: { publicKey: Buffer; secretKey: Buffer };
    seed?: Buffer;
    maxConnections?: number;
    maxPeers?: number;
    firewall?: (remotePublicKey: Buffer) => boolean;
    bootstrap?: Array<{ host: string; port: number }>;
    stats?: unknown;
  }

  class Hyperswarm extends (require('node:events').EventEmitter as new () => void) {
    constructor(opts?: HyperswarmOptions);

    join(topic: Buffer | string, opts?: { server?: boolean; client?: boolean; ontopic?: unknown }): {
      flushed(): Promise<void>;
    };
    joinPeer(publicKey: Buffer): void;
    leave(topic: Buffer | string): void;
    leavePeer(publicKey: Buffer): void;
    destroy(opts?: { force?: boolean }): Promise<void>;
    flush(): Promise<void>;
    listen(): Promise<void>;
    readonly dht: { fullyBootstrapped(): Promise<void>; ready(): Promise<void>; address(): { host: string; port: number } };
    readonly connections: Set<NoiseSocket>;
    readonly peers: Map<string, unknown>;
    readonly keyPair: { publicKey: Buffer; secretKey: Buffer };
    on(event: 'connection', listener: (socket: NoiseSocket, info: unknown) => void): this;
    on(event: 'self' | 'init' | 'error' | 'close' | 'peer-add' | 'peer-remove', listener: (...args: any[]) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export = Hyperswarm;
}
