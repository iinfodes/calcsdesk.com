import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import au from '../src/data/au/2026-27/income-tax.json';
import ae from '../src/data/ae/gratuity-2026.json';
import { validateAustralianIncomeTaxData as validateAu, validateUaeGratuityData as validateAe } from './validate-country-data.mjs';

beforeEach(() => { vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-02T12:00:00Z')); });
afterEach(() => vi.useRealTimers());
const invalid = (validate: (data: unknown) => string[], data: unknown) => {
  expect(() => validate(data)).not.toThrow();expect(validate(data).length).toBeGreaterThan(0);
};

describe.each([{ name: 'Australian', validate: validateAu, data: au }, { name: 'UAE', validate: validateAe, data: ae }])('$name provenance', ({ validate, data }) => {
  it('accepts current documented data', () => expect(validate(data)).toEqual([]));
  it.each<unknown>([null, undefined, false, 2026, 'data', [], new Date()])('diagnoses malformed root %s without throwing', value => invalid(validate, value));
  it.each(['source_url', 'source_title', 'verified_by', 'notes', 'scope'])('requires nonempty metadata %s', key => {
    const changed = structuredClone(data);Reflect.set(changed, key, ' ');invalid(validate, changed);
  });
  it.each(['https://u.ae.evil.example/a', 'https://www.legislation.gov.au.evil.example/a', 'http://u.ae/a', 'https://user:pass@u.ae/a', 'https://u.ae:8443/a'])('rejects unapproved or credentialed source %s', url => {
    const changed = structuredClone(data);changed.source_url = url;invalid(validate, changed);
  });
  it.each<unknown>([null, '2026-02-30', '2026-2-01', {}, { toString: null }])('rejects invalid verification date %s without coercion', value => {
    const changed = structuredClone(data);Reflect.set(changed, 'verified_on', value);invalid(validate, changed);
  });
  it('rejects future verification and reversed coverage', () => {
    const changed = structuredClone(data);changed.verified_on = '2026-11-03';invalid(validate, changed);
    changed.verified_on = data.verified_on;changed.effective_from = '2028-01-01';Reflect.set(changed, 'effective_to', '2027-01-01');invalid(validate, changed);
  });
  it('uses the owner timezone at the verification-day boundary', () => {
    vi.setSystemTime(new Date('2026-11-01T18:29:59Z'));expect(validate(data).some(error => error.includes('future'))).toBe(true);
    vi.setSystemTime(new Date('2026-11-01T18:30:00Z'));expect(validate(data)).toEqual([]);
  });
});

describe('Australian schedule semantics and release scope', () => {
  it.each<unknown>([null, {}, 'bands', []])('rejects malformed bands %s', value => { const data = structuredClone(au);Reflect.set(data, 'brackets', value);invalid(validateAu, data); });
  it('does not skip sparse or null bands', () => {
    const data = structuredClone(au);Reflect.deleteProperty(data.brackets, '2');invalid(validateAu, data);
    Reflect.set(data.brackets, '2', null);invalid(validateAu, data);
  });
  it('rejects overlapping bounds, early unlimited band and bounded final band', () => {
    const data = structuredClone(au);data.brackets[1].up_to = 18200;invalid(validateAu, data);
    data.brackets[1].up_to = null;invalid(validateAu, data);
    data.brackets[1].up_to = 45000;data.brackets[4].up_to = 1000000;invalid(validateAu, data);
  });
  it.each([NaN, Infinity, 10000, -1, 1500.1])('rejects invalid basis points %s', rate => {
    const data = structuredClone(au);data.brackets[1].rate_bps = rate;invalid(validateAu, data);
  });
  it('rejects a disappearing tax-free band or declining marginal rate', () => {
    const data = structuredClone(au);data.brackets[0].rate_bps = 1;invalid(validateAu, data);
    data.brackets[0].rate_bps = 0;data.brackets[3].rate_bps = 2000;invalid(validateAu, data);
  });
  it('allows structurally valid rate changes without claiming source verification', () => {
    const data = structuredClone(au);data.brackets[1].rate_bps = 1600;expect(validateAu(data)).toEqual([]);
  });
  it('rejects shortened tax-year coverage and null expiry', () => {
    const data = structuredClone(au);data.effective_to = '2027-06-29';invalid(validateAu, data);
    Reflect.set(data, 'effective_to', null);invalid(validateAu, data);
  });
  it('blocks a review-status promotion without implementing a new release gate', () => {
    const data = structuredClone(au);data.review_status = 'verified';invalid(validateAu, data);
  });
});

describe('UAE rule and pending-review semantics', () => {
  it('accepts truthful open-ended coverage', () => expect(validateAe(ae)).toEqual([]));
  it.each(['year_days', 'month_days', 'minimum_service_days', 'first_band_years', 'first_band_days_per_year', 'later_band_days_per_year'])('rejects incompatible engine rule %s', key => {
    const data = structuredClone(ae);Reflect.set(data, key, 360);invalid(validateAe, data);
  });
  it('blocks removal of narrow cap treatment and excluded regimes', () => {
    const data = structuredClone(ae);data.cap_review_boundary_months_basic = 30;invalid(validateAe, data);
    data.cap_review_boundary_months_basic = 24;data.excluded = data.excluded.filter(value => value !== 'DIFC');invalid(validateAe, data);
  });
  it('does not silently skip a sparse exclusion entry', () => {
    const data = structuredClone(ae);data.excluded.length += 1;invalid(validateAe, data);
  });
  it.each<unknown>([null, [], { required: 2, verified: 2, status: 'verified' }, { required: 2, verified: 0, status: 'complete' }])('blocks unsupported official-example promotion %s', value => {
    const data = structuredClone(ae);Reflect.set(data, 'official_worked_examples', value);invalid(validateAe, data);
  });
  it('rejects null, sparse, duplicate and unofficial source rows', () => {
    const data = structuredClone(ae);Reflect.set(data.sources, '0', null);invalid(validateAe, data);
    Reflect.deleteProperty(data.sources, '0');invalid(validateAe, data);
    data.sources[0] = structuredClone(data.sources[1]);invalid(validateAe, data);
    data.sources[0].url = 'https://example.com/';invalid(validateAe, data);
  });
  it('rejects a root source missing from the actual supporting records', () => {
    const data = structuredClone(ae);data.source_url = 'https://u.ae/unlisted';invalid(validateAe, data);
  });
  it('rejects a fabricated review promotion even when examples are still zero', () => {
    const data = structuredClone(ae);data.review_status = 'officially-verified';invalid(validateAe, data);
  });
});
