import { describe, expect, it } from 'vitest';
import { estimateIndiaSalaryRegimes, parseIndiaSalaryAmount, roundIndiaToTen } from './regimes';

describe('CalcsDesk arithmetic illustrations from current enacted rules (not official worked examples)', () => {
  it('shows the standard-deduction-only ₹12.75 lakh new-regime rebate case', () => {
    const result = estimateIndiaSalaryRegimes({ annualSalary: 1275000 });
    expect(result.new.standardDeduction).toBe(75000);
    expect(result.new.taxableIncome).toBe(1200000);
    expect(result.new.slabTax).toBe(60000);
    expect(result.new.rebate).toBe(60000);
    expect(result.new.totalTax).toBe(0);
    expect(result.old.totalTax).toBe(187200);
  });
  it('compares ₹15 lakh salary and ₹1.5 lakh already-eligible additional old deductions', () => {
    const result = estimateIndiaSalaryRegimes({ annualSalary: 1500000, oldRegimeDeductions: 150000 });
    expect(result.old.taxableIncome).toBe(1300000);
    expect(result.old.slabTax).toBe(202500);
    expect(result.old.cess).toBe(8100);
    expect(result.old.totalTax).toBe(210600);
    expect(result.new.taxableIncome).toBe(1425000);
    expect(result.new.slabTax).toBe(93750);
    expect(result.new.cess).toBe(3750);
    expect(result.new.totalTax).toBe(97500);
    expect(result.difference).toBe(113100);
    expect(result.lowerTaxRegime).toBe('new');
  });
  it('keeps new-regime calculations independent of old-only deductions', () => {
    const without = estimateIndiaSalaryRegimes({ annualSalary: 1500000 });
    const withOld = estimateIndiaSalaryRegimes({ annualSalary: 1500000, oldRegimeDeductions: 150000 });
    expect(without.old.totalTax).toBe(257400);
    expect(withOld.new).toEqual(without.new);
  });
  it('can report old regime lower without claiming deduction eligibility', () => {
    const result = estimateIndiaSalaryRegimes({ annualSalary: 1500000, oldRegimeDeductions: 700000 });
    expect(result.old.totalTax).toBe(65000);
    expect(result.new.totalTax).toBe(97500);
    expect(result.lowerTaxRegime).toBe('old');
  });
  it('reports equal modeled taxes rather than choosing a regime at zero', () => {
    const result = estimateIndiaSalaryRegimes({ annualSalary: 0 });
    expect(result.old.standardDeduction).toBe(0);
    expect(result.new.standardDeduction).toBe(0);
    expect(result.old.totalTax).toBe(0);
    expect(result.new.totalTax).toBe(0);
    expect(result.lowerTaxRegime).toBe('equal');
  });
});

describe('Section156 resident rebate and marginal-relief boundaries', () => {
  it.each([[550000,0],[550004,0],[550005,13000],[550010,13000]])('old salary %s produces tax %s with income rounding and no marginal rebate', (annualSalary, expected) => {
    expect(estimateIndiaSalaryRegimes({ annualSalary }).old.totalTax).toBe(expected);
  });
  it.each([[1275000,0],[1275004,0],[1275005,10],[1275010,10],[1300000,26000],[1345580,73400],[1345590,73410]])('new salary %s produces tax %s', (annualSalary, expected) => {
    expect(estimateIndiaSalaryRegimes({ annualSalary }).new.totalTax).toBe(expected);
  });
  it('applies new marginal relief BEFORE cess', () => {
    const result = estimateIndiaSalaryRegimes({ annualSalary: 1300000 }).new;
    expect(result.slabTax).toBe(63750);
    expect(result.rebate).toBe(0);
    expect(result.marginalRelief).toBe(38750);
    expect(result.taxAfterRelief).toBe(25000);
    expect(result.cess).toBe(1000);
  });
  it('ends marginal relief at the derived boundary without a hardcoded cutoff', () => {
    expect(estimateIndiaSalaryRegimes({ annualSalary: 1345580 }).new.marginalRelief).toBe(7);
    expect(estimateIndiaSalaryRegimes({ annualSalary: 1345590 }).new.marginalRelief).toBe(0);
  });
  it('caps deductions at low salary and never creates negative taxable income', () => {
    const result = estimateIndiaSalaryRegimes({ annualSalary: 10000 });
    expect(result.old.standardDeduction).toBe(10000);
    expect(result.new.standardDeduction).toBe(10000);
    expect(result.old.taxableIncome).toBe(0);
    expect(result.new.taxableIncome).toBe(0);
  });
});

describe('Section516 rounding and ordinary slab boundaries', () => {
  it.each([[0,0],[4.99,0],[5,10],[14.99,10],[15,20],[1200004.99,1200000],[1200005,1200010]])('rounds %s to %s after ignoring paise', (value, expected) => expect(roundIndiaToTen(value)).toBe(expected));
  for (const [income, expected] of [[400000,0],[800000,20000],[1200000,60000],[1600000,120000],[2000000,200000],[2400000,300000]] as const) {
    it(`new taxable boundary ₹${income} has slab tax ₹${expected} before rebate`, () => {
      expect(estimateIndiaSalaryRegimes({ annualSalary: income + 75000 }).new.slabTax).toBe(expected);
    });
  }
  it.each([[250000,0],[500000,12500],[1000000,112500]])('old taxable boundary %s has slab tax %s', (income, expected) => {
    expect(estimateIndiaSalaryRegimes({ annualSalary: income + 50000 }).old.slabTax).toBe(expected);
  });
  it('accepts the gross cap and computes without surcharge', () => {
    const result = estimateIndiaSalaryRegimes({ annualSalary: 5000000 });
    expect(result.new.taxableIncome).toBe(4925000);
    expect(result.new.totalTax).toBe(1099800);
    expect(result.old.taxableIncome).toBe(4950000);
  });
  it('reconciles bands, relief, cess and rounded totals across supported salaries', () => {
    for (let salary = 0; salary <= 5000000; salary += 12500) {
      const result = estimateIndiaSalaryRegimes({ annualSalary: salary });
      for (const item of [result.old, result.new]) {
        expect(item.bands.reduce((sum, band) => sum + band.taxable, 0)).toBe(item.taxableIncome);
        expect(item.bands.reduce((sum, band) => sum + band.tax, 0)).toBe(item.slabTax);
        expect(item.slabTax - item.rebate - item.marginalRelief).toBe(item.taxAfterRelief);
        expect(item.taxAfterRelief + item.cess).toBeCloseTo(item.totalBeforeRounding, 8);
        expect(item.totalTax % 10).toBe(0);
        expect(item.totalTax).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('Whole-rupee supported-case input validation', () => {
  it.each(['0','1500000','15,00,000','1,500,000',' 50,00,000 '])('accepts %s', value => expect(parseIndiaSalaryAmount(value)).not.toBeNull());
  it.each(['','-1','1.5','1e6','₹15,00,000','15,0,000','50,00,001','Infinity','NaN'])('rejects %s', value => expect(parseIndiaSalaryAmount(value)).toBeNull());
  it.each([NaN,Infinity,-1,0.5,5000001])('rejects invalid numeric salary %s', annualSalary => expect(() => estimateIndiaSalaryRegimes({ annualSalary })).toThrow());
  it('rejects excessive or non-integer deductions rather than silently applying them', () => {
    expect(() => estimateIndiaSalaryRegimes({ annualSalary: 100000, oldRegimeDeductions: 50001 })).toThrow();
    expect(() => estimateIndiaSalaryRegimes({ annualSalary: 100000, oldRegimeDeductions: 0.5 })).toThrow();
    expect(() => estimateIndiaSalaryRegimes({ annualSalary: 10000, oldRegimeDeductions: 1 })).toThrow();
  });
});
