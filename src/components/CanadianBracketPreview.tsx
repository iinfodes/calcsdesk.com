import { useState } from 'preact/hooks';
import { calculateBracketTax, calculateCanadianFederalTax, MAX_CA_TAXABLE_INCOME } from '../calc/ca/federal';
import { canadianRegions } from '../calc/ca/jurisdictions';

const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });

export default function CanadianBracketPreview({ fixedRegion }: { fixedRegion?: string }) {
  const [input, setInput] = useState('');
  const [name, setName] = useState('Alberta');
  const region = canadianRegions.find(item => item.name === (fixedRegion ?? name)) ?? canadianRegions[0];
  const amount = Number(input);
  const valid = /^\d+(?:\.\d{1,2})?$/.test(input) && amount <= MAX_CA_TAXABLE_INCOME;
  const federal = valid ? calculateCanadianFederalTax(amount) : undefined;
  const regional = valid ? calculateBracketTax(amount, region.brackets) : undefined;

  return (
    <section aria-labelledby="ca-preview-title">
      <h2 id="ca-preview-title">2026 bracket preview</h2>
      {!fixedRegion && <><p><label for="ca-region">Province or territory</label></p>
      <select id="ca-region" value={name} onChange={event => setName(event.currentTarget.value)}>
        {canadianRegions.map(item => <option key={item.name}>{item.name}</option>)}
      </select></>}
      <p><label for="ca-taxable-income">Ordinary taxable income (CAD)</label></p>
      <input id="ca-taxable-income" type="text" inputMode="decimal" value={input}
        onInput={event => setInput(event.currentTarget.value)} aria-describedby="ca-taxable-help"
        aria-invalid={input !== '' && !valid} />
      <p id="ca-taxable-help">Enter an amount from 0 to 10,000,000 with up to two decimal places.</p>
      <div role="status">
        {federal && regional ? (
          <dl>
            <dt>Federal bracket tax before adjustments</dt>
            <dd>{money.format(federal.federalBracketTaxBeforeCredits)}</dd>
            <dt>{region.name} bracket tax before adjustments</dt>
            <dd>{money.format(regional.tax)}</dd>
          </dl>
        ) : input !== '' ? <p>Enter a valid taxable income to calculate the two components.</p> : null}
      </div>
      <p><a href={region.source_url}>Official bracket schedule for {region.name}</a></p>
    </section>
  );
}
