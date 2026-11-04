import { describe, expect, it } from 'vitest';
import { checkLiveSite } from './check-live.mjs';
import { robotsForPath } from '../src/lib/page-policy.mjs';

function publishedSite() {
  return async (url: string) => {
    const parsed = new URL(url);
    if (parsed.origin !== 'https://calcsdesk.com') return new Response(null, { status: 301, headers: { location: `https://calcsdesk.com${parsed.pathname}${parsed.search}` } });
    if (parsed.pathname === '/sitemap.xml') return new Response('<urlset><url><loc>https://calcsdesk.com/</loc></url><url><loc>https://calcsdesk.com/methodology/</loc></url></urlset>');
    if (parsed.pathname === '/robots.txt') return new Response('Sitemap: https://calcsdesk.com/sitemap.xml');
    if (parsed.pathname.includes('__calcsdesk-release-check-missing__')) return new Response('<meta name="robots" content="noindex, follow">', { status: 404 });
    return new Response(`<meta name="robots" content="${robotsForPath(parsed.pathname)}"><link rel="canonical" href="${url}">`, { headers: { 'x-content-type-options': 'nosniff' } });
  };
}

describe('read-only release smoke check', () => {
  it('accepts correct released pages and direct path/query-preserving redirects', async () => {
    const result = await checkLiveSite(publishedSite());
    expect(result.failures).toEqual([]);
    expect(result.checks).toHaveLength(24);
  });
  it('reports a production header noindex, duplicate sitemap URL and query-stripping redirect', async () => {
    const base = publishedSite();
    const result = await checkLiveSite(async (url: string) => {
      if (url === 'https://calcsdesk.com/') { const response = await base(url); response.headers.set('x-robots-tag', 'noindex'); return response; }
      if (url.endsWith('sitemap.xml')) return new Response('<loc>https://calcsdesk.com/</loc><loc>https://calcsdesk.com/</loc>');
      if (url.startsWith('http://www.')) return new Response(null, { status: 301, headers: { location: 'https://calcsdesk.com/us/tax/income-tax-calculator/' } });
      return base(url);
    });
    expect(result.failures).toHaveLength(3);
    expect(result.failures.join('\n')).toContain('HTTP header blocks home indexing');
    expect(result.failures.join('\n')).toContain('sitemap differs');
    expect(result.failures.join('\n')).toContain('preserve path/query');
  });
  it('records request failures without silently skipping the route', async () => {
    const base = publishedSite();
    const result = await checkLiveSite(async (url: string) => { if (url.endsWith('/about/')) throw new Error('Connection failed'); return base(url); });
    expect(result.failures).toEqual(['/about/: Connection failed']);
  });
});
