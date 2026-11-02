import rawRates from '../../data/us/2026/federal.json';

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_household' | 'surviving_spouse';
export const federalRates = rawRates;
export const MAX_WAGES = 10_000_000;
const cents = (value: number) => Math.round(value * 100);
const dollars = (value: number) => value / 100;
const applyRate = (amountCents: number, rateBps: number) => Math.round(amountCents * rateBps / 10000);

export function validateMoney(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > MAX_WAGES || Math.abs(value * 100 - Math.round(value * 100)) > 0.0001) {
    throw new RangeError(`Enter an amount from 0 to ${MAX_WAGES} with up to two decimal places.`);
  }
}

export function parseWages(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text.replaceAll(',', ''));
  try { validateMoney(amount); return amount; } catch { return null; }
}

export function statusRates(status: FilingStatus) {
  const result = federalRates.filing_statuses.find(row => row.id === status);
  if (!result) throw new RangeError('Choose a supported filing status.');
  return result;
}

export interface BandResult { from: number; to: number | null; rate: number; taxable: number; tax: number; }

export function regularTax(taxableIncome: number, status: FilingStatus) {
  validateMoney(taxableIncome);
  const taxableCents = cents(taxableIncome);
  let floor = 0;
  let marginalRate = 0;
  const bands: BandResult[] = statusRates(status).brackets.map(band => {
    const ceiling = band.up_to === null ? taxableCents : cents(band.up_to);
    const slice = Math.max(0, Math.min(taxableCents, ceiling) - floor);
    if (slice > 0) marginalRate = band.rate_bps / 10000;
    const row = { from: dollars(floor), to: band.up_to, rate: band.rate_bps / 10000, taxable: dollars(slice), tax: dollars(applyRate(slice, band.rate_bps)) };
    floor = ceiling;
    return row;
  });
  return { tax: dollars(bands.reduce((sum, band) => sum + cents(band.tax), 0)), marginalRate, bands };
}

export function employeePayroll(wages: number[], status: FilingStatus) {
  statusRates(status);
  if (wages.length < 1 || wages.length > 2 || (status !== 'married_joint' && wages.length !== 1)) throw new RangeError('Use one wage earner, or two for a joint return.');
  wages.forEach(validateMoney);
  const rates = federalRates.payroll;
  const grossCents = wages.reduce((sum, wage) => sum + cents(wage), 0);
  const socialSecurity = wages.reduce((sum, wage) => sum + applyRate(Math.min(cents(wage), cents(rates.social_security.wage_base)), rates.social_security.rate_bps), 0);
  const medicare = wages.reduce((sum, wage) => sum + applyRate(cents(wage), rates.medicare.rate_bps), 0);
  const threshold = rates.additional_medicare.thresholds[status];
  const additionalMedicare = applyRate(Math.max(0, grossCents - cents(threshold)), rates.additional_medicare.rate_bps);
  return { socialSecurity: dollars(socialSecurity), medicare: dollars(medicare), additionalMedicare: dollars(additionalMedicare), total: dollars(socialSecurity + medicare + additionalMedicare), additionalMedicareThreshold: threshold };
}

export interface FederalInput { status: FilingStatus; wages: number; spouseWages?: number; }

export function estimateFederal(input: FederalInput) {
  const rates = statusRates(input.status);
  validateMoney(input.wages);
  const spouseWages = input.spouseWages ?? 0;
  validateMoney(spouseWages);
  if (input.status !== 'married_joint' && spouseWages !== 0) throw new RangeError('Spouse wages apply only to a joint return.');
  const grossCents = cents(input.wages) + (input.status === 'married_joint' ? cents(spouseWages) : 0);
  if (grossCents > cents(MAX_WAGES)) throw new RangeError('Combined wages exceed the supported input range.');
  const deductionCents = Math.min(grossCents, cents(rates.standard_deduction));
  const taxableIncome = dollars(grossCents - deductionCents);
  const regular = regularTax(taxableIncome, input.status);
  const payroll = employeePayroll(input.status === 'married_joint' ? [input.wages, spouseWages] : [input.wages], input.status);
  const totalCents = cents(regular.tax) + cents(payroll.total);
  return { grossWages: dollars(grossCents), standardDeduction: rates.standard_deduction, deductionUsed: dollars(deductionCents), taxableIncome, incomeTax: regular.tax, marginalRate: regular.marginalRate, effectiveRate: grossCents === 0 ? 0 : cents(regular.tax) / grossCents, bands: regular.bands, payroll, totalFederal: dollars(totalCents), federalOnlyRemainder: dollars(grossCents - totalCents) };
}
