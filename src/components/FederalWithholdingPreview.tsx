import { useState } from 'preact/hooks';
import { calculateFederalWithholding, calculateStateWithholding } from '../calc/us/withholding';

const fields = [
  ['taxableWages', 'Federal taxable wages per paycheck'],
  ['credits', 'Annual credits from W-4 Step 3'],
  ['otherIncome', 'Annual other income from Step 4(a)'],
  ['deductions', 'Annual deductions from Step 4(b)'],
  ['extraPerPay', 'Extra withholding per paycheck from Step 4(c)'],
] as const;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function FederalWithholdingPreview({ region }: { region?: { name: string; rateBps: number | null } }) {
  const [amounts, setAmounts] = useState({ taxableWages: '2500', credits: '', otherIncome: '', deductions: '', extraPerPay: '' });
  const [status, setStatus] = useState<'single' | 'joint' | 'household'>('single');
  const [periods, setPeriods] = useState<12 | 24 | 26 | 52 | 260>(26);
  const [step2, setStep2] = useState(false);
  const [stateInput, setStateInput] = useState('');
  const invalid = (value: string) => !/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) > 10_000_000;
  const valid = fields.every(([key]) => (key !== 'taxableWages' && amounts[key] === '') || !invalid(amounts[key]));
  const withholding = valid ? calculateFederalWithholding({
    taxableWages: Number(amounts.taxableWages), periods, status, step2,
    credits: Number(amounts.credits), otherIncome: Number(amounts.otherIncome),
    deductions: Number(amounts.deductions), extraPerPay: Number(amounts.extraPerPay),
  }) : undefined;
  const stateWithholding = region?.rateBps === 0 ? 0 : region && !invalid(stateInput)
    ? calculateStateWithholding(region.rateBps, Number(stateInput))
    : undefined;
  return (
    <section aria-labelledby="withholding-inputs">
      <h2 id="withholding-inputs">Paycheck and W-4 inputs</h2>
      <p>Enter US dollar amounts up to 10 million with up to two decimal places. Leave unused W-4 amounts blank.</p>
      <p><label>Pay frequency <select value={periods} onChange={event => setPeriods(Number(event.currentTarget.value) as typeof periods)}>
        <option value={52}>Weekly</option><option value={26}>Every two weeks</option>
        <option value={24}>Twice a month</option><option value={12}>Monthly</option><option value={260}>Daily</option>
      </select></label></p>
      <p><label>W-4 filing status <select value={status} onChange={event => setStatus(event.currentTarget.value as typeof status)}>
        <option value="single">Single or married filing separately</option>
        <option value="joint">Married filing jointly</option><option value="household">Head of household</option>
      </select></label></p>
      <p><label><input type="checkbox" checked={step2} onChange={event => setStep2(event.currentTarget.checked)} /> W-4 Step 2(c) is checked</label></p>
      {fields.map(([key, label]) => <p key={key}><label>{label} <input type="text" inputMode="decimal"
        value={amounts[key]} aria-invalid={amounts[key] !== '' && invalid(amounts[key])}
        onInput={event => setAmounts({ ...amounts, [key]: event.currentTarget.value })} /></label></p>)}
      <p role="status">{withholding === undefined
        ? 'Enter valid amounts to see the estimate.'
        : `Estimated federal income tax withheld per paycheck: ${money.format(withholding)}`}</p>
      {region && <div>
        {region.rateBps !== 0 && <p><label>{region.name} {region.rateBps === null ? 'income tax withholding' : 'taxable wages'} per paycheck <input
          type="text" inputMode="decimal" value={stateInput}
          aria-invalid={stateInput !== '' && invalid(stateInput)}
          onInput={event => setStateInput(event.currentTarget.value)} /></label></p>}
        <div role="status">
          {stateWithholding !== undefined && <p>{region.name} income tax withholding per paycheck: {money.format(stateWithholding)}</p>}
          {withholding !== undefined && stateWithholding !== undefined && <p>Federal and state income tax withholding combined: {money.format(withholding + stateWithholding)}</p>}
        </div>
      </div>}
    </section>
  );
}
