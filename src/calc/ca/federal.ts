import rawData from '../../data/ca/2026/federal.json';

export const canadianFederalData = rawData;
export const MAX_CA_TAXABLE_INCOME = 10_000_000;
const roundedDollars = (numerator: number) => Number((BigInt(numerator) + 5000n) / 10000n) / 100;

/** Ordinary taxable-income schedule component only; no credits or provincial tax. */
export function calculateCanadianFederalTax(taxableIncome: number) {
  if (!Number.isFinite(taxableIncome) || taxableIncome < 0 || taxableIncome > MAX_CA_TAXABLE_INCOME || Math.abs(taxableIncome * 100 - Math.round(taxableIncome * 100)) > 0.0001) {
    throw new RangeError('Enter taxable income from 0 to 10,000,000 CAD with at most two decimal places.');
  }
  const incomeCents = Math.round(taxableIncome * 100);
  let lowerCents = 0;
  let numerator = 0;
  const bands = canadianFederalData.brackets.map(row => {
    const ceiling = row.up_to === null ? incomeCents : row.up_to * 100;
    const amountCents = Math.max(0, Math.min(incomeCents, ceiling) - lowerCents);
    const bandNumerator = amountCents * row.rate_bps;
    const band = { from: lowerCents / 100, to: row.up_to, rate: row.rate_bps / 10000, taxable: amountCents / 100, tax: roundedDollars(bandNumerator) };
    numerator += bandNumerator;
    if (row.up_to !== null) lowerCents = ceiling;
    return band;
  });
  return { taxableIncome, federalBracketTaxBeforeCredits: roundedDollars(numerator), bands };
}
