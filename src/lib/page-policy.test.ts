import { describe, expect, it } from 'vitest';
import { INDEXABLE_PATHS, SITE_ORIGIN, indexableUrls, isIndexablePath, renderSitemap, robotsForPath } from './page-policy.mjs';

describe('conservative page release policy', () => {
  it('makes the approved canonical routes indexable', () => {
    expect(new Set(INDEXABLE_PATHS).size).toBe(95);
    expect(INDEXABLE_PATHS).toContain('/us/pay/paycheck-calculator/district-of-columbia/');
    expect(INDEXABLE_PATHS).toContain('/ca/tax/income-tax-calculator/quebec/');
    expect(isIndexablePath('/')).toBe(true);
    expect(robotsForPath('/')).toContain('index, follow');
    expect(robotsForPath('/')).not.toContain('noindex');
  });
  it.each(['/privacy/', '/terms/', '/contact/', '/404.html', '/not-yet-created/'])('keeps %s out of the released set', pathname => {
    expect(isIndexablePath(pathname)).toBe(false);
    expect(robotsForPath(pathname)).toBe('noindex, follow');
  });
  it.each(['', '//', '/index.html', '/?search=tax', '/#countries', 'https://calcsdesk.com/', 'https://www.calcsdesk.com/', '/./', '/%2f', null, undefined, 123])('does not normalize an unexpected input into indexability: %s', input => {
    expect(isIndexablePath(input)).toBe(false);
  });
  it('does not allow mutation of the release allowlist', () => {
    expect(Object.isFrozen(INDEXABLE_PATHS)).toBe(true);
  });
});

describe('released sitemap', () => {
  it('contains only canonical apex HTTPS URLs from the release set', () => {
    expect(SITE_ORIGIN).toBe('https://calcsdesk.com');
    expect(indexableUrls()).toHaveLength(95);
    expect(indexableUrls().every(url => new URL(url).origin === SITE_ORIGIN)).toBe(true);
    const xml = renderSitemap();
    expect([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])).toEqual(indexableUrls());
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).not.toContain('<lastmod>'); // No fabricated modification timestamp.
    expect(xml).not.toContain('/privacy/');
  });
});
