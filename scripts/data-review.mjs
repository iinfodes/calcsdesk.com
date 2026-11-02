import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFederalData } from './validate-data.mjs';

const provenanceKeys = ['source_url', 'source_title', 'effective_from', 'effective_to', 'verified_on', 'verified_by', 'notes'];
const checklist = [
  'Open each listed official source and confirm the cited schedule, filing status, employee share and scope; a valid URL is not proof of source accuracy.',
  'Check every changed rate, threshold, cap and deduction against the official source; inspect unchanged values too.',
  'Confirm effective dates cover the modeled year, and retain the actual source-check date and truthful verifier identity. Never advance verified_on automatically.',
  'Review beta limitations and pending human review; obtain the required human review and suitable official worked examples before changing release claims.',
  'Run npm run verify and inspect calculator boundary/example results after any approved data change.',
  'Review visible rates, source notes, pending-rates messaging and the public update log before separately approving release. This report does not publish them.',
  'For the next tax year, update the validator, engine, routes and tests first; this workflow supports only 2026 and cannot promote next-year rates.',
];

function assertValid(data, label) {
  const errors = validateFederalData(data);
  if (errors.length) throw new Error(`${label} failed federal-data validation:\n${errors.join('\n')}`);
}

function canonical(data) {
  // Filing-status order is presentation order, not a rate change. Match by validated unique ID.
  return { ...data, filing_statuses: Object.fromEntries(data.filing_statuses.map(row => [row.id, row])) };
}
const pointer = value => value.replace(/~/g, '~0').replace(/\//g, '~1');
const ratePath = path => /^\/(?:tax_year|currency)$/.test(path) || /^\/filing_statuses\/[^/]+\/(?:standard_deduction$|brackets(?:\/|$))/.test(path) || /^\/payroll\/[^/]+\/(?:rate_bps$|wage_base$|thresholds(?:\/|$))/.test(path);
function diff(before, after, path = '', changes = []) {
  if (Object.is(before, after)) return changes;
  if (before !== null && after !== null && typeof before === 'object' && typeof after === 'object' && Array.isArray(before) === Array.isArray(after)) {
    for (const key of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) diff(before[key], after[key], `${path}/${pointer(key)}`, changes);
  } else changes.push({ path, kind: ratePath(path) ? 'rate' : 'metadata', before: before === undefined ? { missing: true } : before, after: after === undefined ? { missing: true } : after });
  return changes;
}
function snapshot(data) {
  const rows = [...data.filing_statuses.map(row => [`filing_statuses/${row.id}`, row]), ...Object.keys(data.payroll).sort().filter(key => data.payroll[key] && typeof data.payroll[key] === 'object').map(key => [`payroll/${key}`, data.payroll[key]])];
  return { tax_year: data.tax_year, currency: data.currency, review_status: data.review_status ?? '(not provided)', provenance: rows.sort(([a], [b]) => a.localeCompare(b, 'en')).map(([record, row]) => ({ record, ...Object.fromEntries(provenanceKeys.map(key => [key, row[key] ?? '(not provided)'])) })) };
}

/** Pure report generation: no source fetching, file mutation, promotion or verification-date updates. */
export function createDataReview(current, candidate) {
  assertValid(current, 'Current file');
  if (candidate !== undefined) assertValid(candidate, 'Candidate file');
  const changes = candidate === undefined ? [] : diff(canonical(current), canonical(candidate));
  return {
    scope: '2026 US wage-only federal beta; next-year rates unsupported until validator and engine are updated',
    decision: 'Manual source and human review pending; this report grants no release approval',
    comparison: candidate === undefined ? 'No candidate supplied' : changes.length ? 'Candidate differs' : 'No semantic or metadata changes',
    current: snapshot(current),
    ...(candidate === undefined ? {} : { candidate: snapshot(candidate) }),
    changes,
    checklist: [...checklist],
  };
}

export function renderDataReview(report) {
  const lines = ['Federal data source-review checklist', report.scope, report.decision, report.comparison];
  for (const label of ['current', 'candidate']) {
    const data = report[label];if (!data) continue;
    lines.push('', `${label.toUpperCase()}: ${data.tax_year} ${data.currency}`, `Review status: ${data.review_status}`);
    for (const row of data.provenance) { lines.push(`\n${row.record}`);for (const key of provenanceKeys) lines.push(`  ${key}: ${row[key]}`); }
  }
  lines.push('', 'CHANGES');
  if (!report.changes.length) lines.push('(none)');
  for (const change of report.changes) lines.push(`[${change.kind}] ${change.path}: ${JSON.stringify(change.before)} -> ${JSON.stringify(change.after)}`);
  lines.push('', 'MANUAL CHECKLIST', ...report.checklist.map(item => `[ ] ${item}`));
  return `${lines.join('\n')}\n`;
}

export function runDataReview(args, read = path => readFileSync(path, 'utf8')) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index], value = args[index + 1];
    if (!['--current', '--candidate', '--format'].includes(flag) || !value || value.startsWith('--') || Object.hasOwn(options, flag)) throw new Error('Usage: node scripts/data-review.mjs --current <2026 federal.json> [--candidate <candidate.json>] [--format text|json]');
    options[flag] = value;
  }
  if (!options['--current'] || (options['--format'] && !['text', 'json'].includes(options['--format']))) throw new Error('An explicit --current file and format text|json are required.');
  const parse = (path, label) => { try { return JSON.parse(read(path)); } catch { throw new Error(`${label} could not be read or parsed as JSON: ${path}`); } };
  const report = createDataReview(parse(options['--current'], 'Current file'), options['--candidate'] ? parse(options['--candidate'], 'Candidate file') : undefined);
  return options['--format'] === 'json' ? `${JSON.stringify(report, null, 2)}\n` : renderDataReview(report);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { process.stdout.write(runDataReview(process.argv.slice(2))); }
  catch (error) { console.error(error.message);process.exitCode = 1; }
}
