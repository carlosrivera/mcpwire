import assert from 'node:assert/strict';
import { parseWirelog, summarizeSession } from '../web/src/scripts/replay-model.mjs';
const log = events => events.map(event => JSON.stringify(event)).join('\n');
const meta = {t:'meta',ts:1000,v:1,name:'test',policy:{allow:''}};
const session = summarizeSession(parseWirelog(log([
  meta,
  {t:'req',ts:1100,id:1,method:'tools/call',tool:'read_file',argsPreview:'<script>alert(1)</script>'},
  {t:'redacted',ts:1110,id:1,count:2,kinds:['email']},
  {t:'res',ts:1120,id:1,ok:true,ms:20},
  {t:'blocked',ts:1200,tool:'write_file',reason:'firewall'},
  {t:'req',ts:1300,id:1,method:'tools/call',tool:'read_file'},
  {t:'res',ts:1330,id:1,ok:false,ms:30},
  {t:'req',ts:1400,id:'1',method:'tools/call',tool:'list_directory'},
  {t:'req',ts:1401,id:1,method:'tools/call',tool:'read_file'},
  {t:'res',ts:1410,id:'1',ok:true,ms:10},
  {t:'res',ts:1411,id:1,ok:true,ms:10},
  {t:'req',ts:1500,id:9,method:'tools/call',tool:'unfinished'},
  {t:'end',ts:2000,durationMs:1000,reason:'sigint'},
])));
assert.equal(session.calls,6);
assert.equal(session.blocked,1);
assert.equal(session.redactions,2);
assert.equal(session.duration,1000);
assert.equal(session.rows[0].status,'ok');
assert.equal(session.rows[0].redacted,2);
assert.equal(session.rows[0].args,'<script>alert(1)</script>');
assert.equal(session.rows[1].status,'blocked');
assert.equal(session.rows[2].status,'error');
assert.equal(session.rows[3].status,'ok');
assert.equal(session.rows[4].status,'ok');
assert.equal(session.rows.at(-1).status,'pending');
assert.equal(summarizeSession(parseWirelog(log([meta,{t:'peer',ts:3000,event:'connected'}]))).duration,2000);
assert.throws(() => parseWirelog(log([meta])+'\nnot json'),/Line 2/);
assert.throws(() => parseWirelog('null'),/valid recording event/);
assert.throws(() => parseWirelog('{}'),/valid recording event/);
assert.throws(() => parseWirelog(''),/No session information/);
assert.throws(() => parseWirelog(log([{...meta,v:2}])),/version/);
assert.equal(parseWirelog('\uFEFF'+log([meta])+'\r\n').length,1);
console.log('PASS replay: recorder-format blocks, request pairing, reused and typed IDs, redactions, incomplete logs, and malformed input.');
