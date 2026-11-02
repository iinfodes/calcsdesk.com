import { describe, expect, it } from 'vitest';
import { australianIncomeTaxData, calculateAustralianIncomeTax } from './income-tax';

describe('Australian 2026–27 ordinary resident schedule foundation', () => {
  it('matches the ASIC Moneysmart official 60,000 taxable-income illustration', () => {
    // https://moneysmart.gov.au/work-and-tax/income-tax (2026–27 illustration).
    const result = calculateAustralianIncomeTax(60_000);
    expect(result.incomeTaxBeforeOffsetsAndLevies).toBe(8_520);
    expect(result.bands.map(row => row.tax)).toEqual([0, 4_020, 4_500, 0, 0]);
  });
  it.each([
    [0, 0], [18_200, 0], [45_000, 4_020], [135_000, 31_020], [190_000, 51_370], [200_000, 55_870],
  ])('matches the published schedule checkpoint at %s (not a second full official example)', (income, tax) => {
    expect(calculateAustralianIncomeTax(income).incomeTaxBeforeOffsetsAndLevies).toBe(tax);
  });
  it.each([18_200, 45_000, 135_000, 190_000])('is continuous across the boundary at %s', boundary => {
    const before = calculateAustralianIncomeTax(boundary - 1).incomeTaxBeforeOffsetsAndLevies;
    const at = calculateAustralianIncomeTax(boundary).incomeTaxBeforeOffsetsAndLevies;
    const after = calculateAustralianIncomeTax(boundary + 1).incomeTaxBeforeOffsetsAndLevies;
    expect(at).toBeGreaterThanOrEqual(before);
    expect(after).toBeGreaterThanOrEqual(at);
    expect(after - before).toBeLessThanOrEqual(1);
  });
  it('accepts cents without turning the schedule component into a take-home quote', () => {
    expect(calculateAustralianIncomeTax(60_000.25).incomeTaxBeforeOffsetsAndLevies).toBe(8_520.08);
    expect(calculateAustralianIncomeTax(60_000)).not.toHaveProperty('takeHome');
    expect(calculateAustralianIncomeTax(60_000)).not.toHaveProperty('totalTax');
  });
  it.each([-1, NaN, Infinity, 10_000_001, 1.001])('rejects invalid taxable income %s', income => {
    expect(() => calculateAustralianIncomeTax(income)).toThrow(RangeError);
  });
  it('keeps the foundation, excluded components and human-review status explicit', () => {
    expect(australianIncomeTaxData.review_status).toBe('foundation-only-human-review-pending');
    expect(australianIncomeTaxData.notes).toContain('No public calculator route');
    expect(australianIncomeTaxData.effective_from).toBe('2026-07-01');
    expect(australianIncomeTaxData.effective_to).toBe('2027-06-30');
    expect(australianIncomeTaxData.source_url).toMatch(/^https:\/\/www\.legislation\.gov\.au\//);
  });
});
