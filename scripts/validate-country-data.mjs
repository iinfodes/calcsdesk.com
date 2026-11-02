const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = value => typeof value === 'string' && value.trim().length > 0;
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const officialUrl = (value, hosts) => {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value);return url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password && !url.port; } catch { return false; }
};
const auHosts = ['www.legislation.gov.au', 'legislation.gov.au', 'moneysmart.gov.au', 'www.moneysmart.gov.au', 'www.ato.gov.au', 'ato.gov.au'];
const aeHosts = ['u.ae', 'assets.u.ae', 'www.mohre.gov.ae', 'mohre.gov.ae'];
const today = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
};
function provenance(data, hosts, allowOpenEnd, errors) {
  for (const key of ['source_title', 'verified_by', 'notes', 'scope']) if (!text(data[key])) errors.push(`Missing ${key}`);
  if (!officialUrl(data.source_url, hosts)) errors.push('Invalid official source_url');
  if (!date(data.effective_from)) errors.push('Invalid effective_from');
  if (!(allowOpenEnd && data.effective_to === null) && !date(data.effective_to)) errors.push('Invalid effective_to');
  if (date(data.effective_from) && date(data.effective_to) && data.effective_from > data.effective_to) errors.push('Reversed effective dates');
  if (!date(data.verified_on)) errors.push('Invalid verified_on');
  else if (data.verified_on > today()) errors.push('verified_on cannot be in the future');
}

/** Structural and semantic release guards; these do not independently verify source truth. */
export function validateAustralianIncomeTaxData(data) {
  const errors = [];
  if (!record(data)) return ['Australian income-tax data must be an object'];
  provenance(data, auHosts, false, errors);
  if (data.tax_year !== '2026-27' || data.currency !== 'AUD') errors.push('Unsupported Australian tax year or currency');
  if (data.review_status !== 'foundation-only-human-review-pending') errors.push('Australian foundation review gate must remain pending');
  if (!officialUrl(data.cross_check_url, auHosts)) errors.push('Invalid official cross_check_url');
  if (date(data.effective_from) && date(data.effective_to) && (data.effective_from > '2026-07-01' || data.effective_to < '2027-06-30')) errors.push('Effective dates must cover the modeled Australian tax year');
  if (!Array.isArray(data.brackets) || data.brackets.length !== 5) errors.push('Expected five Australian schedule bands');
  const rows = Array.isArray(data.brackets) ? data.brackets : [];
  let previousCeiling = 0;
  let previousRate = -1;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!record(row)) { errors.push(`Band ${index + 1} must be an object`);continue; }
    const final = index === rows.length - 1;
    if (final ? row.up_to !== null : !Number.isSafeInteger(row.up_to) || !Number.isSafeInteger(row.up_to * 100) || row.up_to <= previousCeiling) errors.push(`Band ${index + 1} has invalid bounds`);
    if (!Number.isSafeInteger(row.rate_bps) || row.rate_bps < 0 || row.rate_bps >= 10000 || row.rate_bps <= previousRate || (index === 0 && row.rate_bps !== 0)) errors.push(`Band ${index + 1} has invalid marginal rate`);
    if (Number.isSafeInteger(row.up_to)) previousCeiling = row.up_to;
    if (Number.isSafeInteger(row.rate_bps)) previousRate = row.rate_bps;
  }
  return errors;
}

export function validateUaeGratuityData(data) {
  const errors = [];
  if (!record(data)) return ['UAE gratuity data must be an object'];
  provenance(data, aeHosts, true, errors);
  if (data.currency !== 'AED') errors.push('Unsupported UAE currency');
  if (data.review_status !== 'pending-human-review-and-two-official-worked-examples') errors.push('UAE human and official-example review gates must remain pending');
  // This engine implements these specific statutory units/bands, not a generic rule editor.
  for (const [key, value] of Object.entries({ year_days: 365, month_days: 30, minimum_service_days: 365, first_band_years: 5, first_band_days_per_year: 21, later_band_days_per_year: 30 })) {
    if (data[key] !== value) errors.push(`Unsupported UAE rule ${key}`);
  }
  if (data.cap_review_boundary_months_basic !== 24 || !text(data.cap_status) || !text(data.rounding)) errors.push('Missing or invalid unresolved-cap boundary or rounding convention');
  if (date(data.effective_from) && data.effective_from > '2022-02-02') errors.push('Effective start excludes the modeled law commencement');
  if (date(data.effective_to) && data.effective_to < '2026-11-02') errors.push('Effective end excludes the verified model date');
  const excluded = data.excluded;
  if (!Array.isArray(excluded) || Array.from(excluded).some(value => !text(value)) || new Set(excluded).size !== excluded.length) errors.push('Invalid UAE exclusions');
  for (const exclusion of ['DIFC', 'ADGM', 'government', 'domestic workers', 'UAE nationals', 'savings or alternative schemes', 'part-time or other work patterns', 'piecework', 'disputed continuous service', 'cap-affected service']) {
    if (!Array.isArray(excluded) || !excluded.includes(exclusion)) errors.push(`Missing UAE exclusion: ${exclusion}`);
  }
  if (!Array.isArray(data.sources) || data.sources.length < 3) errors.push('Expected supporting UAE source records, including the cap conflict');
  const sources = Array.isArray(data.sources) ? data.sources : [];
  const urls = new Set();
  for (let index = 0; index < sources.length; index++) {
    const source = sources[index];
    if (!record(source)) { errors.push(`UAE source ${index + 1} must be an object`);continue; }
    if (!text(source.title) || !text(source.supports) || !officialUrl(source.url, aeHosts)) errors.push(`Invalid UAE source ${index + 1}`);
    if (urls.has(source.url)) errors.push('Duplicate UAE source URL');
    urls.add(source.url);
  }
  if (!urls.has(data.source_url)) errors.push('Root UAE provenance must appear among supporting sources');
  const examples = data.official_worked_examples;
  if (!record(examples) || examples.required !== 2 || examples.verified !== 0 || !text(examples.status) || !examples.status.toLowerCase().includes('pending')) errors.push('UAE official-example gate must remain explicitly pending at zero verified examples');
  return errors;
}
