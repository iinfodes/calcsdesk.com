import { describe, expect, it } from 'vitest';
import data from '../../data/in/2026-27/regimes.json';
import { validateIndiaRegimeData } from './validate';
describe('India current-year rules and source provenance', () => {
  it('accepts enacted current-year data', () => expect(validateIndiaRegimeData(data, '2026-11-02')).toEqual([]));
  it.each([null,[],2026,'rates'])('rejects malformed root: %s', value => expect(validateIndiaRegimeData(value).length).toBeGreaterThan(0));
  it('rejects prior-year new-regime slabs and deduction', () => {
    const copy = structuredClone(data); copy.new.brackets[0].up_to = 300000; copy.new.standard_deduction = 50000;
    expect(validateIndiaRegimeData(copy)).toHaveLength(2);
  });
  it('rejects swapping the rebate marginal-relief flags', () => {
    const copy = structuredClone(data); copy.old.rebate_marginal_relief = true; copy.new.rebate_marginal_relief = false;
    expect(validateIndiaRegimeData(copy)).toHaveLength(2);
  });
  it.each(['https://www.incometaxindia.gov.in.evil.test/rates','http://www.incometaxindia.gov.in/rates','https://user@www.incometaxindia.gov.in/rates','https://example.com/rates'])('rejects non-official source %s', source_url => {
    const copy = structuredClone(data); copy.old.source_url = source_url; expect(validateIndiaRegimeData(copy).length).toBeGreaterThan(0);
  });
  it.each(['2027-01-01','2026-02-30','invalid'])('rejects bad verification date %s', verified_on => {
    const copy = structuredClone(data); copy.cess.verified_on = verified_on; expect(validateIndiaRegimeData(copy, '2026-11-02').length).toBeGreaterThan(0);
  });
  it('rejects prior financial-year effective dates', () => {
    const copy = structuredClone(data); copy.new.effective_from = '2025-04-01'; expect(validateIndiaRegimeData(copy).length).toBeGreaterThan(0);
  });
  it('rejects absent cess and rounding provenance', () => {
    const copy: Record<string,unknown> = structuredClone(data); delete copy.cess; delete copy.rounding; expect(validateIndiaRegimeData(copy)).toHaveLength(2);
  });
  it('rejects changed cess, missing rupee rounding and unreviewed launch claims', () => {
    const copy = structuredClone(data); copy.cess.rate_bps = 300; copy.rounding.ignore_paise = false; copy.review_status = 'approved';
    expect(validateIndiaRegimeData(copy)).toHaveLength(3);
  });
});
