import { parseWirelog, summarizeSession } from './replay-model.mjs';
import { demoWirelog } from '../data/replay-demo';
const $ = (id:string) => document.getElementById(id)!;
const fileInput = $('file') as HTMLInputElement;
const esc = (value:unknown) => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
const duration = (ms:number) => ms < 1000 ? `${Math.round(ms)} ms` : ms < 60000 ? `${(ms/1000).toFixed(ms < 10000 ? 1 : 0)} s` : `${Math.floor(ms/60000)}m ${Math.floor(ms%60000/1000)}s`;
const reasons:Record<string,string> = {firewall:'Blocked by the tool access policy.',hitl:'Denied by the host during manual approval.','max-calls':'The session reached its call limit.'};
const endReasons:Record<string,string> = {ttl:'Time limit reached','max-calls':'Call limit reached',sigint:'Stopped by host',SIGINT:'Stopped by host'};
let session:ReturnType<typeof summarizeSession> | null = null;
let loadSequence = 0;
function error(message:string) { $('err').textContent = message; $('err').hidden = false; }
function renderRows() {
  if (!session) return;
  const query = ($('search') as HTMLInputElement).value.toLowerCase().trim();
  const filter = ($('filter') as HTMLSelectElement).value;
  const rows = session.rows.filter((row:any) => row.label.toLowerCase().includes(query) && (filter === 'all' || filter === 'tools' && row.tool || filter === 'redacted' && row.redacted > 0 || filter === row.status));
  $('row-count').textContent = `${rows.length} / ${session.rows.length}`;
  $('no-matches').hidden = rows.length > 0;
  const maxMs = session.rows.reduce((max:number,row:any) => Math.max(max,row.ms ?? 0),1);
  $('timeline').innerHTML = rows.map((row:any) => {
    const offset = Math.max(0,(row.ts-session!.meta.ts)/1000);
    const time = `${Math.floor(offset/60)}:${(offset%60).toFixed(1).padStart(4,'0')}`;
    const status = {ok:'Completed',error:'Error',blocked:'Blocked',pending:'No response',info:'Connection'}[row.status as string];
    let detail = row.status === 'blocked' ? (reasons[row.reason] ?? `Blocked: ${row.reason}`) : row.status === 'pending' ? 'No response was recorded for this request.' : row.status === 'info' ? 'Peer connection event recorded by the host.' : row.status === 'error' ? 'The server returned a JSON-RPC error. Response bodies are not stored in this recording.' : `Response received${row.ms === null ? '' : ` in ${row.ms} ms`}. Response bodies are not stored in this recording.`;
    if (row.redacted) detail += ` ${row.redacted} matches redacted: ${row.kinds.join(', ')}.`;
    return `<details class="event ${row.status}"><summary><span class="event-time">${time}</span><span class="event-name">${esc(row.label)}${row.redacted ? `<span class="redaction">${row.redacted} redacted</span>` : ''}</span><span class="event-status">${status}</span><span class="event-latency">${row.ms === null ? '—' : `<span class="latency-track"><i style="width:${Math.max(3,row.ms/maxMs*100)}%"></i></span>${row.ms} ms`}</span><svg class="event-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="event-detail"><p>${esc(detail)}</p>${row.args ? `<p>Arguments preview · up to 200 characters</p><pre>${esc(row.args)}</pre>` : ''}</div></details>`;
  }).join('');
}
function render(text:string, name:string, demo = false) {
  try {
    const next = summarizeSession(parseWirelog(text));
    session = next;
    const meta = next.meta;
    $('session-name').textContent = String(meta.name ?? 'Recorded session');
    $('source').textContent = demo ? 'Demo session · SQLite' : name;
    const end = next.end;
    $('session-time').textContent = `${new Date(meta.ts).toLocaleString()} · ${end ? (endReasons[String(end.reason)] ?? `Ended: ${String(end.reason ?? 'unknown')}`) : 'Partial recording · no session end recorded'}`;
    $('stats').innerHTML = [['Tool calls',next.calls,''],['Blocked',next.blocked,next.blocked ? 'attention' : ''],['Redactions',next.redactions,next.redactions ? 'attention' : ''],['Recorded duration',duration(next.duration),'']].map(([label,value,cls]) => `<div class="stat ${cls}"><strong>${value}</strong><span>${label}</span></div>`).join('');
    const policy = meta.policy && typeof meta.policy === 'object' ? meta.policy : {};
    const access = policy.allow === '' ? 'No tools allowed' : policy.allow == null ? 'All tools allowed unless denied' : `Allowed: ${String(policy.allow)}`;
    $('settings').innerHTML = [
      ['Server command',`<code>${esc(meta.cmd ?? 'Not recorded')}</code>`],
      ['Tool access',`${esc(access)}${policy.deny ? ` · Denied: ${esc(policy.deny)}` : ''}`],
      ['Approve calls',policy.confirm ? 'On' : 'Off'],
      ['Redact secrets',meta.redact ? 'On · recognized patterns only' : 'Off'],
      ['Session limits',`${meta.ttlMs == null ? 'No time limit' : esc(duration(Number(meta.ttlMs)))} · ${meta.maxCalls == null ? 'No call limit' : `${esc(meta.maxCalls)} calls`}`],
    ].map(([label,value]) => `<dt>${label}</dt><dd>${value}</dd>`).join('');
    ($('search') as HTMLInputElement).value = '';
    ($('filter') as HTMLSelectElement).value = 'all';
    $('err').hidden = true;
    $('empty').hidden = true;
    $('report').hidden = false;
    renderRows();
  } catch (err) { error(err instanceof Error ? err.message : 'This recording could not be opened.'); }
}
async function loadFile(file:File) {
  const sequence = ++loadSequence;
  if (file.size > 25 * 1024 * 1024) return error('This log is larger than 25 MB. Choose a smaller session recording.');
  try {
    const text = await file.text();
    if (sequence === loadSequence) render(text,file.name);
  } catch { if (sequence === loadSequence) error('The file could not be read. Try choosing it again.'); }
  finally { fileInput.value = ''; }
}
const drop = $('drop');
drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', event => { if (!drop.contains((event as DragEvent).relatedTarget as Node)) drop.classList.remove('over'); });
drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('over'); const file = event.dataTransfer?.files[0]; if (file) void loadFile(file); });
for (const id of ['pick','replace']) $(id).addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) void loadFile(file); });
$('demo').addEventListener('click', () => { loadSequence++; render(demoWirelog,'Demo',true); });
$('search').addEventListener('input',renderRows);
$('filter').addEventListener('change',renderRows);
