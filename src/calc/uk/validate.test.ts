import { describe, expect, it } from 'vitest';
import source from '../../data/uk/2026-27/salary.json';
import { validateUkSalaryData } from './validate';

const clone = () => structuredClone(source);
describe('UK salary rate provenance and structure', () => {
  it('accepts the checked 2026/27 source data', () => expect(validateUkSalaryData(source, '2026-11-02')).toEqual([]));
  it.each([null, [], 'rates', 2026])('handles malformed root safely: %s', value => expect(validateUkSalaryData(value).length).toBeGreaterThan(0));
  it.each(['personal_allowance','income_tax','employee_ni'] as const)('rejects missing %s', field => {
    const data: Record<string, unknown> = clone(); delete data[field]; expect(validateUkSalaryData(data).length).toBeGreaterThan(0);
  });
  it.each(['http://www.gov.uk/rates','https://www.gov.uk.evil.test/rates','https://user@www.gov.uk/rates','https://www.gov.uk:4430/rates','https://example.com/rates'])('rejects unofficial source %s', source_url => {
    const data = clone(); data.employee_ni.source_url = source_url; expect(validateUkSalaryData(data).length).toBeGreaterThan(0);
  });
  it.each(['2027-01-01','2026-02-30','not-a-date'])('rejects invalid verification date %s', verified_on => {
    const data = clone(); data.personal_allowance.verified_on = verified_on; expect(validateUkSalaryData(data, '2026-11-02').length).toBeGreaterThan(0);
  });
  it('rejects dates that miss the UK tax-year boundaries', () => {
    const data = clone(); data.income_tax.scotland.effective_to = '2026-12-31'; expect(validateUkSalaryData(data).length).toBeGreaterThan(0);
  });
  it('rejects gross-income Scottish thresholds in a taxable-income schedule', () => {
    const data = clone(); data.income_tax.scotland.brackets[0].up_to = 16537; expect(validateUkSalaryData(data).length).toBeGreaterThan(0);
  });
  it('rejects annual NI thresholds substituted for monthly thresholds', () => {
    const data = clone(); data.employee_ni.monthly.primary_threshold = 12570; expect(validateUkSalaryData(data).length).toBeGreaterThan(0);
  });
  it('rejects missing reviewer and undocumented rounding', () => {
    const data = clone(); data.employee_ni.verified_by = ''; data.personal_allowance.rounding = ''; expect(validateUkSalaryData(data)).toHaveLength(2);
  });
});
