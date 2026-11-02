import { describe, expect, it } from 'vitest';
import { estimateUaeGratuity, gratuityRules, MAX_MONTHLY_WAGE, MAX_SERVICE_DAYS } from './gratuity';

const estimate = (serviceDays: number, monthlyBasicWage = 6000, unpaidAbsenceDays = 0) => estimateUaeGratuity({ serviceDays, monthlyBasicWage, unpaidAbsenceDays });

describe('UAE gratuity source-derived illustrations (not official worked examples)', () => {
  it('keeps official-example and human-review gates explicitly pending', () => {
    expect(gratuityRules.official_worked_examples.verified).toBe(0);
    expect(gratuityRules.review_status).toContain('pending');
    expect(gratuityRules.sources.every(source => /^(https:\/\/(?:assets\.)?u\.ae\/|https:\/\/mohre\.gov\.ae\/)/.test(source.url))).toBe(true);
  });
  it('does not award gratuity below one counted year, including zero service', () => {
    expect(estimate(0).gratuity).toBe(0);
    expect(estimate(364)).toMatchObject({ eligible: false, gratuity: 0 });
  });
  it('awards 21 basic-wage days at exactly one year', () => {
    expect(estimate(365)).toMatchObject({ eligible: true, dailyBasicWage: 200, gratuity: 4200 });
  });
  it('keeps exactly five years wholly in the first band', () => {
    expect(estimate(1825)).toMatchObject({ firstFiveYears: 5, laterYears: 0, firstBandAmount: 21000, laterBandAmount: 0, gratuity: 21000 });
  });
  it('applies the higher band only to years after the first five', () => {
    expect(estimate(2555)).toMatchObject({ firstBandAmount: 21000, laterBandAmount: 12000, gratuity: 33000 });
  });
  it('prorates partial service years using 365 and rounds once at the total', () => {
    expect(estimate(1826)).toMatchObject({ firstBandAmount: 21000, laterBandAmount: 16.44, gratuity: 21016.44 });
    expect(estimate(730, 7000).gratuity).toBe(9800);
  });
  it('excludes unpaid absence from eligibility and both accrual bands', () => {
    expect(estimate(365, 6000, 1)).toMatchObject({ countedServiceDays: 364, eligible: false, gratuity: 0 });
    expect(estimate(2000, 6000, 175).gratuity).toBe(estimate(1825).gratuity);
  });
  it('does not decide the disputed cap: boundary agrees, next day is unsupported', () => {
    expect(estimate(9307).gratuity).toBeLessThan(6000 * 24);
    expect(() => estimate(9308)).toThrow(/Cap-affected service/);
  });
  it('rejects even a small cap excess before currency rounding could hide it', () => {
    expect(() => estimate(9308, 0.01)).toThrow(/Cap-affected service/);
  });
  it('supports cent precision and the product wage bound without unsafe arithmetic', () => {
    expect(estimate(365, 0.01).gratuity).toBe(0.01);
    expect(estimate(365, MAX_MONTHLY_WAGE).gratuity).toBe(7_000_000);
  });
});

describe('UAE gratuity unsupported and malformed inputs', () => {
  it.each([NaN, Infinity, -1, 0, MAX_MONTHLY_WAGE + 0.01, 6000.001])('rejects invalid basic wage %s', wage => {
    expect(() => estimate(365, wage)).toThrow(RangeError);
  });
  it.each([NaN, Infinity, -1, 1.5, MAX_SERVICE_DAYS + 1])('rejects invalid service days %s', days => {
    expect(() => estimate(days)).toThrow(RangeError);
  });
  it.each([NaN, Infinity, -1, 0.5, 366])('rejects invalid unpaid absence %s', days => {
    expect(() => estimate(365, 6000, days)).toThrow(RangeError);
  });
  it('rejects null and incomplete runtime inputs', () => {
    expect(() => estimateUaeGratuity(null as never)).toThrow(RangeError);
    expect(() => estimateUaeGratuity({} as never)).toThrow(RangeError);
    expect(() => estimateUaeGratuity({ monthlyBasicWage: '6000', serviceDays: 365 } as never)).toThrow(RangeError);
  });
});
