import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { loadCatalog } from '../catalog/load.mjs';
const directory = new URL('../web/public/social/',import.meta.url);
await mkdir(directory,{recursive:true});
const xml = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pages = [
  {slug:'mcpwire',label:'MCPWIRE',title:['Your server.','Their agent.'],subtitle:'Share local MCP tools with a teammate’s AI agent.'},
  {slug:'docs',label:'CLI DOCUMENTATION',title:['Start sharing','with npx.'],subtitle:'Setup, examples, and session controls.'},
  {slug:'builder',label:'COMMAND BUILDER',title:['Choose the tools.','Copy the command.'],subtitle:'Configure access to your local MCP server.'},
  {slug:'replay',label:'SESSION REPLAY',title:['See what','their agent did.'],subtitle:'Review tool calls, timing, and blocked requests.'},
  {slug:'teleport',label:'MCP SERVER GUIDES',title:['Your tools,','ready to share.'],subtitle:`Setup and sharing guides for ${loadCatalog().length} MCP servers.`},
  ...loadCatalog().map(server=>({slug:server.slug,label:`SERVER GUIDE / ${server.category.toUpperCase()}`,title:[server.name.replace(/\s*\([^)]*\)/g,''),'MCP server.'],subtitle:'Setup, tool access, and a connection to their agent.',icon:server.icon})),
];
for (const page of pages) {
  const icon = page.icon ? `<rect x="1000" y="64" width="128" height="128" rx="24" fill="#24272c"/><image x="1032" y="96" width="64" height="64" href="data:image/svg+xml;base64,${(await readFile(new URL(`../web/public${page.icon}`,import.meta.url))).toString('base64')}"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#1b1d20"/><g font-family="Arial, Helvetica, sans-serif"><text x="64" y="99" font-size="36" font-weight="700" fill="#eaedf0">mcpwire<tspan fill="#d4e66a">.</tspan></text>${icon}<text x="64" y="186" font-size="17" letter-spacing="2" fill="#d4e66a">${xml(page.label)}</text>${page.title.map((line,index)=>`<text x="60" y="${279+index*80}" font-size="${line.length>25 ? 54 : 68}" font-weight="600" letter-spacing="-2" fill="#eaedf0">${xml(line)}</text>`).join('')}<text x="64" y="424" font-size="25" fill="#adb3bc">${xml(page.subtitle)}</text><rect x="64" y="482" width="1072" height="84" rx="12" fill="#24272c"/><text xml:space="preserve" x="88" y="534" font-family="monospace" font-size="25" fill="#c1cbd7"><tspan fill="#d4e66a">$ </tspan>npx -y @mcpwire/cli share</text><text x="1136" y="604" text-anchor="end" font-size="16" fill="#8c939e">mcpwire.co</text></g></svg>`;
  const image = await sharp(Buffer.from(svg)).png({compressionLevel:9}).toBuffer();
  const destination = new URL(`${page.slug}.png`,directory);
  // Avoid rewriting identical files during local builds.
  const previous = await readFile(destination).catch(()=>null);
  if (!previous || !previous.equals(image)) await writeFile(destination,image);
}
await sharp(new URL('../web/public/favicon.svg',import.meta.url).pathname).resize(512,512).png().toFile(new URL('logo.png',directory).pathname);
console.log(`Generated ${pages.length} social cards and a 512px brand logo.`);
