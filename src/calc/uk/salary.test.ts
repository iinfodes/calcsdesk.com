import { describe, expect, it } from 'vitest';
import { annualPersonalAllowance, annualSalaryIncomeTax, employeeNationalInsurance, estimateUkMonthlySalary, parseMonthlyPay, UK_NATIONS, ukSalaryRates } from './salary';

describe('2026/27 official worked examples', () => {
  // HMRC Income Tax Liabilities supporting documentation, Tables 2a/2b.
  for (const nation of ['england', 'wales', 'northern_ireland'] as const) {
    it(`reproduces Table 2a's £60,000 salary-only example in ${nation}`, () => {
      const result = annualSalaryIncomeTax(60000, nation);
      expect(result.taxableIncome).toBe(47430);
      expect(result.bands.filter(band => band.taxable > 0).map(band => [band.taxable, band.tax])).toEqual([[37700, 7540], [9730, 3892]]);
      expect(result.incomeTax).toBe(11432);
    });
  }
  it('reproduces Table 2b Scotland, respecting HMRC whole-pound display rounding', () => {
    const result = annualSalaryIncomeTax(60000, 'scotland');
    expect(result.taxableIncome).toBe(47430);
    expect(result.bands.filter(band => band.taxable > 0).map(band => band.taxable)).toEqual([3967, 12989, 14136, 16338]);
    expect(Math.round(result.incomeTax)).toBe(13182);
    expect(result.incomeTax).toBe(13182.05);
  });
  it('reproduces GOV.UK category A £1,000 weekly NI example', () => {
    expect(employeeNationalInsurance(1000, 'weekly')).toEqual({ mainEarnings: 725, upperEarnings: 33, amount: 58.66 });
  });
});

describe('Personal Allowance taper and statutory rounding', () => {
  it.each([[0,12570],[100000,12570],[100000.01,12570],[100001,12570],[100002,12569],[110000,7570],[125138,1],[125139.99,1],[125140,0],[1200000,0]])('annual income %s has allowance %s', (income, expected) => {
    expect(annualPersonalAllowance(income)).toBe(expected);
  });
  it('taxes a £110,000 rest-of-UK salary with the reduced allowance', () => {
    const result = annualSalaryIncomeTax(110000, 'england');
    expect(result.taxableIncome).toBe(102430);
    expect(result.incomeTax).toBe(33432);
  });
  it('does not incorrectly add full allowance to the additional-rate limit', () => {
    expect(annualSalaryIncomeTax(125140, 'england').bands.at(-1)?.taxable).toBe(0);
    expect(annualSalaryIncomeTax(125141, 'england').bands.at(-1)?.taxable).toBe(1);
  });
  it('uses Scottish taxable band bounds when allowance tapers', () => {
    const result = annualSalaryIncomeTax(110000, 'scotland');
    expect(result.bands[4].taxable).toBe(40000);
    expect(result.incomeTax).toBe(37482.05);
  });
});

describe('NI earnings-period thresholds and rounding', () => {
  it.each([[0,0],[1048,0],[1048.01,0],[1048.07,0.01],[4189,251.28],[4189.25,251.28],[4189.26,251.29],[5000,267.5]])('monthly gross %s gives NI %s', (gross, expected) => {
    expect(employeeNationalInsurance(gross).amount).toBe(expected);
  });
  it('applies monthly thresholds each month rather than annual thresholds', () => {
    const result = estimateUkMonthlySalary({ monthlyPay: 1048, nation: 'england' });
    expect(result.annualGross).toBe(12576);
    expect(result.incomeTax).toBe(1.2);
    expect(result.annualNiProjection).toBe(0);
  });
  it('annual NI projection sums twelve separately rounded monthly charges', () => {
    const result = estimateUkMonthlySalary({ monthlyPay: 5000, nation: 'england' });
    expect(result.annualNiProjection).toBe(3210);
    expect(result.monthlyIncomeTaxAverage).toBe(952.67);
    expect(result.monthlyRemainder).toBe(3779.83);
    expect(result.monthlyGross - result.monthlyIncomeTaxAverage - result.ni.amount).toBeCloseTo(result.monthlyRemainder, 10);
  });
});

describe('Income Tax band boundaries and reconciliation', () => {
  for (const nation of UK_NATIONS) {
    it(`${nation} has no Income Tax below the allowance`, () => {
      expect(annualSalaryIncomeTax(12570, nation).incomeTax).toBe(0);
      expect(annualSalaryIncomeTax(0, nation).taxableIncome).toBe(0);
    });
  }
  for (const [nation, schedule] of [['england', ukSalaryRates.income_tax.rest_of_uk], ['scotland', ukSalaryRates.income_tax.scotland]] as const) {
    for (const [index, band] of schedule.brackets.entries()) {
      if (band.up_to === null || band.up_to > 80000) continue;
      it(`${nation} band ${index + 1} contains no next-band income at its boundary`, () => {
        const annual = band.up_to + 12570;
        const at = annualSalaryIncomeTax(annual, nation);
        const over = annualSalaryIncomeTax(annual + 1, nation);
        expect(at.bands[index + 1].taxable).toBe(0);
        expect(over.bands[index + 1].taxable).toBe(1);
        expect(over.incomeTax - at.incomeTax).toBeCloseTo(schedule.brackets[index + 1].rate_bps / 10000, 8);
      });
    }
    it(`${nation} reconciles taxable bands and tax across a salary sweep`, () => {
      for (const salary of [0, 12570, 16537, 29526, 43662, 50270, 75000, 100000, 100001, 110000, 125140, 200000, 1200000]) {
        const result = annualSalaryIncomeTax(salary, nation);
        expect(result.bands.reduce((sum, band) => sum + band.taxable, 0)).toBeCloseTo(result.taxableIncome, 8);
        expect(result.bands.reduce((sum, band) => sum + band.tax, 0)).toBeCloseTo(result.incomeTax, 8);
        expect(result.incomeTax).toBeGreaterThanOrEqual(0);
        expect(result.incomeTax).toBeLessThanOrEqual(salary);
      }
    });
  }
});

describe('Supported input validation', () => {
  it.each(['0','5,000.00',' 1234.56 ','100000'])('accepts monthly amount %s', value => expect(parseMonthlyPay(value)).not.toBeNull());
  it.each(['','-1','1e3','£5000','5,00','100000.01','1.001','Infinity','NaN','0x10'])('rejects monthly amount %s', value => expect(parseMonthlyPay(value)).toBeNull());
  it.each([NaN, Infinity, -1, 100000.01, 0.001])('rejects unsupported numeric pay %s', monthlyPay => expect(() => estimateUkMonthlySalary({ monthlyPay, nation: 'england' })).toThrow());
  it('rejects an unknown nation and earnings period at runtime', () => {
    expect(() => annualSalaryIncomeTax(60000, 'unknown' as never)).toThrow();
    expect(() => employeeNationalInsurance(1000, 'annual' as never)).toThrow();
  });
});
