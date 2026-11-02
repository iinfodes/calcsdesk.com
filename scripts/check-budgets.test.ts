import { describe, expect, it } from 'vitest';
import { gzipSync } from 'node:zlib';
import { measurePageBudgets } from './check-budgets.mjs';

describe('page performance budgets', () => {
  it('counts transitive cyclic modules once, including hydrated island renderer dependencies', () => {
    const assets: Record<string, string> = {
      '/_astro/app.js': 'import {x} from "./shared.js"; import("./lazy.js");',
      '/_astro/shared.js': 'import "./app.js"; export const x=1;',
      '/_astro/lazy.js': 'import "./shared.js";',
      '/_astro/renderer.js': 'import "./shared.js";',
    };
    const result = measurePageBudgets('<astro-island component-url="/_astro/app.js" renderer-url="/_astro/renderer.js"></astro-island><script src="/_astro/app.js"></script>', (path: string) => assets[path]);
    expect(result.javascript).toEqual(Object.keys(assets).sort());
    expect(result.sizes.javascriptGzip).toBe(Object.values(assets).reduce((sum, source) => sum + gzipSync(source).length, 0));
    expect(result.violations).toEqual([]);
  });
  it('measures UTF-8 HTML, inline CSS and imported CSS without double counting', () => {
    const assets: Record<string, string> = { '/css/app.css': '@import "./shared.css";body{color:red}', '/css/shared.css': 'h1{color:blue}' };
    const html = '<h1>₹</h1><style>p{color:red}</style><link href="/css/app.css"><link href="/css/shared.css">';
    const result = measurePageBudgets(html, (path: string) => assets[path]);
    expect(result.sizes.html).toBe(Buffer.byteLength(html));
    expect(result.sizes.css).toBe(Buffer.byteLength('p{color:red}') + Object.values(assets).reduce((sum, source) => sum + Buffer.byteLength(source), 0));
  });
  it('fails a page whose single stylesheet exceeds the conservative total CSS budget', () => {
    expect(measurePageBudgets('<link href="/large.css">', () => 'x'.repeat(31 * 1024)).violations).toContain('css: 31744 bytes exceeds 30720');
  });
  it('does not silently ignore external or unbundled JavaScript', () => {
    expect(() => measurePageBudgets('<script src="https://example.com/app.js"></script>', () => '')).toThrow('non-local');
    expect(() => measurePageBudgets('<script src="/app.js"></script>', () => 'import "package.js"')).toThrow('Unbundled');
  });
  it('propagates a missing dependency instead of treating it as zero bytes', () => {
    expect(() => measurePageBudgets('<script src="/app.js"></script>', () => { throw new Error('Missing built asset'); })).toThrow('Missing built asset');
  });
  it('resolves Vite preload table paths from the build root', () => {
    const files: Record<string, string> = { '/_astro/app.js': 'const dependencies=["_astro/shared.js"]', '/_astro/shared.js': 'export const ready=true' };
    expect(measurePageBudgets('<script src="/_astro/app.js"></script>', (path: string) => files[path]).javascript).toEqual(['/_astro/app.js', '/_astro/shared.js']);
  });
  it('counts inline executable scripts while excluding structured-data payloads', () => {
    const code = 'document.documentElement.dataset.theme="light"';
    const html = `<script>${code}</script><script type="application/ld+json">{"name":"Example"}</script>`;
    expect(measurePageBudgets(html, () => '').sizes.javascriptGzip).toBe(gzipSync(code).length);
  });
  it('follows unquoted CSS url imports', () => {
    const files: Record<string, string> = { '/app.css': '@import url(./child.css);', '/child.css': 'body{color:red}' };
    expect(measurePageBudgets('<link href="/app.css">', (path: string) => files[path]).stylesheets).toEqual(['/app.css', '/child.css']);
  });
});
