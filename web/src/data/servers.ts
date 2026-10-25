import legacy from './servers.json';
import { mergeCatalog } from '../../../catalog/normalize.mjs';
// A new catalog folder is discovered by both Vite and the Node validation tools.
const definitions = import.meta.glob('../../../catalog/*/server.json', {eager:true, import:'default'});
const policies = import.meta.glob('../../../catalog/*/mcpwire.json', {eager:true, import:'default'});
const entries = Object.entries(definitions).map(([path, server]) => {
  const policy = policies[path.replace('/server.json', '/mcpwire.json')];
  if (!policy) throw new Error(`Missing MCPWire policy: ${path}`);
  return {server, policy};
});
for (const path of Object.keys(policies)) {
  if (!definitions[path.replace('/mcpwire.json','/server.json')]) throw new Error(`Missing server definition: ${path}`);
}
export default mergeCatalog(legacy, entries);
