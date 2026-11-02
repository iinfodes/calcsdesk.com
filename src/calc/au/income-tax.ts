import rawData from '../../data/au/2026-27/income-tax.json';

export const australianIncomeTaxData = rawData;
export const MAX_AU_TAXABLE_INCOME = 10_000_000;

/** A schedule component only: not annual tax payable, PAYG withholding or take-home pay. */
export function calculateAustralianIncomeTax(taxableIncome: number) {
  if (!Number.isFinite(taxableIncome) || taxableIncome < 0 || taxableIncome > MAX_AU_TAXABLE_INCOME || Math.abs(taxableIncome * 100 - Math.round(taxableIncome * 100)) > 0.0001) {
    throw new RangeError('Taxable income must be between 0 and 10,000,000 AUD, with at most two decimal places.');
  }
  const inputCents = Math.round(taxableIncome * 100);
  let lowerCents = 0;
  // Sum exact basis-point products before rounding the component once to cents.
  let taxNumerator = 0;
  const bands = australianIncomeTaxData.brackets.map(row => {
    const upperCents = row.up_to === null ? inputCents : row.up_to * 100;
    const amountCents = Math.max(0, Math.min(inputCents, upperCents) - lowerCents);
    const band = { from: lowerCents / 100, to: row.up_to, rate: row.rate_bps / 10000, taxable: amountCents / 100, tax: Math.round(amountCents * row.rate_bps / 10000) / 100 };
    taxNumerator += amountCents * row.rate_bps;
    if (row.up_to !== null) lowerCents = upperCents;
    return band;
  });
  return { taxableIncome, incomeTaxBeforeOffsetsAndLevies: Math.round(taxNumerator / 10000) / 100, bands };
}
