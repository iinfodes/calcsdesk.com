import data from '../../data/us/2026/withholding.json';

/** Calculate a flat state amount, or use withholding already determined by payroll. */
export function calculateStateWithholding(rateBps: number | null, amount: number) {
  return rateBps === null ? amount : Math.round(Math.round(amount * 100) * rateBps / 10000) / 100;
}

interface WithholdingInputs {
  taxableWages: number;
  periods: 12 | 24 | 26 | 52 | 260;
  status: keyof typeof data.standard;
  step2?: boolean;
  credits?: number;
  otherIncome?: number;
  deductions?: number;
  extraPerPay?: number;
}

/** IRS Publication 15-T Worksheet 1A for regular wages and a 2020 or later W-4. */
export function calculateFederalWithholding({
  taxableWages, periods, status, step2 = false, credits = 0,
  otherIncome = 0, deductions = 0, extraPerPay = 0,
}: WithholdingInputs) {
  if (![12, 24, 26, 52, 260].includes(periods) || !Object.hasOwn(data.standard, status)) {
    throw new RangeError('Unsupported pay frequency or filing status.');
  }
  const amounts = [taxableWages, credits, otherIncome, deductions, extraPerPay];
  if (amounts.some(amount => !Number.isFinite(amount) || amount < 0 || amount > 10_000_000
    || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0001)) {
    throw new RangeError('Enter amounts from 0 to 10,000,000 with up to two decimal places.');
  }
  const { starts, adjustment, base } = (step2 ? data.step2 : data.standard)[status];
  const cents = (amount: number) => Math.round(amount * 100);
  const adjustedWages = Math.max(0, cents(taxableWages) * periods
    + cents(otherIncome) - cents(deductions) - cents(adjustment));
  const band = starts.findLastIndex(start => start * 100 <= adjustedWages);
  const annualTax = cents(base[band]) + (adjustedWages - starts[band] * 100) * data.rates_bps[band] / 10000;
  const perPay = Math.max(0, (annualTax - cents(credits)) / periods) + cents(extraPerPay);
  return Math.round(perPay) / 100;
}
