import { describe, expect, it } from 'vitest';
import { calculateCanadianFederalTax, canadianFederalData, MAX_CA_TAXABLE_INCOME } from './federal';

describe('Canadian 2026 federal bracket foundation: locally calculated schedule checkpoints', () => {
  it.each([[0, 0], [58523, 8193.22], [117045, 20190.23], [181440, 36932.93], [258482, 59275.11], [300000, 72976.05]])('calculates the published bands at %s (not an official worked example)', (income, tax) => {
    expect(calculateCanadianFederalTax(income).federalBracketTaxBeforeCredits).toBe(tax);
  });
  it('splits income across bands rather than taxing all income at the highest rate', () => {
    const result = calculateCanadianFederalTax(60000);
    expect(result.federalBracketTaxBeforeCredits).toBe(8496.01);
    expect(result.bands.map(row => row.taxable)).toEqual([58523, 1477, 0, 0, 0]);
    expect(result.bands.reduce((sum, row) => sum + row.taxable, 0)).toBe(60000);
  });
  it.each([58523, 117045, 181440, 258482])('has continuous nondecreasing rounded tax at boundary %s', boundary => {
    const a = calculateCanadianFederalTax(boundary - 1).federalBracketTaxBeforeCredits;
    const b = calculateCanadianFederalTax(boundary).federalBracketTaxBeforeCredits;
    const c = calculateCanadianFederalTax(boundary + 1).federalBracketTaxBeforeCredits;
    expect(a).toBeLessThanOrEqual(b);expect(b).toBeLessThanOrEqual(c);expect(c - a).toBeLessThan(1);
  });
  it('handles cents at a half-cent rounding point without binary rounding down', () => {
    expect(calculateCanadianFederalTax(0.25).federalBracketTaxBeforeCredits).toBe(0.04);
    expect(calculateCanadianFederalTax(58523.01).federalBracketTaxBeforeCredits).toBe(8193.22);
  });
  it('handles the technical maximum and never emits negative unused bands', () => {
    const result = calculateCanadianFederalTax(MAX_CA_TAXABLE_INCOME);
    expect(result.federalBracketTaxBeforeCredits).toBe(3273976.05);
    expect(calculateCanadianFederalTax(1).bands.every(row => row.taxable >= 0 && row.tax >= 0)).toBe(true);
  });
  it.each([-1, NaN, Infinity, MAX_CA_TAXABLE_INCOME + 0.01, 1.001])('rejects invalid income %s', income => expect(() => calculateCanadianFederalTax(income)).toThrow(RangeError));
  it('does not present the component as net tax or take-home pay', () => {
    const result = calculateCanadianFederalTax(1000);
    expect(result.federalBracketTaxBeforeCredits).toBe(140);
    expect(result).not.toHaveProperty('netTax');expect(result).not.toHaveProperty('takeHome');expect(result).not.toHaveProperty('totalTax');
    expect(canadianFederalData.official_worked_examples.verified).toBe(0);
  });
});
