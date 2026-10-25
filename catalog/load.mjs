import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createCatalog } from './normalize.mjs';
const root = new URL('./', import.meta.url);
export const readJSON = url => JSON.parse(readFileSync(url, 'utf8'));
export function readEntries() {
  return readdirSync(root, {withFileTypes:true}).filter(item => item.isDirectory()).sort((a,b) => a.name.localeCompare(b.name)).map(item => ({
    folder:item.name,
    directory:fileURLToPath(new URL(`${item.name}/`, root)),
    server:readJSON(new URL(`${item.name}/server.json`, root)),
    policy:readJSON(new URL(`${item.name}/mcpwire.json`, root)),
  }));
}
export function loadCatalog() {
  return createCatalog(readEntries());
}
