import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { posix, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const PAGE_BUDGETS = Object.freeze({ html: 100 * 1024, css: 30 * 1024, javascriptGzip: 70 * 1024 });

function localAsset(reference, parent = '/') {
  const path = reference.split(/[?#]/)[0];
  if (/^[a-z]+:|^\/\//i.test(path) || path.includes('\\')) throw new Error(`Cannot budget non-local asset: ${reference}`);
  // Vite's generated preload table stores build-root paths without a leading slash.
  if (path.startsWith('_astro/')) return '/' + path;
  if (!path.startsWith('/') && !path.startsWith('.')) throw new Error(`Unbundled asset import: ${reference}`);
  return posix.resolve(posix.dirname(parent), path);
}

/** Count each transitive JS/CSS asset once per page, using an injected file reader. */
export function measurePageBudgets(html, readAsset) {
  const javascript = new Set();
  const stylesheets = new Set();
  let javascriptGzip = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes, source]) => !/\bsrc\s*=/i.test(attributes) && !/\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attributes) && source.trim())
    .reduce((sum, [, , source]) => sum + gzipSync(source).length, 0);
  let css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].reduce((sum, match) => sum + Buffer.byteLength(match[1]), 0);
  const visitScript = reference => {
    const path = localAsset(reference);
    if (javascript.has(path)) return;
    javascript.add(path);
    const source = readAsset(path);
    javascriptGzip += gzipSync(source).length;
    // Includes static/dynamic imports and bundled preload dependency strings.
    for (const [, , dependency] of source.matchAll(/(['"])([^'"\s]+\.m?js(?:\?[^'"\s]*)?)\1/g)) visitScript(localAsset(dependency, path));
  };
  const visitStylesheet = reference => {
    const path = localAsset(reference);
    if (stylesheets.has(path)) return;
    stylesheets.add(path);
    const source = readAsset(path);
    css += Buffer.byteLength(source);
    for (const [, , quoted, unquoted] of source.matchAll(/@import\s+(?:url\(\s*)?(?:(['"])([^'"]+)\1|([^'"\s);]+))/g)) visitStylesheet(localAsset(quoted ?? unquoted, path));
  };
  for (const [, reference] of html.matchAll(/(?:src|component-url|renderer-url|href)=["']([^"']+\.m?js(?:\?[^"']*)?)["']/g)) visitScript(reference);
  for (const [, reference] of html.matchAll(/(?:src|href)=["']([^"']+\.css(?:\?[^"']*)?)["']/g)) visitStylesheet(reference);
  // Astro can emit module imports inline rather than in script src attributes.
  for (const [, reference] of html.matchAll(/["'](\/_astro\/[^"'\s]+\.m?js)["']/g)) visitScript(reference);
  const sizes = { html: Buffer.byteLength(html), css, javascriptGzip };
  return { sizes, javascript: [...javascript].sort(), stylesheets: [...stylesheets].sort(), violations: Object.entries(PAGE_BUDGETS).filter(([key, limit]) => sizes[key] > limit).map(([key, limit]) => `${key}: ${sizes[key]} bytes exceeds ${limit}`) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const root = resolve('dist');
  const readAsset = reference => {
    const path = resolve(root, '.' + reference);
    if (!path.startsWith(root + sep) || !existsSync(path)) throw new Error(`Missing built asset: ${reference}`);
    return readFileSync(path, 'utf8');
  };
  let failed = false;
  const report = [];
  for (const file of readdirSync(root, { recursive: true }).filter(file => String(file).endsWith('.html'))) {
    try {
      const result = measurePageBudgets(readFileSync(resolve(root, file), 'utf8'), readAsset);
      report.push({ page: String(file).replaceAll('\\', '/'), ...result.sizes });
      for (const message of result.violations) { failed = true; console.error(`${file}: ${message}`); }
    } catch (error) { failed = true; console.error(`${file}: ${error instanceof Error ? error.message : 'Could not measure budget'}`); }
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else console.log(`Measured ${report.length} pages: HTML ≤100 KiB, all linked/inline CSS ≤30 KiB, transitive JS ≤70 KiB gzip. ${failed ? 'Budget failure.' : 'Budgets passed.'}`);
  if (failed) process.exitCode = 1;
}
