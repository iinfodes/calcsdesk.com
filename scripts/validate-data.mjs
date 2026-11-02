import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const statuses = ['single', 'married_joint', 'married_separate', 'head_household', 'surviving_spouse'];
const required = ['source_url', 'source_title', 'effective_from', 'effective_to', 'verified_on', 'verified_by', 'notes'];
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function validateFederalData(data) {
  const errors = [];
  const metadata = (record, label) => {
    for (const key of required) if (typeof record?.[key] !== 'string' || !record[key].trim()) errors.push(`${label}: missing ${key}`);
    try { const url = new URL(record.source_url); if (url.protocol !== 'https:' || !['www.irs.gov', 'www.ssa.gov'].includes(url.hostname)) errors.push(`${label}: unapproved source`); } catch { errors.push(`${label}: invalid source URL`); }
    for (const key of ['effective_from', 'effective_to', 'verified_on']) if (!validDate(record?.[key])) errors.push(`${label}: invalid ${key}`);
    if (record.effective_from > record.effective_to) errors.push(`${label}: reversed effective dates`);
  };
  if (!Number.isInteger(data.tax_year) || data.tax_year !== 2026 || data.currency !== 'USD') errors.push('Unexpected tax year or currency');
  if (!Array.isArray(data.filing_statuses) || data.filing_statuses.length !== statuses.length) errors.push('Expected five filing statuses');
  for (const status of statuses) {
    const rows = (data.filing_statuses || []).filter(row => row.id === status);
    if (rows.length !== 1) { errors.push(`Missing or duplicate status ${status}`); continue; }
    const row = rows[0];metadata(row, status);
    if (!Number.isInteger(row.standard_deduction) || row.standard_deduction < 0) errors.push(`${status}: invalid deduction`);
    if (!Array.isArray(row.brackets) || row.brackets.length !== 7) { errors.push(`${status}: expected seven brackets`); continue; }
    let previous = 0;
    row.brackets.forEach((bracket, index) => {
      if (bracket.rate_bps !== [1000, 1200, 2200, 2400, 3200, 3500, 3700][index]) errors.push(`${status}: unexpected bracket rate`);
      if (index === 6 ? bracket.up_to !== null : !Number.isInteger(bracket.up_to) || bracket.up_to <= previous) errors.push(`${status}: invalid bracket bounds`);
      previous = bracket.up_to;
    });
  }
  for (const key of ['social_security', 'medicare', 'additional_medicare']) {
    const row = data.payroll?.[key];if (!row) { errors.push(`Missing payroll record ${key}`); continue; }
    metadata(row, key);
    if (!Number.isInteger(row.rate_bps) || row.rate_bps <= 0 || row.rate_bps >= 10000) errors.push(`${key}: invalid rate`);
  }
  if (!Number.isInteger(data.payroll?.social_security?.wage_base) || data.payroll.social_security.wage_base <= 0) errors.push('Invalid Social Security cap');
  for (const status of statuses) if (!Number.isInteger(data.payroll?.additional_medicare?.thresholds?.[status]) || data.payroll.additional_medicare.thresholds[status] <= 0) errors.push(`Invalid Medicare threshold ${status}`);
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const data = JSON.parse(readFileSync('src/data/us/2026/federal.json', 'utf8'));
  const errors = validateFederalData(data);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('Federal data passed: filing statuses, bracket structure, rates and source provenance.');
}
