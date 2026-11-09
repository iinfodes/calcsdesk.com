// Release readiness is explicit: an unknown or newly added route never indexes by default.
export const SITE_ORIGIN = 'https://calcsdesk.com';
export const INDEXABLE_PATHS = Object.freeze([
  '/',
  '/about/',
  '/ae/',
  '/ae/gratuity/gratuity-calculator/',
  '/au/',
  '/au/pay/pay-calculator/',
  '/ca/',
  '/ca/tax/',
  '/ca/tax/income-tax-calculator/',
  '/ca/tax/income-tax-calculator/alberta/',
  '/ca/tax/income-tax-calculator/british-columbia/',
  '/ca/tax/income-tax-calculator/manitoba/',
  '/ca/tax/income-tax-calculator/new-brunswick/',
  '/ca/tax/income-tax-calculator/newfoundland-and-labrador/',
  '/ca/tax/income-tax-calculator/northwest-territories/',
  '/ca/tax/income-tax-calculator/nova-scotia/',
  '/ca/tax/income-tax-calculator/nunavut/',
  '/ca/tax/income-tax-calculator/ontario/',
  '/ca/tax/income-tax-calculator/prince-edward-island/',
  '/ca/tax/income-tax-calculator/quebec/',
  '/ca/tax/income-tax-calculator/saskatchewan/',
  '/ca/tax/income-tax-calculator/yukon/',
  '/corrections/',
  '/editorial-policy/',
  '/in/',
  '/in/tax/income-tax-calculator/',
  '/methodology/',
  '/sources/',
  '/sources/ae/',
  '/sources/au/',
  '/sources/ca/',
  '/sources/in/',
  '/sources/uk/',
  '/sources/us/',
  '/team/',
  '/uk/',
  '/uk/pay/',
  '/uk/pay/salary-calculator/',
  '/updates/',
  '/us/',
  '/us/pay/',
  '/us/pay/paycheck-calculator/',
  '/us/pay/paycheck-calculator/alabama/',
  '/us/pay/paycheck-calculator/alaska/',
  '/us/pay/paycheck-calculator/arizona/',
  '/us/pay/paycheck-calculator/arkansas/',
  '/us/pay/paycheck-calculator/california/',
  '/us/pay/paycheck-calculator/colorado/',
  '/us/pay/paycheck-calculator/connecticut/',
  '/us/pay/paycheck-calculator/delaware/',
  '/us/pay/paycheck-calculator/district-of-columbia/',
  '/us/pay/paycheck-calculator/florida/',
  '/us/pay/paycheck-calculator/georgia/',
  '/us/pay/paycheck-calculator/hawaii/',
  '/us/pay/paycheck-calculator/idaho/',
  '/us/pay/paycheck-calculator/illinois/',
  '/us/pay/paycheck-calculator/indiana/',
  '/us/pay/paycheck-calculator/iowa/',
  '/us/pay/paycheck-calculator/kansas/',
  '/us/pay/paycheck-calculator/kentucky/',
  '/us/pay/paycheck-calculator/louisiana/',
  '/us/pay/paycheck-calculator/maine/',
  '/us/pay/paycheck-calculator/maryland/',
  '/us/pay/paycheck-calculator/massachusetts/',
  '/us/pay/paycheck-calculator/michigan/',
  '/us/pay/paycheck-calculator/minnesota/',
  '/us/pay/paycheck-calculator/mississippi/',
  '/us/pay/paycheck-calculator/missouri/',
  '/us/pay/paycheck-calculator/montana/',
  '/us/pay/paycheck-calculator/nebraska/',
  '/us/pay/paycheck-calculator/nevada/',
  '/us/pay/paycheck-calculator/new-hampshire/',
  '/us/pay/paycheck-calculator/new-jersey/',
  '/us/pay/paycheck-calculator/new-mexico/',
  '/us/pay/paycheck-calculator/new-york/',
  '/us/pay/paycheck-calculator/north-carolina/',
  '/us/pay/paycheck-calculator/north-dakota/',
  '/us/pay/paycheck-calculator/ohio/',
  '/us/pay/paycheck-calculator/oklahoma/',
  '/us/pay/paycheck-calculator/oregon/',
  '/us/pay/paycheck-calculator/pennsylvania/',
  '/us/pay/paycheck-calculator/rhode-island/',
  '/us/pay/paycheck-calculator/south-carolina/',
  '/us/pay/paycheck-calculator/south-dakota/',
  '/us/pay/paycheck-calculator/tennessee/',
  '/us/pay/paycheck-calculator/texas/',
  '/us/pay/paycheck-calculator/utah/',
  '/us/pay/paycheck-calculator/vermont/',
  '/us/pay/paycheck-calculator/virginia/',
  '/us/pay/paycheck-calculator/washington/',
  '/us/pay/paycheck-calculator/west-virginia/',
  '/us/pay/paycheck-calculator/wisconsin/',
  '/us/pay/paycheck-calculator/wyoming/',
  '/us/tax/',
  '/us/tax/income-tax-calculator/',
]);

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
