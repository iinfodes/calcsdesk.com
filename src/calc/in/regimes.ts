import rates from '../../data/in/2026-27/regimes.json';

export const indiaRegimeRates = rates;
export const MAX_ANNUAL_SALARY = rates.max_annual_salary;
export type IndiaRegime = 'old' | 'new';
export interface IndiaSalaryInput { annualSalary: number; oldRegimeDeductions?: number; }
export interface IndiaBand { from: number; to: number | null; rate: number; taxable: number; tax: number; }
export interface IndiaRegimeResult {
  regime: IndiaRegime; standardDeduction: number; additionalDeductions: number;
  taxableBeforeRounding: number; taxableIncome: number; slabTax: number;
  rebate: number; marginalRelief: number; taxAfterRelief: number; cess: number;
  totalBeforeRounding: number; totalTax: number; bands: IndiaBand[];
}

function validateAmount(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_ANNUAL_SALARY) throw new RangeError('Enter a whole-rupee amount from 0 to 50,00,000.');
}

export function parseIndiaSalaryAmount(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})$/.test(text)) return null;
  const amount = Number(text.replaceAll(',', ''));
  try { validateAmount(amount); return amount; } catch { return null; }
}

export function roundIndiaToTen(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('Rounding requires a finite non-negative amount.');
  // Section516: ignore paise, then round the whole-rupee amount to nearest₹10.
  return Math.floor((Math.floor(value) + 5) / 10) * 10;
}

function estimateRegime(annualSalary: number, additionalDeductions: number, regime: IndiaRegime): IndiaRegimeResult {
  const schedule = rates[regime];
  const standardDeduction = Math.min(annualSalary, schedule.standard_deduction);
  const taxableBeforeRounding = annualSalary - standardDeduction - additionalDeductions;
  const taxableIncome = roundIndiaToTen(taxableBeforeRounding);
  let floor = 0;
  let slabPaise = 0;
  const bands = schedule.brackets.map(band => {
    const ceiling = band.up_to === null ? taxableIncome : band.up_to;
    const taxable = Math.max(0, Math.min(taxableIncome, ceiling) - floor);
    const taxPaise = taxable * band.rate_bps / 100;
    slabPaise += taxPaise;
    const result = { from: floor, to: band.up_to, rate: band.rate_bps / 10000, taxable, tax: taxPaise / 100 };
    floor = ceiling;
    return result;
  });
  const rebatePaise = taxableIncome <= schedule.rebate_threshold ? Math.min(slabPaise, schedule.rebate_max * 100) : 0;
  const excessPaise = Math.max(0, taxableIncome - schedule.rebate_threshold) * 100;
  const marginalReliefPaise = schedule.rebate_marginal_relief && taxableIncome > schedule.rebate_threshold ? Math.max(0, slabPaise - excessPaise) : 0;
  const afterReliefPaise = slabPaise - rebatePaise - marginalReliefPaise;
  const cessPaise = Math.round(afterReliefPaise * rates.cess.rate_bps / 10000);
  const totalPaise = afterReliefPaise + cessPaise;
  // Total income is a multiple of₹10, so slab/rebate/cess arithmetic is exact in paise.
  const totalWholeRupees = Math.floor(totalPaise / 100);
  return {
    regime, standardDeduction, additionalDeductions, taxableBeforeRounding, taxableIncome,
    slabTax: slabPaise / 100, rebate: rebatePaise / 100, marginalRelief: marginalReliefPaise / 100,
    taxAfterRelief: afterReliefPaise / 100, cess: cessPaise / 100, totalBeforeRounding: totalPaise / 100,
    totalTax: roundIndiaToTen(totalWholeRupees), bands,
  };
}

export function estimateIndiaSalaryRegimes({ annualSalary, oldRegimeDeductions = 0 }: IndiaSalaryInput) {
  validateAmount(annualSalary); validateAmount(oldRegimeDeductions);
  const oldSalaryAfterStandard = Math.max(0, annualSalary - Math.min(annualSalary, rates.old.standard_deduction));
  if (oldRegimeDeductions > oldSalaryAfterStandard) throw new RangeError('Old-regime deductions cannot exceed salary remaining after its standard deduction.');
  const old = estimateRegime(annualSalary, oldRegimeDeductions, 'old');
  const next = estimateRegime(annualSalary, 0, 'new');
  const difference = old.totalTax - next.totalTax;
  const lowerTaxRegime: 'old' | 'new' | 'equal' = difference < 0 ? 'old' : difference > 0 ? 'new' : 'equal';
  return { annualSalary, oldRegimeDeductions, old, new: next, difference, lowerTaxRegime };
}
