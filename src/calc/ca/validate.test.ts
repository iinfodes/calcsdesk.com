import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import data from '../../data/ca/2026/federal.json';
import { validateCanadianFederalData as validate } from './validate';
const copy = () => structuredClone(data);
const invalid = (value: unknown) => { expect(() => validate(value)).not.toThrow();expect(validate(value).length).toBeGreaterThan(0); };
beforeEach(() => { vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-02T12:00:00Z')); });
afterEach(() => vi.useRealTimers());

describe('Canadian federal source and release guard', () => {
  it('accepts the documented pending foundation', () => expect(validate(data)).toEqual([]));
  it.each<unknown>([null, false, 2026, 'data', [], { tax_year: { toString: null } }])('diagnoses malformed JSON value %s without throwing', invalid);
  it.each(['https://www.canada.ca.evil.example/en/revenue-agency/a', 'https://www.canada.ca/en/other/a', 'http://www.canada.ca/en/revenue-agency/a', 'https://u:p@www.canada.ca/en/revenue-agency/a'])('rejects misleading official source %s', value => {
    const changed = copy();changed.source_url = value;invalid(changed);
  });
  it.each(['scope', 'source_title', 'verified_by', 'notes', 'cross_check_url'])('rejects missing provenance %s', key => { const changed = copy();Reflect.set(changed, key, null);invalid(changed); });
  it('rejects missing/invalid dates, future verification and incomplete coverage', () => {
    for (const [key, value] of [['verified_on', '2026-11-03'], ['verified_on', '2026-02-30'], ['effective_to', null], ['effective_to', '2026-12-30'], ['effective_from', '2026-01-02']] as const) {
      const changed = copy();Reflect.set(changed, key, value);invalid(changed);
    }
  });
  it('handles owner-timezone verification midnight', () => {
    vi.setSystemTime(new Date('2026-11-01T18:29:59Z'));invalid(data);
    vi.setSystemTime(new Date('2026-11-01T18:30:00Z'));expect(validate(data)).toEqual([]);
  });
  it('rejects invented human or official-example completion', () => {
    const changed = copy();changed.review_status = 'verified';invalid(changed);
    changed.review_status = data.review_status;changed.official_worked_examples.verified = 2;invalid(changed);
  });
});

describe('Canadian schedule structural integrity', () => {
  it.each<unknown>([null, {}, [], 'bands'])('rejects malformed bracket container %s', value => { const changed = copy();Reflect.set(changed, 'brackets', value);invalid(changed); });
  it('does not skip sparse or null rows', () => {
    const changed = copy();Reflect.deleteProperty(changed.brackets, '1');invalid(changed);
    Reflect.set(changed.brackets, '1', null);invalid(changed);
  });
  it('rejects overlapping, unsafe and incorrectly terminated bands', () => {
    for (const value of [58523, null, Number.MAX_SAFE_INTEGER, 117045.1]) { const changed = copy();Reflect.set(changed.brackets[1], 'up_to', value);invalid(changed); }
    const changed = copy();changed.brackets[4].up_to = 999999;invalid(changed);
  });
  it.each([0, -1, 10000, 2050.1, NaN, Infinity])('rejects an invalid rate %s', rate => { const changed = copy();changed.brackets[1].rate_bps = rate;invalid(changed); });
  it('rejects declining marginal rates and a fake tax-free first band', () => {
    const changed = copy();changed.brackets[2].rate_bps = 1500;invalid(changed);
    changed.brackets[2].rate_bps = 2600;changed.brackets[0].rate_bps = 0;invalid(changed);
  });
  it('does not claim that structural validation independently verifies changed rates', () => {
    const changed = copy();changed.brackets[1].rate_bps = 2100;expect(validate(changed)).toEqual([]);
  });
});
