import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { INDEXABLE_PATHS, SITE_ORIGIN, indexableUrls, isIndexablePath, robotsForPath } from '../src/lib/page-policy.mjs';

const root = resolve('dist');
const files = readdirSync(root, { recursive: true }).filter(file => String(file).endsWith('.html'));
const errors = [];
const titles = new Set();
const builtRoutes = new Set();
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map(match => [match[1].toLowerCase(), match[2]]));
for (const file of files) {
  const html = readFileSync(join(root, file), 'utf8');
  const relative = String(file).replaceAll('\\', '/');
  const pathname = relative === 'index.html' ? '/' : `/${relative.replace(/\/index\.html$/, '/')}`;
  builtRoutes.add(pathname);
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  if (!title || titles.has(title)) errors.push(`${file}: missing or duplicate title`);
  titles.add(title);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push(`${file}: expected one H1`);
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
  const descriptions = meta.filter(tag => tag.name?.toLowerCase() === 'description');
  if (descriptions.length !== 1 || !descriptions[0].content?.trim()) errors.push(`${file}: missing or duplicate description`);
  const robots = meta.filter(tag => tag.name?.toLowerCase() === 'robots');
  if (robots.length !== 1 || robots[0].content !== robotsForPath(pathname)) errors.push(`${file}: robots must match route release policy (${robotsForPath(pathname)})`);
  for (const tag of meta.filter(tag => ['googlebot', 'bingbot'].includes(tag.name?.toLowerCase()))) {
    if (isIndexablePath(pathname) && /(?:^|[,\s])(noindex|none)(?:$|[,\s])/i.test(tag.content || '')) errors.push(`${file}: bot-specific noindex conflicts with release policy`);
  }
  const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).filter(tag => tag.rel?.toLowerCase() === 'canonical');
  if (canonicals.length !== 1 || canonicals[0].href !== new URL(pathname, SITE_ORIGIN).href) errors.push(`${file}: canonical must be the HTTPS apex route without query or fragment`);
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(json); } catch { errors.push(`${file}: invalid structured data JSON`); } }
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const [pathname, fragment] = href.split('#');
    const target = join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
    if (!existsSync(target)) errors.push(`${file}: broken internal link ${href}`);
    else if (fragment && !readFileSync(target, 'utf8').includes(`id="${fragment}"`)) errors.push(`${file}: missing target ${href}`);
  }
  if (/googlesyndication|doubleclick\.net|adsbygoogle/.test(html)) errors.push(`${file}: unapproved ad integration`);
}
for (const pathname of INDEXABLE_PATHS) if (!builtRoutes.has(pathname)) errors.push(`Release policy lists a missing page: ${pathname}`);
const sitemapPath = join(root, 'sitemap.xml');
if (!existsSync(sitemapPath)) errors.push('Missing released-page sitemap.xml');
else {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  if (JSON.stringify([...locations].sort()) !== JSON.stringify(indexableUrls().sort())) errors.push('Sitemap must list exactly the indexable canonical URLs, without duplicates or unreleased pages');
}
const headersPath = join(root, '_headers');
if (existsSync(headersPath)) {
  let routePattern = '';
  for (const line of readFileSync(headersPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) { routePattern = line.trim(); continue; }
    if (!/^\s*x-robots-tag\s*:/i.test(line) || !/(?:^|[,\s:])(noindex|none)(?:$|[,\s])/i.test(line)) continue;
    const escaped = routePattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*');
    const pattern = new RegExp(`^${escaped}$`);
    for (const pathname of INDEXABLE_PATHS) if (pattern.test(pathname) || pattern.test(new URL(pathname, SITE_ORIGIN).href)) errors.push(`_headers: X-Robots-Tag conflicts with indexable route ${pathname}`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Site guards passed for ${files.length} pages: per-route indexing, canonical metadata, sitemap, structured data, internal links and no ad integration.`);
