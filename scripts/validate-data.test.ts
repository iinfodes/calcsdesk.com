import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import federalData from '../src/data/us/2026/federal.json';
import { validateFederalData } from './validate-data.mjs';

const copy = () => structuredClone(federalData);
const invalid = (value: unknown, fragment?: string) => {
  expect(() => validateFederalData(value)).not.toThrow();
  const errors = validateFederalData(value);
  expect(errors.length).toBeGreaterThan(0);
  if (fragment) expect(errors.some(error => error.includes(fragment))).toBe(true);
};

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-02T12:00:00Z')); });
afterEach(() => vi.useRealTimers());

describe('untrusted federal-data structure', () => {
  it.each([null, undefined, false, true, 2026, '2026', [], new Date()])('returns diagnostics for a non-record root: %s', value => invalid(value, 'must be an object'));
  it.each([null, undefined, 1, 'statuses', {}])('rejects non-array filing_statuses without throwing: %s', value => {
    const data = copy();Reflect.set(data, 'filing_statuses', value);invalid(data, 'Expected five filing statuses');
  });
  it.each([null, undefined, false, 'single', []])('rejects malformed filing rows: %s', value => {
    const data = copy();Reflect.set(data.filing_statuses, '0', value);invalid(data, 'expected an object');
  });
  it('finds a sparse missing filing row', () => {
    const data = copy();Reflect.deleteProperty(data.filing_statuses, '2');invalid(data, 'expected an object');
  });
  it('rejects duplicate/unsupported IDs instead of silently dropping a status', () => {
    const data = copy();data.filing_statuses[0].id = 'unknown';invalid(data, 'unsupported filing status');
    data.filing_statuses[0] = structuredClone(data.filing_statuses[1]);invalid(data, 'Missing or duplicate status');
  });
  it('rejects missing display labels rather than producing an unnamed filing option', () => {
    const data = copy();data.filing_statuses[0].label = ' ';invalid(data, 'missing filing-status label');
  });
  it.each([null, 1, 'bands', {}])('rejects a non-array bracket container: %s', value => {
    const data = copy();Reflect.set(data.filing_statuses[0], 'brackets', value);invalid(data, 'expected seven brackets');
  });
  it.each([null, undefined, true, 'band', []])('rejects a malformed bracket entry: %s', value => {
    const data = copy();Reflect.set(data.filing_statuses[0].brackets, '1', value);invalid(data, 'must be an object');
  });
  it('finds a sparse missing bracket without skipping it', () => {
    const data = copy();Reflect.deleteProperty(data.filing_statuses[0].brackets, '3');invalid(data, 'must be an object');
  });
  it.each([null, [], 'payroll', false])('rejects an invalid payroll container: %s', value => {
    const data = copy();Reflect.set(data, 'payroll', value);invalid(data, 'Payroll data must be an object');
  });
  it.each(['social_security', 'medicare', 'additional_medicare'] as const)('rejects a null %s payroll record', key => {
    const data = copy();Reflect.set(data.payroll, key, null);invalid(data, 'Missing or invalid payroll record');
  });
  it.each([null, [], 'thresholds'])('rejects malformed Medicare threshold containers: %s', value => {
    const data = copy();Reflect.set(data.payroll.additional_medicare, 'thresholds', value);invalid(data, 'thresholds must be an object');
  });
});

describe('safe numeric and temporal integrity', () => {
  it.each<unknown>([null, '2026', {}, { toString: null }, Symbol('year')])('reports an invalid tax-year type without coercion: %s', value => {
    const data = copy();Reflect.set(data, 'tax_year', value);invalid(data, 'Unexpected tax year or currency');
  });
  it.each([NaN, Infinity, Number.MAX_SAFE_INTEGER, 16100.1, '16100'])('rejects an unsafe/incorrectly typed deduction: %s', value => {
    const data = copy();Reflect.set(data.filing_statuses[0], 'standard_deduction', value);invalid(data, 'invalid deduction');
  });
  it('rejects duplicated bracket ceilings and an early unbounded band', () => {
    const data = copy();data.filing_statuses[0].brackets[1].up_to = 12400;invalid(data, 'invalid bracket bounds');
    data.filing_statuses[0].brackets[1].up_to = null;invalid(data, 'invalid bracket bounds');
  });
  it('requires the final bracket to be explicitly unbounded', () => {
    const data = copy();data.filing_statuses[0].brackets[6].up_to = 999999;invalid(data, 'invalid bracket bounds');
  });
  it.each([0, -1, Infinity, Number.MAX_SAFE_INTEGER, '184500'])('rejects an unsafe Social Security cap: %s', value => {
    const data = copy();Reflect.set(data.payroll.social_security, 'wage_base', value);invalid(data, 'Invalid Social Security cap');
  });
  it('rejects an unknown threshold status and unsafe threshold values', () => {
    const data = copy();Reflect.set(data.payroll.additional_medicare.thresholds, 'future_status', 250000);invalid(data, 'Unsupported Medicare threshold status');
    Reflect.deleteProperty(data.payroll.additional_medicare.thresholds, 'future_status');
    data.payroll.additional_medicare.thresholds.single = Number.MAX_SAFE_INTEGER;invalid(data, 'Invalid Medicare threshold single');
  });
  it('rejects future verification dates on both income-tax and payroll records', () => {
    const data = copy();data.filing_statuses[0].verified_on = '2026-11-03';invalid(data, 'verified_on cannot be in the future');
    data.filing_statuses[0].verified_on = '2026-11-02';data.payroll.medicare.verified_on = '2026-11-03';invalid(data, 'verified_on cannot be in the future');
  });
  it('uses the owner timezone at the date boundary rather than the runner timezone', () => {
    vi.setSystemTime(new Date('2026-11-02T18:45:00Z')); // 3 November in Asia/Kolkata.
    const data = copy();data.payroll.medicare.verified_on = '2026-11-03';expect(validateFederalData(data)).toEqual([]);
  });
  it('allows checks before a rate takes effect, but requires coverage of the modeled year', () => {
    const data = copy();data.payroll.medicare.verified_on = '2025-12-01';expect(validateFederalData(data)).toEqual([]);
    data.payroll.medicare.effective_from = '2026-02-01';invalid(data, 'cover the modeled tax year');
  });
  it('rejects an incomplete effective end date and invalid calendar dates', () => {
    const data = copy();data.payroll.medicare.effective_to = '2026-11-30';invalid(data, 'cover the modeled tax year');
    data.payroll.medicare.effective_to = '2026-12-31';data.payroll.medicare.verified_on = '2026-04-31';invalid(data, 'invalid verified_on');
  });
});

describe('provenance URL boundaries', () => {
  it.each(['http://www.irs.gov/rates', 'https://www.irs.gov.example.org/rates', 'https://user:password@www.irs.gov/rates', 'https://www.irs.gov:444/rates', 'javascript:alert(1)'])('rejects a source outside the approved secure origin: %s', url => {
    const data = copy();data.filing_statuses[0].source_url = url;invalid(data, 'unapproved source');
  });
  it.each([null, 12, {}, []])('handles non-string source URLs without throwing: %s', value => {
    const data = copy();Reflect.set(data.filing_statuses[0], 'source_url', value);invalid(data, 'invalid source URL');
  });
  it('accepts the unchanged sourced records', () => expect(validateFederalData(federalData)).toEqual([]));
});
