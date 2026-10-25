import serversRaw, { entries } from '../data/servers';
import { resolveLaunch, shellQuote } from '../../../catalog/normalize.mjs';
import { buildShareCommand, parseTools, parseCallLimit } from './builder-model.mjs';
const syntax = import('./builder-highlight').catch(() => null);
function renderCode(element:HTMLElement, text:string, lang:'bash'|'json') {
  element.textContent = text;
  void syntax.then(module => { if (module && element.textContent === text) void module.renderCode(element,text,lang); });
}

type Tool = {name:string; risk:string; note:string};
type Preset = {slug:string;command:string;tools:Tool[];defaults:{allow:string[];redactSecrets:boolean;ttl:string}};
type Definition = {server:{packages:Array<{packageArguments?:Array<{variables?:Record<string,{description?:string}>}>;runtimeArguments?:Array<{variables?:Record<string,{description?:string}>}>}>};policy:{slug:string;inputs:Record<string,{example:string}>}};
const servers = serversRaw as Preset[];
const definitions = entries as Definition[];
function get<T extends HTMLElement>(id:string):T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing builder element: ${id}`);
  return element as T;
}
const el = {
  server:get<HTMLSelectElement>('b-server'), command:get<HTMLTextAreaElement>('b-cmd'), commandDetails:get<HTMLDetailsElement>('b-command-details'), reset:get<HTMLButtonElement>('b-reset-command'),
  guide:get<HTMLAnchorElement>('b-guide'), inputs:get('b-inputs'), tools:get('b-tools'), toolsWrap:get('b-tools-wrap'), toolActions:get('b-tool-actions'),
  customWrap:get('b-custom-tools-wrap'), customTools:get<HTMLTextAreaElement>('b-custom-tools'), count:get('b-tool-count'), accessNote:get('b-access-note'),
  defaults:get<HTMLButtonElement>('b-safe-only'), none:get<HTMLButtonElement>('b-none'), all:get<HTMLButtonElement>('b-all'),
  redact:get<HTMLInputElement>('b-redact'), confirm:get<HTMLInputElement>('b-confirm'), ttl:get<HTMLSelectElement>('b-ttl'), maxcalls:get<HTMLInputElement>('b-maxcalls'),
  host:get('b-out-cmd'), guest:get('b-out-json'), copyHost:get<HTMLButtonElement>('b-copy-cmd'), copyGuest:get<HTMLButtonElement>('b-copy-json'),
};
let preset:Preset | null = null;
let definition:Definition | undefined;
let values:Record<string,string> = {};
let manual = false;
let launchError = '';
function setError(input:HTMLElement, error:HTMLElement, message:string) {
  input.setAttribute('aria-invalid',String(Boolean(message))); error.textContent = message; error.hidden = !message;
}
function refreshCommand() {
  launchError = '';
  if (!manual && definition) {
    try {
      if (Object.values(values).some(value => !value.trim())) throw new Error('Missing setting');
      const launch = resolveLaunch(definition.server,definition.policy,values);
      el.command.value = [launch.command,...launch.args].map(shellQuote).join(' ');
    } catch { launchError = 'Complete the server settings.'; el.command.value = ''; }
  }
}
function renderInputs() {
  el.inputs.replaceChildren();
  if (!definition) return;
  const pkg = definition.server.packages[0];
  const variables = Object.assign({}, ...[...(pkg.runtimeArguments ?? []),...(pkg.packageArguments ?? [])].map(arg => arg.variables ?? {}));
  for (const [name,input] of Object.entries(definition.policy.inputs)) {
    const group = document.createElement('div');
    const label = document.createElement('label'); label.htmlFor = `b-input-${name}`; label.textContent = variables[name]?.description ?? name.replaceAll('_',' ');
    const field = document.createElement('input'); field.type = 'text'; field.id = label.htmlFor; field.value = input.example; field.spellcheck = false; field.autocomplete = 'off';
    const error = document.createElement('p'); error.className = 'field-error'; error.id = `${field.id}-error`; error.hidden = true;
    field.setAttribute('aria-describedby',error.id);
    field.addEventListener('input', () => {
      values[name] = field.value; setError(field,error,field.value.trim() ? '' : 'Enter a value.');
      manual = false; refreshCommand(); update();
    });
    group.append(label,field,error); el.inputs.append(group);
  }
}
function renderTools() {
  el.tools.replaceChildren();
  for (const tool of preset?.tools ?? []) {
    const row = document.createElement('label'); row.className = 'tool-row'; row.dataset.risk = tool.risk;
    row.title = `${tool.risk === 'high' ? 'High risk. ' : ''}${tool.note}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.name = tool.name;
    checkbox.checked = preset!.defaults.allow.includes(tool.name); checkbox.dataset.default = String(checkbox.checked);
    const name = document.createElement('span'); name.className = 'tool-name'; name.textContent = tool.name;
    row.append(checkbox,name);
    if (tool.risk === 'high') {
      const hint = document.createElement('span'); hint.className = 'tool-risk'; hint.setAttribute('aria-hidden','true');
      checkbox.setAttribute('aria-label',`${tool.name} (high risk)`); row.append(hint);
    }
    row.addEventListener('change',update); el.tools.append(row);
  }
}
function update() {
  let tools:string[] = [];
  let toolError = '';
  try { tools = preset ? [...el.tools.querySelectorAll<HTMLInputElement>('input:checked')].map(input => input.dataset.name!) : parseTools(el.customTools.value); }
  catch(error) { toolError = (error as Error).message; }
  setError(el.customTools,get('b-custom-tools-error'),toolError);
  let callError = '';
  try { parseCallLimit(el.maxcalls.value); } catch(error) { callError = (error as Error).message; }
  setError(el.maxcalls,get('b-maxcalls-error'),callError);
  const commandError = launchError || (!el.command.value.trim() ? 'Enter a server command.' : '');
  setError(el.command,get('b-cmd-error'),commandError);
  el.count.textContent = preset ? `${tools.length}/${preset.tools.length}` : String(tools.length);
  el.accessNote.hidden = tools.length > 0 || Boolean(toolError);
  el.accessNote.textContent = 'All tool calls blocked.';
  const invalid = Boolean(toolError || callError || commandError);
  const command = invalid ? 'Complete your settings to generate a command.' : buildShareCommand({command:el.command.value,tools,redact:el.redact.checked,confirm:el.confirm.checked,ttl:el.ttl.value,maxCalls:el.maxcalls.value});
  void renderCode(el.host,command,'bash');
  const guest = JSON.stringify({mcpServers:{[preset ? `teleported-${preset.slug}` : 'teleported-mcp']:{command:'npx',args:['-y','@mcpwire/cli','join','wire://<TICKET_FROM_HOST_BANNER>']}}},null,2);
  void renderCode(el.guest,guest,'json');
  for (const [button,text,label] of [[el.copyHost,invalid ? '' : command,'Copy generated host command'],[el.copyGuest,guest,'Copy generated config template']] as const) {
    if (button.dataset.copy !== text) {
      delete button.dataset.copyState; button.setAttribute('aria-label',label); button.title = label;
      const status = button.querySelector('.home-copy-status'); if (status) status.textContent = '';
    }
    button.dataset.copy = text;
  }
  el.copyHost.dataset.copyInvalid = String(invalid); el.copyHost.disabled = invalid;
}
function selectServer() {
  preset = servers.find(server => server.slug === el.server.value) ?? null;
  definition = definitions.find(entry => entry.policy.slug === preset?.slug);
  values = Object.fromEntries(Object.entries(definition?.policy.inputs ?? {}).map(([name,input]) => [name,input.example]));
  manual = false; launchError = '';
  el.toolsWrap.hidden = !preset; el.toolActions.hidden = !preset; el.customWrap.hidden = Boolean(preset);
  el.guide.hidden = !preset; el.reset.hidden = !preset; el.commandDetails.open = !preset;
  if (preset) {
    el.guide.href = `/teleport/${preset.slug}/`; el.redact.checked = preset.defaults.redactSecrets;
    if (![...el.ttl.options].some(option => option.value === preset!.defaults.ttl)) el.ttl.add(new Option(preset.defaults.ttl,preset.defaults.ttl));
    el.ttl.value = preset.defaults.ttl;
  } else { el.command.value = ''; el.customTools.value = ''; }
  renderInputs(); renderTools(); refreshCommand(); update();
}
el.server.addEventListener('change', () => {
  selectServer(); const url = new URL(location.href); url.searchParams.set('server',el.server.value); history.replaceState(null,'',url);
});
el.command.addEventListener('input', () => { manual = true; launchError = ''; update(); });
el.reset.addEventListener('click', () => { manual = false; refreshCommand(); update(); });
[el.customTools,el.redact,el.confirm,el.ttl,el.maxcalls].forEach(input => input.addEventListener('input',update));
for (const [button,mode] of [[el.defaults,'defaults'],[el.none,'none'],[el.all,'all']] as const) {
  button.addEventListener('click', () => {
    el.tools.querySelectorAll<HTMLInputElement>('input').forEach(input => { input.checked = mode === 'all' || (mode === 'defaults' && input.dataset.default === 'true'); }); update();
  });
}
const tabs = [get<HTMLButtonElement>('b-tab-host'),get<HTMLButtonElement>('b-tab-guest')];
function selectTab(index:number) {
  tabs.forEach((tab,i) => { tab.setAttribute('aria-selected',String(i === index)); tab.tabIndex = i === index ? 0 : -1; get(tab.getAttribute('aria-controls')!).hidden = i !== index; });
  get('b-host-copy').hidden = index !== 0; get('b-guest-copy').hidden = index !== 1; get('b-guest-note').hidden = index !== 1;
}
tabs.forEach((tab,index) => {
  tab.addEventListener('click', () => selectTab(index));
  tab.addEventListener('keydown',event => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
    selectTab(next); tabs[next].focus();
  });
});
const requested = new URL(location.href).searchParams.get('server');
el.server.value = requested === 'custom' || servers.some(server => server.slug === requested) ? requested! : 'filesystem';
selectServer();
