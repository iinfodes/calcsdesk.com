import { describe, expect, it } from 'vitest';
import { employeePayroll, estimateFederal, federalRates, parseWages, regularTax, type FilingStatus } from './federal';
import { validateFederalData } from '../../../scripts/validate-data.mjs';

// Independent expected values transcribed from IRS Rev. Proc. 2025-32 §4.01.
// These are published tax-schedule checkpoints, not claimed IRS narrative examples.
const scheduleFixtures: { status: FilingStatus; points: [number, number][] }[] = [
  { status: 'single', points: [[12400, 1240], [50400, 5800], [105700, 17966], [201775, 41024], [256225, 58448], [640600, 192979.25]] },
  { status: 'married_joint', points: [[24800, 2480], [100800, 11600], [211400, 35932], [403550, 82048], [512450, 116896], [768700, 206583.50]] },
  { status: 'married_separate', points: [[12400, 1240], [50400, 5800], [105700, 17966], [201775, 41024], [256225, 58448], [384350, 103291.75]] },
  { status: 'head_household', points: [[17700, 1770], [67450, 7740], [105700, 16155], [201750, 39207], [256200, 56631], [640600, 191171]] },
  { status: 'surviving_spouse', points: [[24800, 2480], [100800, 11600], [211400, 35932], [403550, 82048], [512450, 116896], [768700, 206583.50]] },
];

describe('2026 regular federal tax — official schedule cross-checks', () => {
  for (const fixture of scheduleFixtures) {
    for (const [income, expected] of fixture.points) {
      it(`${fixture.status}: published base tax at taxable income ${income}`, () => {
        expect(regularTax(income, fixture.status).tax).toBe(expected);
      });
    }
  }
  it('uses the top bracket above the last threshold', () => expect(regularTax(641600, 'single').tax).toBe(193349.25));
  it('is continuous around each bracket boundary', () => {
    for (const { status, points } of scheduleFixtures) for (const [boundary, expected] of points) {
      const below = regularTax(boundary - 1, status).tax;
      const above = regularTax(boundary + 1, status).tax;
      expect(below).toBeLessThanOrEqual(expected);
      expect(above).toBeGreaterThanOrEqual(expected);
      expect(above - below).toBeLessThan(0.75);
    }
  });
  it('reproduces the IRS worksheet multiplication method for an interior income', () => {
    // IRS Pub 505 Worksheet 1-4: single, 50,400–105,700 => 22% minus 5,288.
    expect(regularTax(58899.99, 'single').tax).toBe(7670);
  });
});

describe('employee Social Security and Medicare', () => {
  it('caps Social Security at the 2026 SSA maximum', () => {
    expect(employeePayroll([184500], 'single').socialSecurity).toBe(11439);
    expect(employeePayroll([300000], 'single').socialSecurity).toBe(11439);
  });
  it('applies the wage cap per spouse, not once per household', () => {
    const result = employeePayroll([200000, 100000], 'married_joint');
    expect(result.socialSecurity).toBe(17639);
    expect(result.medicare).toBe(4350);
    expect(result.additionalMedicare).toBe(450);
  });
  it('reproduces the wage component of IRS Additional Medicare FAQ example 3', () => {
    // 175,000 wage income, married separate: wage excess 50,000; excludes example's SE income.
    expect(employeePayroll([175000], 'married_separate').additionalMedicare).toBe(450);
  });
  it('reproduces the wage component of IRS Additional Medicare FAQ example 4', () => {
    // 225,000 wage income, head of household: wage excess 25,000; excludes example's SE income.
    expect(employeePayroll([225000], 'head_household').additionalMedicare).toBe(225);
  });
  it('distinguishes surviving-spouse Medicare threshold from joint income-tax brackets', () => {
    expect(employeePayroll([225000], 'surviving_spouse').additionalMedicare).toBe(225);
    expect(employeePayroll([225000, 0], 'married_joint').additionalMedicare).toBe(0);
  });
  it('treats annual liability separately from the employer withholding threshold', () => {
    expect(employeePayroll([200000], 'married_separate').additionalMedicare).toBe(675);
    expect(employeePayroll([220000, 0], 'married_joint').additionalMedicare).toBe(0);
  });
  it('rejects unsupported earner arrangements', () => {
    expect(() => employeePayroll([100, 100], 'single')).toThrow();
    expect(() => employeePayroll([], 'single')).toThrow();
  });
});

describe('wage-only estimate and validation', () => {
  it.each([['single', 16100], ['married_joint', 32200], ['married_separate', 16100], ['head_household', 24150], ['surviving_spouse', 32200]] as const)('uses the official %s basic deduction', (status, deduction) => {
    expect(estimateFederal({ status, wages: 100000 }).standardDeduction).toBe(deduction);
  });
  it('calculates the published-site single wage illustration', () => {
    const result = estimateFederal({ status: 'single', wages: 75000 });
    expect(result.taxableIncome).toBe(58900);
    expect(result.incomeTax).toBe(7670);
    expect(result.payroll.total).toBe(5737.50);
    expect(result.totalFederal).toBe(13407.50);
    expect(result.federalOnlyRemainder).toBe(61592.50);
  });
  it('calculates the joint wage illustration', () => {
    const result = estimateFederal({ status: 'married_joint', wages: 90000, spouseWages: 60000 });
    expect(result.taxableIncome).toBe(117800);
    expect(result.incomeTax).toBe(15340);
    expect(result.payroll.total).toBe(11475);
    expect(result.totalFederal).toBe(26815);
  });
  it('clamps taxable income and effective rates safely at zero wages', () => {
    const result = estimateFederal({ status: 'single', wages: 0 });
    expect(result.incomeTax).toBe(0);expect(result.effectiveRate).toBe(0);expect(result.totalFederal).toBe(0);
  });
  it('does not remove employee payroll taxes with the standard deduction', () => {
    const result = estimateFederal({ status: 'single', wages: 10000 });
    expect(result.incomeTax).toBe(0);expect(result.payroll.total).toBe(765);
  });
  it.each([-1, NaN, Infinity, 10_000_001, 1.001])('rejects invalid input %s', wages => {
    expect(() => estimateFederal({ status: 'single', wages })).toThrow();
  });
  it('rejects unsupported status and non-joint spouse wages', () => {
    expect(() => estimateFederal({ status: 'unknown' as FilingStatus, wages: 100 })).toThrow();
    expect(() => estimateFederal({ status: 'single', wages: 100, spouseWages: 100 })).toThrow();
  });
  it('accepts cents and correctly grouped display values', () => {
    expect(parseWages('75,000.25')).toBe(75000.25);expect(parseWages('0')).toBe(0);
  });
  it.each(['', '1,2', '-10', '1e6', 'NaN', '99.999', '50000000'])('rejects malformed text %s', value => expect(parseWages(value)).toBeNull());
});

describe('source-data validator', () => {
  it('accepts source-checked data', () => expect(validateFederalData(federalRates)).toEqual([]));
  it('rejects missing provenance', () => {
    const data = structuredClone(federalRates);Reflect.deleteProperty(data.filing_statuses[0], 'verified_on');
    expect(validateFederalData(data).length).toBeGreaterThan(0);
  });
  it('rejects malformed brackets, sources and dates', () => {
    const data = structuredClone(federalRates);
    data.filing_statuses[0].brackets[0].up_to = -1;
    data.filing_statuses[0].source_url = 'https://example.com/rates';
    data.filing_statuses[0].verified_on = '2026-02-30';
    expect(validateFederalData(data).length).toBeGreaterThanOrEqual(3);
  });
  it('rejects missing payroll thresholds', () => {
    const data = structuredClone(federalRates);Reflect.deleteProperty(data.payroll.additional_medicare.thresholds, 'surviving_spouse');
    expect(validateFederalData(data).length).toBeGreaterThan(0);
  });
});
