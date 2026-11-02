import rules from '../../data/ae/gratuity-2026.json';

export const gratuityRules = rules;
// Product input limits, not statutory maxima.
export const MAX_MONTHLY_WAGE = 10_000_000;
export const MAX_SERVICE_DAYS = 36_500;
export interface UaeGratuityInput {
  monthlyBasicWage: number;
  /** Confirmed continuous calendar-service days; this engine does not infer date inclusivity. */
  serviceDays: number;
  unpaidAbsenceDays?: number;
}
const denominator = rules.month_days * rules.year_days;
const roundFils = (numerator: number) => Number((BigInt(numerator) * 2n + BigInt(denominator)) / (2n * BigInt(denominator))) / 100;

export function estimateUaeGratuity(input: UaeGratuityInput) {
  if (!input || typeof input !== 'object') throw new RangeError('Enter the supported gratuity inputs.');
  const { monthlyBasicWage, serviceDays } = input;
  const unpaidAbsenceDays = input.unpaidAbsenceDays === undefined ? 0 : input.unpaidAbsenceDays;
  if (typeof monthlyBasicWage !== 'number') throw new RangeError('Enter a numeric monthly basic wage.');
  const wageCents = Math.round(monthlyBasicWage * 100);
  if (!Number.isFinite(monthlyBasicWage) || monthlyBasicWage <= 0 || monthlyBasicWage > MAX_MONTHLY_WAGE || Math.abs(monthlyBasicWage * 100 - wageCents) > 0.0001) {
    throw new RangeError('Enter a positive monthly basic wage up to AED 10,000,000 with no more than two decimal places.');
  }
  if (!Number.isSafeInteger(serviceDays) || serviceDays < 0 || serviceDays > MAX_SERVICE_DAYS || !Number.isSafeInteger(unpaidAbsenceDays) || unpaidAbsenceDays < 0 || unpaidAbsenceDays > serviceDays) {
    throw new RangeError('Enter whole service days from 0 to 36,500 and unpaid absence days no greater than service days.');
  }
  const countedServiceDays = serviceDays - unpaidAbsenceDays;
  const eligible = countedServiceDays >= rules.minimum_service_days;
  const firstDays = Math.min(countedServiceDays, rules.first_band_years * rules.year_days);
  const laterDays = Math.max(0, countedServiceDays - firstDays);
  const firstNumerator = eligible ? wageCents * rules.first_band_days_per_year * firstDays : 0;
  const laterNumerator = eligible ? wageCents * rules.later_band_days_per_year * laterDays : 0;
  const numerator = firstNumerator + laterNumerator;
  if (numerator > wageCents * rules.cap_review_boundary_months_basic * denominator) {
    throw new RangeError('Cap-affected service is outside this beta estimate. Official cap wording needs human review; no estimate is available.');
  }
  return {
    eligible, countedServiceDays, serviceYears: countedServiceDays / rules.year_days,
    dailyBasicWage: monthlyBasicWage / rules.month_days,
    firstFiveYears: firstDays / rules.year_days, laterYears: laterDays / rules.year_days,
    firstBandAmount: roundFils(firstNumerator), laterBandAmount: roundFils(laterNumerator),
    uncappedGratuity: roundFils(numerator), gratuity: roundFils(numerator),
  };
}
