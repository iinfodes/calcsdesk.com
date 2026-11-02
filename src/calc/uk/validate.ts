// Pure validation: deliberately independent of the calculation engine and JSON imports.
type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => value !== null && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const officialUrl = (value: unknown) => {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port && ['gov.uk', 'www.gov.uk', 'legislation.gov.uk', 'www.legislation.gov.uk'].includes(url.hostname); } catch { return false; }
};

export function validateUkSalaryData(data: unknown, today = new Date().toISOString().slice(0, 10)): string[] {
  const errors: string[] = [];
  if (!record(data)) return ['UK salary data must be an object'];
  const metadata = (row: unknown, label: string): row is RecordValue => {
    if (!record(row)) { errors.push(`${label}: expected a record`); return false; }
    for (const key of ['source_title', 'verified_by', 'notes']) if (typeof row[key] !== 'string' || !row[key].trim()) errors.push(`${label}: missing ${key}`);
    if (!officialUrl(row.source_url)) errors.push(`${label}: source_url must use an approved official HTTPS host`);
    if (row.effective_from !== '2026-04-06' || row.effective_to !== '2027-04-05') errors.push(`${label}: effective dates must cover exactly 2026/27`);
    if (!date(row.verified_on) || row.verified_on > today) errors.push(`${label}: invalid or future verification date`);
    return true;
  };
  metadata(data, 'root');
  if (data.tax_year !== '2026-27' || data.currency !== 'GBP') errors.push('Expected 2026-27 GBP data');
  if (data.review_status !== 'source-checked-human-review-pending') errors.push('UK beta review status must remain explicit');
  if (metadata(data.personal_allowance, 'Personal Allowance')) {
    const pa = data.personal_allowance;
    if (pa.amount !== 12570 || pa.taper_start !== 100000 || pa.taper_divisor !== 2) errors.push('Unexpected Personal Allowance or taper');
    if (!officialUrl(pa.rounding_source_url)) errors.push('Missing official Personal Allowance rounding source');
    if (typeof pa.rounding !== 'string' || !pa.rounding.trim()) errors.push('Personal Allowance rounding must be documented');
  }
  const schedules = record(data.income_tax) ? data.income_tax : {};
  for (const [key, limits, rates] of [
    ['rest_of_uk', [37700,125140,null], [2000,4000,4500]],
    ['scotland', [3967,16956,31092,62430,125140,null], [1900,2000,2100,4200,4500,4800]],
  ] as const) {
    const row = schedules[key];
    if (!metadata(row, key)) continue;
    if (typeof row.label !== 'string' || !row.label.trim()) errors.push(`${key}: missing label`);
    if (!Array.isArray(row.brackets) || row.brackets.length !== limits.length) { errors.push(`${key}: unexpected number of brackets`); continue; }
    for (let index = 0; index < limits.length; index++) {
      const band: unknown = row.brackets[index];
      if (!record(band) || band.up_to !== limits[index] || band.rate_bps !== rates[index]) errors.push(`${key}: unsupported band ${index + 1}`);
    }
    if (key === 'scotland' && !officialUrl(row.crosscheck_url)) errors.push('Scotland: missing official crosscheck source');
  }
  if (metadata(data.employee_ni, 'Employee NI')) {
    const ni = data.employee_ni;
    if (ni.category !== 'A' || ni.main_rate_bps !== 800 || ni.upper_rate_bps !== 200) errors.push('Unsupported employee NI category or rates');
    for (const [period, lower, upper] of [['monthly',1048,4189],['weekly',242,967]] as const) {
      const thresholds = ni[period];
      if (!record(thresholds) || thresholds.primary_threshold !== lower || thresholds.upper_earnings_limit !== upper) errors.push(`Unexpected ${period} NI thresholds`);
    }
    if (!officialUrl(ni.period_source_url)) errors.push('Missing official NI earnings-period source');
    if (typeof ni.rounding !== 'string' || !ni.rounding.trim()) errors.push('NI rounding must be documented');
  }
  const examples = data.official_examples;
  if (!record(examples) || !officialUrl(examples.income_tax_source_url)) errors.push('Missing official Income Tax example provenance');
  return errors;
}
