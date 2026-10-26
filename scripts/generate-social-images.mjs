import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { loadCatalog } from '../catalog/load.mjs';
const directory = new URL('../web/public/social/',import.meta.url);
await mkdir(directory,{recursive:true});
const xml = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const catalog = loadCatalog();
const pages = [
  {slug:'mcpwire',title:['Your server.','Their agent.'],description:['Share local MCP tools with','a teammate’s AI agent.']},
  {slug:'docs',title:['Start sharing','with npx.'],description:['CLI documentation, real examples,','and session controls.']},
  {slug:'builder',title:['Choose the tools.','Build the command.'],description:['Configure your server, tool access,','and session limits.']},
  {slug:'replay',title:['See what','their agent did.'],description:['Replay tool calls, timing,','and blocked requests.']},
  {slug:'teleport',title:['Your tools,','ready to share.'],description:[`Setup guides for ${catalog.length} MCP servers.`,'Find yours and get connected.']},
  ...catalog.map(server=>({slug:server.slug,title:[server.name.replace(/\s*\([^)]*\)/g,'')],description:['Run locally. Choose tool access.','Connect a teammate’s agent.'],icon:server.icon})),
];
const svgImage = async path => `data:image/svg+xml;base64,${(await readFile(new URL(`../web/public${path}`,import.meta.url))).toString('base64')}`;
const agentIcon = await svgImage('/icons/mcp.svg');
for (const page of pages) {
  const serverArt = page.icon
    ? `<image x="866" y="205" width="208" height="208" href="${await svgImage(page.icon)}"/>`
    : '<path d="m904 271 34 30-34 30m56 0h64" fill="none" stroke="#d4e66a" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>';
  const art = `<path d="M970 449v40q0 30 30 30h28" fill="none" stroke="#d4e66a" stroke-opacity=".7" stroke-width="3"/><g filter="url(#shadow)"><rect x="822" y="161" width="296" height="288" rx="40" fill="url(#surface)"/><rect x="1028" y="471" width="96" height="96" rx="24" fill="#292d32"/></g>${serverArt}<circle cx="970" cy="449" r="6" fill="#d4e66a"/><image x="1048" y="491" width="56" height="56" href="${agentIcon}"/>`;
  const titleSize = page.icon ? (page.title[0].length > 16 ? 62 : 76) : 74;
  const titleY = page.icon ? 324 : 278;
  const descriptionY = page.icon ? 418 : 448;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><radialGradient id="glow"><stop stop-color="#d4e66a" stop-opacity=".09"/><stop offset="1" stop-color="#1b1d20" stop-opacity="0"/></radialGradient><linearGradient id="surface" x2=".4" y2="1"><stop stop-color="#30353a"/><stop offset="1" stop-color="#25292e"/></linearGradient><filter id="shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dy="18" stdDeviation="22" flood-opacity=".26"/></filter><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1.2" fill="#adb3bc" fill-opacity=".13"/></pattern></defs><rect width="1200" height="630" fill="#1b1d20"/><ellipse cx="990" cy="300" rx="450" ry="390" fill="url(#glow)"/><rect x="784" y="90" width="416" height="540" fill="url(#dots)"/><g font-family="Arial, Helvetica, sans-serif"><text x="72" y="108" font-size="42" font-weight="700" fill="#eaedf0">mcpwire<tspan fill="#d4e66a">.</tspan></text>${art}${page.icon ? '<text x="72" y="230" font-size="32" fill="#d4e66a">MCP server guide</text>' : ''}${page.title.map((line,index)=>`<text x="68" y="${titleY+index*88}" font-size="${titleSize}" font-weight="600" letter-spacing="-2" fill="#eaedf0">${xml(line)}</text>`).join('')}${page.description.map((line,index)=>`<text x="72" y="${descriptionY+index*46}" font-size="32" fill="#adb3bc">${xml(line)}</text>`).join('')}</g></svg>`;
  const image = await sharp(Buffer.from(svg)).png({compressionLevel:9}).toBuffer();
  const destination = new URL(`${page.slug}.png`,directory);
  // Avoid rewriting identical files during local builds.
  const previous = await readFile(destination).catch(()=>null);
  if (!previous || !previous.equals(image)) await writeFile(destination,image);
}
await sharp(new URL('../web/public/favicon.svg',import.meta.url).pathname).resize(512,512).png().toFile(new URL('logo.png',directory).pathname);
console.log(`Generated ${pages.length} social cards and a 512px brand logo.`);
