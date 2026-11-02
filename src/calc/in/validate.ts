// Pure source-data validation; no imports, including JSON, for Node CLI use.
type DataRow = Record<string, unknown>;
const row = (value: unknown): value is DataRow => value !== null && typeof value === 'object' && !Array.isArray(value);
const officialUrl = (value: unknown) => {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port && ['www.incometaxindia.gov.in','incometaxindia.gov.in','www.incometax.gov.in','incometax.gov.in'].includes(url.hostname); } catch { return false; }
};
const isoDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function validateIndiaRegimeData(data: unknown, today = new Date().toISOString().slice(0, 10)): string[] {
  const errors: string[] = [];
  if (!row(data)) return ['India regime data must be an object'];
  const metadata = (record: unknown, label: string): record is DataRow => {
    if (!row(record)) { errors.push(`${label}: expected a source record`); return false; }
    for (const key of ['source_title','verified_by','notes']) if (typeof record[key] !== 'string' || !record[key].trim()) errors.push(`${label}: missing ${key}`);
    if (!officialUrl(record.source_url)) errors.push(`${label}: expected an official Income Tax Department HTTPS source`);
    if (record.effective_from !== '2026-04-01' || record.effective_to !== '2027-03-31') errors.push(`${label}: wrong current tax-year dates`);
    if (!isoDate(record.verified_on) || record.verified_on > today) errors.push(`${label}: invalid or future verification date`);
    return true;
  };
  metadata(data, 'root');
  if (data.tax_year !== '2026-27' || data.currency !== 'INR' || data.max_annual_salary !== 5000000) errors.push('Expected Tax Year2026-27 INR with50lakh gross cap');
  if (data.review_status !== 'source-checked-human-review-pending') errors.push('Human-review-pending status must remain explicit');
  if (!officialUrl(data.year_source_url)) errors.push('Missing official current Tax Year terminology source');
  if (typeof data.worked_example_status !== 'string' || !data.worked_example_status.includes('pending')) errors.push('Official-example gate must remain explicit');
  for (const [regime, standard, threshold, maximum, relief, limits, rates] of [
    ['old',50000,500000,12500,false,[250000,500000,1000000,null],[0,500,2000,3000]],
    ['new',75000,1200000,60000,true,[400000,800000,1200000,1600000,2000000,2400000,null],[0,500,1000,1500,2000,2500,3000]],
  ] as const) {
    const record = data[regime]; if (!metadata(record, regime)) continue;
    if (record.standard_deduction !== standard || record.rebate_threshold !== threshold || record.rebate_max !== maximum || record.rebate_marginal_relief !== relief) errors.push(`${regime}: unsupported salary deduction/rebate rules`);
    if (!Array.isArray(record.brackets) || record.brackets.length !== limits.length) { errors.push(`${regime}: wrong number of bands`); continue; }
    for (let index = 0; index < limits.length; index++) {
      const band: unknown = record.brackets[index];
      if (!row(band) || band.up_to !== limits[index] || band.rate_bps !== rates[index]) errors.push(`${regime}: unsupported band ${index + 1}`);
    }
    if (regime === 'old' && (!officialUrl(record.standard_deduction_source_url) || !officialUrl(record.rebate_source_url))) errors.push('Old salary deduction and rebate need separate enacted-Act provenance');
  }
  if (metadata(data.cess, 'cess') && data.cess.rate_bps !== 400) errors.push('Expected4% Health and Education Cess');
  if (metadata(data.rounding, 'rounding') && (data.rounding.multiple !== 10 || data.rounding.ignore_paise !== true)) errors.push('Section516 rounding must ignorepaise then use₹10 multiples');
  return errors;
}
