import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve('dist');
const files = readdirSync(root, { recursive: true }).filter(file => String(file).endsWith('.html'));
const errors = [];
const titles = new Set();
for (const file of files) {
  const html = readFileSync(join(root, file), 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  if (!title || titles.has(title)) errors.push(`${file}: missing or duplicate title`);
  titles.add(title);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push(`${file}: expected one H1`);
  for (const requirement of ['name="description"', 'rel="canonical"', 'content="noindex, follow"']) if (!html.includes(requirement)) errors.push(`${file}: missing ${requirement}`);
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
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Site guards passed for ${files.length} pages: metadata, noindex, structured data, internal links and no ad integration.`);
