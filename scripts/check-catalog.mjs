import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readEntries, readJSON } from '../catalog/load.mjs';
import { createCatalog, normalizeEntry } from '../catalog/normalize.mjs';
const root = new URL('../', import.meta.url);
const ajv = new Ajv({allErrors:true, strict:false});
addFormats(ajv);
const official = ajv.compile(readJSON(new URL('schemas/mcp-server-2025-12-11.schema.json', root)));
const policy = ajv.compile(readJSON(new URL('schemas/mcpwire.schema.json', root)));
export function validateEntry(entry) {
  const label = entry.folder ?? entry.policy?.slug ?? 'entry';
  for (const [name, validate, value] of [['server.json',official,entry.server],['mcpwire.json',policy,entry.policy]]) {
    if (!validate(value)) throw new Error(`${label}/${name}: ${ajv.errorsText(validate.errors, {separator:'; '})}`);
  }
  assert.equal(entry.policy.slug, label, `${label}: folder and slug must match`);
  assert(entry.server.title && entry.server.websiteUrl, `${label}: title and websiteUrl are required by MCPWire`);
  const pkg = entry.server.packages?.[0];
  assert(pkg && /^[A-Za-z0-9@/_.-]+$/.test(pkg.identifier) && !pkg.identifier.startsWith('-'), `${label}: invalid package identifier`);
  assert.equal(entry.server.$schema, 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json', `${label}: unsupported upstream schema`);
  const normalized = normalizeEntry(entry);
  if (entry.directory) {
    assert(readFileSync(path.join(entry.directory, 'guide.md'), 'utf8').trim(), `${label}: empty guide.md`);
    const icon = fileURLToPath(new URL(`web/public${entry.policy.icon}`, root));
    assert(existsSync(icon), `${label}: icon does not exist: ${entry.policy.icon}`);
    const svg = readFileSync(icon, 'utf8');
    assert(!/<script\b|<foreignObject\b|\son[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|data:|javascript:)/i.test(svg), `${label}: icon contains active or remote content`);
  }
  return normalized;
}
export function checkCatalog() {
  const entries = readEntries();
  for (const entry of entries) validateEntry(entry);
  const servers = createCatalog(entries);
  console.log(`PASS catalog: ${entries.length} schema-validated entries, ${servers.length} servers total; launch arguments, explicit defaults, guides, and icons checked.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) checkCatalog();
