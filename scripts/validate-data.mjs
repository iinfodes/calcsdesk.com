import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const statuses = ['single', 'married_joint', 'married_separate', 'head_household', 'surviving_spouse'];
const required = ['source_url', 'source_title', 'effective_from', 'effective_to', 'verified_on', 'verified_by', 'notes'];
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const money = (value, positive = false) => Number.isSafeInteger(value) && Number.isSafeInteger(value * 100) && (positive ? value > 0 : value >= 0);
const todayInOwnerTimezone = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
};

export function validateFederalData(data) {
  const errors = [];
  if (!record(data)) return ['Federal data must be an object'];
  const modeledYear = Number.isInteger(data.tax_year) && data.tax_year === 2026 ? data.tax_year : 2026;
  const today = todayInOwnerTimezone();
  const metadata = (row, label) => {
    for (const key of required) if (typeof row[key] !== 'string' || !row[key].trim()) errors.push(`${label}: missing ${key}`);
    try {
      if (typeof row.source_url !== 'string') throw new TypeError();
      const url = new URL(row.source_url);
      if (url.protocol !== 'https:' || !['www.irs.gov', 'www.ssa.gov'].includes(url.hostname) || url.username || url.password || url.port) errors.push(`${label}: unapproved source`);
    } catch { errors.push(`${label}: invalid source URL`); }
    for (const key of ['effective_from', 'effective_to', 'verified_on']) if (!validDate(row[key])) errors.push(`${label}: invalid ${key}`);
    if (validDate(row.effective_from) && validDate(row.effective_to)) {
      if (row.effective_from > row.effective_to) errors.push(`${label}: reversed effective dates`);
      else if (row.effective_from > `${modeledYear}-01-01` || row.effective_to < `${modeledYear}-12-31`) errors.push(`${label}: effective dates must cover the modeled tax year`);
    }
    if (validDate(row.verified_on) && row.verified_on > today) errors.push(`${label}: verified_on cannot be in the future`);
  };
  if (!Number.isInteger(data.tax_year) || data.tax_year !== 2026 || data.currency !== 'USD') errors.push('Unexpected tax year or currency');
  if (!Array.isArray(data.filing_statuses) || data.filing_statuses.length !== statuses.length) errors.push('Expected five filing statuses');
  const filingRows = Array.isArray(data.filing_statuses) ? data.filing_statuses : [];
  for (let index = 0; index < filingRows.length; index++) {
    if (!record(filingRows[index])) errors.push(`filing_statuses[${index}]: expected an object`);
    else if (!statuses.includes(filingRows[index].id)) errors.push(`filing_statuses[${index}]: unsupported filing status`);
  }
  for (const status of statuses) {
    const rows = filingRows.filter(row => record(row) && row.id === status);
    if (rows.length !== 1) { errors.push(`Missing or duplicate status ${status}`); continue; }
    const row = rows[0];metadata(row, status);
    if (typeof row.label !== 'string' || !row.label.trim()) errors.push(`${status}: missing filing-status label`);
    if (!money(row.standard_deduction)) errors.push(`${status}: invalid deduction`);
    if (!Array.isArray(row.brackets) || row.brackets.length !== 7) { errors.push(`${status}: expected seven brackets`); continue; }
    let previous = 0;
    for (let index = 0; index < row.brackets.length; index++) {
      const bracket = row.brackets[index];
      if (!record(bracket)) { errors.push(`${status}: bracket ${index + 1} must be an object`); continue; }
      if (bracket.rate_bps !== [1000, 1200, 2200, 2400, 3200, 3500, 3700][index]) errors.push(`${status}: unexpected bracket rate`);
      if (index === 6 ? bracket.up_to !== null : !money(bracket.up_to, true) || bracket.up_to <= previous) errors.push(`${status}: invalid bracket bounds`);
      if (money(bracket.up_to, true)) previous = bracket.up_to;
    }
  }
  const payroll = record(data.payroll) ? data.payroll : {};
  if (!record(data.payroll)) errors.push('Payroll data must be an object');
  for (const key of ['social_security', 'medicare', 'additional_medicare']) {
    const row = payroll[key];if (!record(row)) { errors.push(`Missing or invalid payroll record ${key}`); continue; }
    metadata(row, key);
    if (!Number.isSafeInteger(row.rate_bps) || row.rate_bps <= 0 || row.rate_bps >= 10000) errors.push(`${key}: invalid rate`);
  }
  if (!record(payroll.social_security) || !money(payroll.social_security.wage_base, true)) errors.push('Invalid Social Security cap');
  const thresholds = record(payroll.additional_medicare) && record(payroll.additional_medicare.thresholds) ? payroll.additional_medicare.thresholds : {};
  if (!record(payroll.additional_medicare) || !record(payroll.additional_medicare.thresholds)) errors.push('Additional Medicare thresholds must be an object');
  for (const status of statuses) if (!money(thresholds[status], true)) errors.push(`Invalid Medicare threshold ${status}`);
  for (const status of Object.keys(thresholds)) if (!statuses.includes(status)) errors.push(`Unsupported Medicare threshold status ${status}`);
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let data;
  try { data = JSON.parse(readFileSync('src/data/us/2026/federal.json', 'utf8')); }
  catch { console.error('Federal data could not be read or parsed as JSON.'); process.exit(1); }
  const errors = validateFederalData(data);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('Federal data passed: filing statuses, bracket structure, rates and source provenance.');
}
