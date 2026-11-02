import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { SITE_ORIGIN, indexableUrls, robotsForPath } from '../src/lib/page-policy.mjs';

export const LIVE_ROUTES = Object.freeze(['/', '/us/', '/uk/', '/ca/', '/au/', '/ae/', '/in/', '/about/', '/team/', '/editorial-policy/', '/corrections/', '/updates/', '/methodology/', '/sources/', '/us/tax/income-tax-calculator/', '/uk/pay/salary-calculator/', '/ae/gratuity/gratuity-calculator/', '/in/tax/income-tax-calculator/']);

/**
 * Read-only post-deployment smoke check. It does not submit indexing requests or user data.
 * @param {(url: string, init?: RequestInit) => Promise<Response>} fetcher
 */
export async function checkLiveSite(fetcher = fetch) {
  const failures = [];
  const checks = [];
  const run = async (label, callback) => {
    try { await callback(); checks.push(label); }
    catch (error) { failures.push(`${label}: ${error instanceof Error ? error.message : 'request failed'}`); }
  };
  const request = (url, options = {}) => fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(15_000), ...options });
  const require = (condition, message) => { if (!condition) throw new Error(message); };
  await Promise.all(LIVE_ROUTES.map(route => run(route, async () => {
    const response = await request(SITE_ORIGIN + route);
    require(response.status === 200, `expected 200, got ${response.status}`);
    const html = await response.text();
    require(html.includes(`name="robots" content="${robotsForPath(route)}"`), 'robots policy mismatch');
    require(html.includes(`rel="canonical" href="${SITE_ORIGIN}${route}"`), 'canonical mismatch');
    require(response.headers.get('x-content-type-options') === 'nosniff', 'missing nosniff security header');
    if (route === '/') require(!/\bnoindex\b|\bnone\b/i.test(response.headers.get('x-robots-tag') || ''), 'HTTP header blocks home indexing');
    require(!/adsbygoogle|googlesyndication|mailto:/i.test(html), 'unexpected advertising or email link');
  })));
  await run('released sitemap', async () => {
    const response = await request(`${SITE_ORIGIN}/sitemap.xml`);
    require(response.status === 200, `expected 200, got ${response.status}`);
    const urls = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    require(JSON.stringify(urls.sort()) === JSON.stringify(indexableUrls().sort()), 'sitemap differs from released-page allowlist');
  });
  await run('robots sitemap discovery', async () => {
    const response = await request(`${SITE_ORIGIN}/robots.txt`);
    require(response.status === 200, `expected 200, got ${response.status}`);
    require((await response.text()).includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`), 'sitemap declaration missing');
  });
  const suffix = '/us/tax/income-tax-calculator/?release-check=1&preserve=a%2Fb';
  await Promise.all(['http://calcsdesk.com', 'http://www.calcsdesk.com', 'https://www.calcsdesk.com'].map(origin => run(`one-hop ${origin}`, async () => {
    const response = await request(origin + suffix);
    require(response.status === 301, `expected 301, got ${response.status}`);
    require(response.headers.get('location') === SITE_ORIGIN + suffix, 'redirect must preserve path/query directly to HTTPS apex');
  })));
  await run('missing page', async () => {
    const response = await request(`${SITE_ORIGIN}/__calcsdesk-release-check-missing__/`);
    require(response.status === 404, `expected 404, got ${response.status}`);
    require((await response.text()).includes('content="noindex, follow"'), 'missing page must stay noindex');
  });
  return { origin: SITE_ORIGIN, checks: checks.sort(), failures: failures.sort() };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const report = await checkLiveSite();
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
}
