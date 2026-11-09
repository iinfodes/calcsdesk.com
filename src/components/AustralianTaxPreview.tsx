import { useState } from 'preact/hooks';
import { calculateAustralianIncomeTax, MAX_AU_TAXABLE_INCOME } from '../calc/au/income-tax';

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

export default function AustralianTaxPreview() {
  const [input, setInput] = useState('75000');
  const amount = Number(input);
  const valid = /^\d+(?:\.\d{1,2})?$/.test(input) && amount <= MAX_AU_TAXABLE_INCOME;
  const result = valid ? calculateAustralianIncomeTax(amount) : undefined;

  return (
    <section aria-labelledby="au-estimate">
      <h2 id="au-estimate">Estimate annual bracket tax</h2>
      <label for="au-income">Annual taxable income (AUD)</label>
      <input id="au-income" type="text" inputMode="decimal" value={input}
        aria-describedby="au-income-help" aria-invalid={input !== '' && !valid}
        onInput={event => setInput(event.currentTarget.value)} />
      <p id="au-income-help">Enter 0 to 10,000,000, with up to two decimal places.</p>
      <p role="status">{result
        ? `Income tax before offsets and levies: ${money.format(result.incomeTaxBeforeOffsetsAndLevies)}`
        : 'Enter a valid taxable income to see the estimate.'}</p>
      {result && <dl>{result.bands.filter(band => band.taxable > 0).map(band => (
        <div key={band.from}><dt>{money.format(band.taxable)} at {band.rate * 100}%</dt><dd>{money.format(band.tax)}</dd></div>
      ))}</dl>}
    </section>
  );
}
