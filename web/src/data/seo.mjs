export const SITE_URL = 'https://mcpwire.co';
export const SITE_NAME = 'MCPWire';
export const SITE_DESCRIPTION = 'Share local MCP server tools with a teammate’s AI agent. Choose tool access, redact recognized secrets, and set session limits.';
export function canonicalURL(pathname) {
  const path = new URL(pathname, SITE_URL).pathname.replace(/\/+$/, '') || '/';
  return new URL(path === '/' ? '/' : `${path}/`, SITE_URL).href;
}
export function serializeSchema(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
export function serverSEO(server) {
  const name = server.name.replace(/\s*\([^)]*\)/g, '');
  return {
    title:server.seo?.title ?? `${name} MCP server: setup & sharing`,
    description:server.seo?.description ?? `Set up ${name} with MCPWire. Run the MCP server locally, select tools to share, and connect a teammate’s agent with a private session ticket.`,
    image:`/social/${server.slug}.png`,
    imageAlt:`${name} MCP server setup and sharing guide — MCPWire`,
  };
}
