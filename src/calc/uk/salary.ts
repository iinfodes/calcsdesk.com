import rates from '../../data/uk/2026-27/salary.json';

export const ukSalaryRates = rates;
export const UK_NATIONS = ['england', 'wales', 'northern_ireland', 'scotland'] as const;
export type UkNation = typeof UK_NATIONS[number];
export const MAX_MONTHLY_PAY = 100_000;
const pence = (value: number) => Math.round(value * 100);
const pounds = (value: number) => value / 100;

function validateAmount(value: number, maximum: number) {
  if (!Number.isFinite(value) || value < 0 || value > maximum || Math.abs(value * 100 - pence(value)) > 0.00001) throw new RangeError('Use a non-negative amount with up to two decimal places within the supported range.');
}

export function parseMonthlyPay(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text.replaceAll(',', ''));
  try { validateAmount(amount, MAX_MONTHLY_PAY); return amount; } catch { return null; }
}

export function annualPersonalAllowance(annualIncome: number): number {
  validateAmount(annualIncome, MAX_MONTHLY_PAY * 12);
  const { amount, taper_start, taper_divisor } = rates.personal_allowance;
  // ITA 2007 s35(3): round the remaining allowance UP to a whole pound.
  const remainingHalfPence = pence(amount) * taper_divisor - Math.max(0, pence(annualIncome) - pence(taper_start));
  return Math.max(0, Math.ceil(remainingHalfPence / (100 * taper_divisor)));
}

export function annualSalaryIncomeTax(annualIncome: number, nation: UkNation) {
  validateAmount(annualIncome, MAX_MONTHLY_PAY * 12);
  if (!UK_NATIONS.includes(nation)) throw new RangeError('Choose a supported UK nation.');
  const allowance = annualPersonalAllowance(annualIncome);
  const taxablePence = Math.max(0, pence(annualIncome) - pence(allowance));
  const schedule = nation === 'scotland' ? rates.income_tax.scotland : rates.income_tax.rest_of_uk;
  let floor = 0;
  let totalNumerator = 0;
  const bands = schedule.brackets.map(band => {
    const ceiling = band.up_to === null ? taxablePence : pence(band.up_to);
    const slice = Math.max(0, Math.min(taxablePence, ceiling) - floor);
    const numerator = slice * band.rate_bps;
    totalNumerator += numerator;
    const result = { from: pounds(floor), to: band.up_to, taxable: pounds(slice), rate: band.rate_bps / 10000, tax: pounds(Math.round(numerator / 10000)) };
    floor = ceiling;
    return result;
  });
  return { allowance, taxableIncome: pounds(taxablePence), incomeTax: pounds(Math.round(totalNumerator / 10000)), bands };
}

export function employeeNationalInsurance(pay: number, period: 'monthly' | 'weekly' = 'monthly') {
  validateAmount(pay, MAX_MONTHLY_PAY);
  if (period !== 'monthly' && period !== 'weekly') throw new RangeError('Choose a monthly or weekly earnings period.');
  const thresholds = rates.employee_ni[period];
  const earnings = pence(pay);
  const lower = pence(thresholds.primary_threshold);
  const upper = pence(thresholds.upper_earnings_limit);
  const mainPence = Math.max(0, Math.min(earnings, upper) - lower);
  const upperPence = Math.max(0, earnings - upper);
  const numerator = mainPence * rates.employee_ni.main_rate_bps + upperPence * rates.employee_ni.upper_rate_bps;
  // Integer arithmetic keeps HMRC's exact-half-penny-rounds-down rule stable.
  return { mainEarnings: pounds(mainPence), upperEarnings: pounds(upperPence), amount: pounds(Math.floor((numerator + 4999) / 10000)) };
}

export function estimateUkMonthlySalary({ monthlyPay, nation }: { monthlyPay: number; nation: UkNation }) {
  validateAmount(monthlyPay, MAX_MONTHLY_PAY);
  const annualGross = pounds(pence(monthlyPay) * 12);
  const income = annualSalaryIncomeTax(annualGross, nation);
  const ni = employeeNationalInsurance(monthlyPay);
  const monthlyIncomeTaxAverage = pounds(Math.round(pence(income.incomeTax) / 12));
  const monthlyRemainder = pounds(pence(monthlyPay) - pence(monthlyIncomeTaxAverage) - pence(ni.amount));
  return { monthlyGross: monthlyPay, annualGross, ...income, monthlyIncomeTaxAverage, ni, annualNiProjection: pounds(pence(ni.amount) * 12), monthlyRemainder };
}
