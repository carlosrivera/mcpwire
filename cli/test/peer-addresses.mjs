import assert from 'node:assert/strict';
import { parsePeerAddress, createSwarm } from '../dist/dht.js';
assert.deepEqual(parsePeerAddress('192.168.1.20:49737'), { host: '192.168.1.20', port: 49737 });
for (const input of ['127.0.0.1:0', '127.0.0.1:65536', 'localhost:12', '--x', '1.2.3.4:12x', '::1:12']) assert.throws(() => parsePeerAddress(input));
// A routed join must retain the original peer key, key pair and discovered routes.
const swarm = createSwarm({ peerAddresses: [{ host: '127.0.0.1', port: 49999 }] });
const { default: DHT } = await import('hyperdht');
const original = DHT.prototype.connect;
const key = Buffer.alloc(32, 1), keyPair = DHT.keyPair();
try {
  let captured;
  DHT.prototype.connect = function (remote, opts) { captured = { remote, opts }; return {}; };
  swarm.dht.connect(key, { keyPair, relayAddresses: [{ host: '10.0.0.5', port: 40000 }] });
  assert.equal(captured.remote, key);
  assert.equal(captured.opts.keyPair, keyPair);
  assert.deepEqual(captured.opts.relayAddresses, [{ host: '127.0.0.1', port: 49999 }, { host: '10.0.0.5', port: 40000 }]);
} finally { DHT.prototype.connect = original; await swarm.destroy(); }
console.log('Peer address validation and Noise identity preservation passed.');
// A requested published port must not silently move when already in use.
const { createSocket } = await import('node:dgram');
const { once } = await import('node:events');
const { spawn } = await import('node:child_process');
const busy = createSocket('udp4'); busy.bind(0, '0.0.0.0'); await once(busy, 'listening');
try {
  const child = spawn(process.execPath, ['dist/index.js', 'share', '--port', String(busy.address().port), '--', 'node', 'test/fake-server.mjs'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = ''; child.stderr.on('data', c => stderr += c);
  const timer = setTimeout(() => child.kill('SIGKILL'), 10000);
  const [code] = await once(child, 'exit'); clearTimeout(timer);
  assert.notEqual(code, 0); assert.match(stderr, /Requested DHT port is unavailable|EADDRINUSE/);
} finally { busy.close(); }
console.log('Published port collision fails closed.');
// A free requested server socket must succeed even when the DHT's outbound
// socket is different (the normal firewalled/NAT configuration).
const free = createSocket('udp4'); free.bind(0, '0.0.0.0'); await once(free, 'listening');
const freePort = free.address().port; await new Promise(resolve => free.close(resolve));
const accepted = spawn(process.execPath, ['dist/index.js', 'share', '--port', String(freePort), '--ttl', '2s', '--', 'node', 'test/fake-server.mjs'], { stdio: ['ignore', 'ignore', 'pipe'] });
let acceptedLog = ''; accepted.stderr.on('data', c => acceptedLog += c);
const acceptedTimer = setTimeout(() => accepted.kill('SIGKILL'), 45000);
const [acceptedCode] = await once(accepted, 'exit'); clearTimeout(acceptedTimer);
assert.equal(acceptedCode, 0); assert.match(acceptedLog, /wire:\/\/[a-f0-9]{64}/);
console.log('Requested listening port succeeds with a distinct outbound socket.');
