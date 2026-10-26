export function parseWirelog(text) {
  const events = [];
  for (const [index, line] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { throw new Error(`Line ${index + 1} isn’t valid JSON. Choose a .wirelog recording.`); }
    if (!event || typeof event !== 'object' || !Number.isFinite(event.ts) || typeof event.t !== 'string') {
      throw new Error(`Line ${index + 1} isn’t a valid recording event.`);
    }
    events.push(event);
  }
  const meta = events.find(event => event.t === 'meta');
  if (!meta) throw new Error('No session information found. Choose a .wirelog recorded with --record.');
  if (meta.v !== 1) throw new Error('This recording version isn’t supported yet. Open a version 1 .wirelog.');
  return events;
}

export function summarizeSession(events) {
  const meta = events.find(event => event.t === 'meta');
  const end = events.findLast(event => event.t === 'end');
  const rows = [];
  const pending = new Map();
  const key = id => JSON.stringify(id);
  const number = value => Number.isFinite(value) && value >= 0 ? value : 0;
  for (const event of events) {
    if (event.t === 'req') {
      const row = {ts:event.ts, label:String(event.tool ?? event.method ?? 'Request'), tool:Boolean(event.tool), status:'pending', ms:null, args:typeof event.argsPreview === 'string' ? event.argsPreview : '', redacted:0, kinds:[]};
      rows.push(row);
      if (event.id !== undefined) pending.set(key(event.id), row);
    } else if (event.t === 'res') {
      const row = pending.get(key(event.id));
      if (row) {
        row.status = event.ok === false ? 'error' : 'ok';
        row.ms = Number.isFinite(event.ms) && event.ms >= 0 ? event.ms : null;
        pending.delete(key(event.id));
      }
    } else if (event.t === 'redacted') {
      const row = pending.get(key(event.id));
      if (row) {
        row.redacted += number(event.count);
        row.kinds.push(...(Array.isArray(event.kinds) ? event.kinds.map(String) : []));
      }
    } else if (event.t === 'blocked') {
      rows.push({ts:event.ts,label:String(event.tool ?? 'Tool call'),tool:true,status:'blocked',ms:null,reason:String(event.reason ?? 'policy'),redacted:0,kinds:[]});
    } else if (event.t === 'peer') {
      rows.push({ts:event.ts,label:`Peer ${String(event.event ?? 'event')}`,tool:false,status:'info',ms:null,redacted:0,kinds:[]});
    }
  }
  return {
    meta, end, rows,
    duration:end && Number.isFinite(end.durationMs) ? number(end.durationMs) : events.reduce((max,event) => Math.max(max,event.ts - meta.ts),0),
    calls:rows.filter(row => row.tool).length,
    blocked:rows.filter(row => row.status === 'blocked').length,
    redactions:events.filter(event => event.t === 'redacted').reduce((sum,event) => sum + number(event.count),0),
  };
}
