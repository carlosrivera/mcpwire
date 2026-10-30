declare module 'hyperdht' {
  export default class DHT {
    constructor(opts?: { bootstrap?: Array<{ host: string; port: number }>; port?: number });
    connect(key: Buffer, opts?: Record<string, unknown>): import('node:stream').Duplex;
    ready(): Promise<void>;
    localAddress(): { host: string; port: number } | null;
    fullyBootstrapped(): Promise<void>;
  }
}
