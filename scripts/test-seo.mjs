import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import sharp from 'sharp';
import { loadCatalog } from '../catalog/load.mjs';
import { SITE_URL, canonicalURL, serializeSchema } from '../web/src/data/seo.mjs';
const root = fileURLToPath(new URL('../web/dist/',import.meta.url));
function walk(folder) { return readdirSync(folder,{withFileTypes:true}).flatMap(item=>item.isDirectory() ? walk(path.join(folder,item.name)) : [path.join(folder,item.name)]); }
function nodes(node) { return [node,...(node.childNodes ?? []).flatMap(nodes)]; }
const attributes = node => Object.fromEntries((node.attrs ?? []).map(attr=>[attr.name,attr.value]));
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const titles = new Set(), descriptions = new Set(), indexed = new Set(), guideNames = new Set(loadCatalog().map(server=>server.slug));
const pages = walk(root).filter(file=>file.endsWith('.html'));
assert.equal(canonicalURL('/builder/?server=sqlite#host'),`${SITE_URL}/builder/`);
assert(!serializeSchema({description:'</script><script>bad</script>'}).includes('<'));
assert.equal(JSON.parse(serializeSchema({name:'<test>'})).name,'<test>');
for (const file of pages) {
  const relative = path.relative(root,file).replaceAll(path.sep,'/');
  const pathname = relative === 'index.html' ? '/' : relative === '404.html' ? '/404' : `/${relative.replace(/\/index\.html$/,'')}`;
  const canonical = canonicalURL(pathname);
  const tree = nodes(parse(readFileSync(file,'utf8')));
  const elements = tag => tree.filter(node=>node.tagName===tag);
  function oneMeta(name) {
    const matches = elements('meta').filter(node=>{const a=attributes(node);return a.name===name||a.property===name});
    assert.equal(matches.length,1,`${pathname}: missing or duplicate ${name}`); return attributes(matches[0]).content;
  }
  assert.equal(elements('title').length,1,`${pathname}: duplicate title`);
  const title = text(elements('title')[0]);
  assert(title.length>=15 && title.length<=85,`${pathname}: invalid title length`);
  assert(!titles.has(title),`${pathname}: duplicate title`); titles.add(title);
  const description = oneMeta('description');
  assert(description.length>=70 && description.length<=200,`${pathname}: invalid description length ${description.length}`);
  assert(!descriptions.has(description),`${pathname}: duplicate description`); descriptions.add(description);
  const links = elements('link').filter(node=>attributes(node).rel==='canonical');
  assert.equal(links.length,1,`${pathname}: missing/duplicate canonical`);
  assert.equal(attributes(links[0]).href,canonical,`${pathname}: non-canonical URL`);
  assert.equal(oneMeta('og:title'),title); assert.equal(oneMeta('twitter:title'),title);
  assert.equal(oneMeta('og:description'),description); assert.equal(oneMeta('twitter:description'),description);
  assert.equal(oneMeta('og:url'),canonical); assert.equal(oneMeta('twitter:card'),'summary_large_image');
  const image = oneMeta('og:image'); assert.equal(oneMeta('twitter:image'),image);
  assert(image.startsWith(`${SITE_URL}/social/`),`${pathname}: image must have an absolute production URL`);
  assert(oneMeta('og:image:alt')); assert.equal(oneMeta('twitter:image:alt'),oneMeta('og:image:alt'));
  assert.equal(oneMeta('og:image:width'),'1200'); assert.equal(oneMeta('og:image:height'),'630');
  const imageFile = path.join(root,new URL(image).pathname);
  assert(existsSync(imageFile),`${pathname}: missing social image`);
  const metadata = await sharp(imageFile).metadata(); assert.equal(metadata.width,1200); assert.equal(metadata.height,630); assert.equal(metadata.format,'png');
  assert.equal(elements('h1').length,1,`${pathname}: expected one visible h1`);
  assert.equal(attributes(elements('html')[0]).lang,'en');
  for (const anchor of elements('a')) {
    const href = attributes(anchor).href;
    if (href?.startsWith('/') && !href.startsWith('//')) {
      const url = new URL(href,SITE_URL);
      assert(url.pathname==='/' || url.pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(url.pathname),`${pathname}: internal link redirects to a trailing slash: ${href}`);
    }
  }
  const scripts = elements('script').filter(node=>attributes(node).type==='application/ld+json');
  assert.equal(scripts.length,1,`${pathname}: expected one structured-data graph`);
  const graph = JSON.parse(text(scripts[0]))['@graph']; assert(Array.isArray(graph));
  assert(graph.some(node=>node['@type']==='WebSite')); assert(graph.some(node=>node['@type']==='Organization'));
  const robots = oneMeta('robots');
  if (pathname==='/404') assert(robots.includes('noindex')); else { assert(!robots.includes('noindex')); indexed.add(canonical); }
  if (pathname.startsWith('/teleport/')) {
    const slug = pathname.split('/').at(-1); assert(guideNames.delete(slug),`${pathname}: unknown/duplicate guide`);
    assert.equal(image,`${SITE_URL}/social/${slug}.png`);
    assert.equal(oneMeta('og:type'),'article');
    const article = graph.find(node=>node['@type']==='TechArticle'); assert(article,`${pathname}: missing article`);
    assert.equal(article.headline,text(elements('h1')[0]));
    assert.equal(article.mainEntityOfPage['@id'],`${canonical}#webpage`);
    assert(article.about.softwareVersion,`${pathname}: missing upstream version`);
    const breadcrumb = graph.find(node=>node['@type']==='BreadcrumbList'); assert.equal(breadcrumb.itemListElement.length,3);
    assert.equal(breadcrumb.itemListElement.at(-1).item,canonical);
    assert(!graph.some(node=>node['@type']==='HowTo'||node['@type']==='FAQPage'),`${pathname}: obsolete rich-result markup`);
  }
}
assert.equal(guideNames.size,0,'Missing catalog guides');
const sitemapIndex = readFileSync(path.join(root,'sitemap-index.xml'),'utf8');
assert(sitemapIndex.includes(`${SITE_URL}/sitemap-0.xml`));
const sitemap = readFileSync(path.join(root,'sitemap-0.xml'),'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
assert.equal(new Set(locations).size,locations.length,'Duplicate sitemap URLs');
assert.deepEqual(new Set(locations),indexed,'Sitemap and indexable canonicals differ');
assert(readFileSync(path.join(root,'robots.txt'),'utf8').includes(`Sitemap: ${SITE_URL}/sitemap-index.xml`));
console.log(`PASS SEO: ${pages.length} pages, ${indexed.size} indexable URLs, ${loadCatalog().length} server guides; unique metadata, canonicals, social images, structured data, and sitemap consistency.`);
