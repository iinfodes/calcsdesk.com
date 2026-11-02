// Release readiness is explicit: an unknown or newly added route never indexes by default.
export const SITE_ORIGIN = 'https://calcsdesk.com';
export const INDEXABLE_PATHS = Object.freeze(['/']);

export function isIndexablePath(pathname) {
  return typeof pathname === 'string' && INDEXABLE_PATHS.includes(pathname);
}

export function robotsForPath(pathname) {
  return isIndexablePath(pathname)
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, follow';
}

export function indexableUrls() {
  return INDEXABLE_PATHS.map(pathname => new URL(pathname, SITE_ORIGIN).href);
}

export function renderSitemap() {
  const entries = indexableUrls().map(url => `  <url><loc>${url}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}
