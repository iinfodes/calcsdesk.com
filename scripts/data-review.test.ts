import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import federal from '../src/data/us/2026/federal.json';
import { createDataReview, renderDataReview, runDataReview } from './data-review.mjs';

beforeEach(() => { vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-02T12:00:00Z')); });
afterEach(() => vi.useRealTimers());
const copy = () => structuredClone(federal);

describe('local source-review report', () => {
  it('is deterministic, exposes actual provenance and review status, and does not mutate inputs', () => {
    const current = copy();const before = JSON.stringify(current);const report = createDataReview(current);
    expect(createDataReview(current)).toEqual(report);expect(JSON.stringify(current)).toBe(before);
    expect(report.current.provenance).toHaveLength(8);expect(report.current.review_status).toBe(federal.review_status);
    expect(report.current.provenance[0]).toMatchObject({ effective_from: '2026-01-01', effective_to: '2026-12-31', verified_on: '2026-11-02' });
    expect(renderDataReview(report)).toContain('next-year rates unsupported');expect(renderDataReview(report)).toContain('[ ]');expect(report.comparison).toBe('No candidate supplied');
  });
  it('distinguishes rate changes from provenance and review metadata without promoting either', () => {
    const candidate = copy();candidate.filing_statuses[0].standard_deduction += 100;candidate.filing_statuses[0].brackets[0].up_to = 12500;
    candidate.payroll.social_security.wage_base += 100;candidate.payroll.additional_medicare.thresholds.single += 100;
    candidate.payroll.medicare.notes += ' Source review requested.';candidate.review_status = 'human-review-pending';
    const report = createDataReview(federal, candidate);
    expect(report.changes.filter(row => row.kind === 'rate').map(row => row.path)).toEqual(['/filing_statuses/single/brackets/0/up_to', '/filing_statuses/single/standard_deduction', '/payroll/additional_medicare/thresholds/single', '/payroll/social_security/wage_base']);
    expect(report.changes.filter(row => row.kind === 'metadata').map(row => row.path)).toEqual(['/payroll/medicare/notes', '/review_status']);
    expect(candidate.filing_statuses[0].verified_on).toBe('2026-11-02');expect(report.decision).toContain('no release approval');
  });
  it('matches statuses by identity instead of reporting array reorder as rate changes', () => {
    const candidate = copy();candidate.filing_statuses.reverse();expect(createDataReview(federal, candidate).changes).toEqual([]);
  });
  it('surfaces a missing review status instead of inventing completed review', () => {
    const candidate = copy();Reflect.deleteProperty(candidate, 'review_status');const report = createDataReview(federal, candidate);
    expect(report.candidate?.review_status).toBe('(not provided)');expect(report.changes).toContainEqual({ path: '/review_status', kind: 'metadata', before: federal.review_status, after: { missing: true } });
  });
  it('rejects malformed current data, invalid candidates and unsupported next-year changes', () => {
    expect(() => createDataReview(null)).toThrow('Current file failed');
    const bad = copy();bad.filing_statuses[0].brackets[0].rate_bps = 999;expect(() => createDataReview(federal, bad)).toThrow('Candidate file failed');
    const next = copy();next.tax_year = 2027;expect(() => createDataReview(federal, next)).toThrow('Unexpected tax year');
  });
  it('requires explicit paths, rejects ambiguous flags, and handles JSON read failures', () => {
    for (const args of [[], ['--candidate', 'b'], ['--current', 'a', '--current', 'b'], ['--current', 'a', '--format', 'xml'], ['--current']]) expect(() => runDataReview(args)).toThrow();
    expect(() => runDataReview(['--current', 'missing'], () => { throw Error('ENOENT'); })).toThrow('Current file could not be read');
    expect(() => runDataReview(['--current', 'bad'], () => '{')).toThrow('parsed as JSON');
  });
  it('reads only explicit local inputs and produces parseable JSON', () => {
    const reads: string[] = [];const candidate = copy();candidate.payroll.medicare.verified_by = 'Actual reviewer pending';
    const output = runDataReview(['--current', 'current.json', '--candidate', 'candidate.json', '--format', 'json'], path => { reads.push(path);return JSON.stringify(path === 'current.json' ? federal : candidate); });
    expect(reads).toEqual(['current.json', 'candidate.json']);expect(JSON.parse(output).changes[0].path).toBe('/payroll/medicare/verified_by');
  });
});
