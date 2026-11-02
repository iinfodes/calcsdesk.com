const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const date = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const official = (value: unknown) => {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value);return url.protocol === 'https:' && url.hostname === 'www.canada.ca' && url.pathname.startsWith('/en/revenue-agency/') && !url.username && !url.password && !url.port; } catch { return false; }
};
const today = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
};

/** Release/shape guard, not independent legal verification of any changed rates. */
export function validateCanadianFederalData(data: unknown): string[] {
  if (!record(data)) return ['Canadian federal data must be an object'];
  const errors: string[] = [];
  if (data.tax_year !== 2026 || data.currency !== 'CAD') errors.push('Unsupported Canadian tax year or currency');
  if (data.review_status !== 'foundation-only-human-review-pending') errors.push('Canadian foundation review gate must remain pending');
  for (const key of ['scope', 'source_title', 'verified_by', 'notes']) if (!text(data[key])) errors.push(`Missing ${key}`);
  for (const key of ['source_url', 'cross_check_url']) if (!official(data[key])) errors.push(`Invalid official CRA ${key}`);
  for (const key of ['effective_from', 'effective_to', 'verified_on']) if (!date(data[key])) errors.push(`Invalid ${key}`);
  if (date(data.effective_from) && date(data.effective_to)) {
    if (data.effective_from > data.effective_to) errors.push('Reversed effective dates');
    if (data.effective_from > '2026-01-01' || data.effective_to < '2026-12-31') errors.push('Effective dates must cover the modeled 2026 tax year');
  }
  if (date(data.verified_on) && data.verified_on > today()) errors.push('verified_on cannot be in the future');
  const examples = data.official_worked_examples;
  if (!record(examples) || examples.required !== 2 || examples.verified !== 0 || !text(examples.status) || !examples.status.toLowerCase().includes('pending')) errors.push('Canadian official worked examples must remain pending at zero verified');
  if (!Array.isArray(data.brackets) || data.brackets.length !== 5) errors.push('Expected five Canadian federal bands');
  const brackets: unknown[] = Array.isArray(data.brackets) ? data.brackets : [];
  let previousCeiling = 0;
  let previousRate = 0;
  for (let index = 0; index < brackets.length; index++) {
    const row = brackets[index];
    if (!record(row)) { errors.push(`Band ${index + 1} must be an object`);continue; }
    if (index === brackets.length - 1 ? row.up_to !== null : typeof row.up_to !== 'number' || !Number.isSafeInteger(row.up_to) || !Number.isSafeInteger(row.up_to * 100) || row.up_to <= previousCeiling) errors.push(`Band ${index + 1} has invalid bounds`);
    if (typeof row.rate_bps !== 'number' || !Number.isSafeInteger(row.rate_bps) || row.rate_bps <= previousRate || row.rate_bps >= 10000) errors.push(`Band ${index + 1} has invalid marginal rate`);
    if (typeof row.up_to === 'number' && Number.isSafeInteger(row.up_to)) previousCeiling = row.up_to;
    if (typeof row.rate_bps === 'number' && Number.isSafeInteger(row.rate_bps)) previousRate = row.rate_bps;
  }
  return errors;
}
