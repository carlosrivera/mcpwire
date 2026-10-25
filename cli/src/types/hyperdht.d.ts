declare module 'hyperdht' {
  export default class DHT {
    constructor(opts?: { bootstrap?: Array<{ host: string; port: number }> });
    fullyBootstrapped(): Promise<void>;
  }
}
