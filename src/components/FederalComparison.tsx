import { useState } from 'preact/hooks';
import { estimateFederal, federalRates, MAX_WAGES, parseWages, type FilingStatus } from '../calc/us/federal';

type Estimate = ReturnType<typeof estimateFederal>;
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const difference = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${money(Math.abs(value))}`;
const metrics: { label: string; value: (estimate: Estimate) => number }[] = [
  { label: 'Wage income', value: estimate => estimate.grossWages },
  { label: 'Regular federal income tax before credits', value: estimate => estimate.incomeTax },
  { label: 'Employee payroll taxes', value: estimate => estimate.payroll.total },
  { label: 'Modeled federal taxes', value: estimate => estimate.totalFederal },
  { label: 'Wages minus modeled taxes', value: estimate => estimate.federalOnlyRemainder },
];

export default function FederalComparison({ baseline, baselineStatus }: { baseline: Estimate | null; baselineStatus: FilingStatus }) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<FilingStatus>('single');
  const [wagesText, setWagesText] = useState('85000');
  const [spouseText, setSpouseText] = useState('0');
  const wages = parseWages(wagesText);
  const spouse = status === 'married_joint' ? parseWages(spouseText) : 0;
  const combinedInvalid = wages !== null && spouse !== null && Math.round(wages * 100) + Math.round(spouse * 100) > MAX_WAGES * 100;
  let scenario: Estimate | null = null;
  let error = '';
  if (wages === null || spouse === null) error = 'Enter valid annual dollar amounts from $0 to $10,000,000, with no more than two decimal places.';
  else if (combinedInvalid) error = 'Combined scenario B wages must be $10,000,000 or less.';
  else scenario = estimateFederal({ status, wages, spouseWages: spouse });
  const statusName = (value: FilingStatus) => federalRates.filing_statuses.find(item => item.id === value)!.label;
  return <section class="scenario-comparison" aria-labelledby="comparison-title">
    <h2 id="comparison-title">Compare two wage scenarios.</h2>
    <p>Use the same limited 2026 federal model to compare another wage amount or filing status you qualify for. Both scenarios assume the same wage bases for income tax, Social Security and Medicare. Human review is still pending.</p>
    <label class="comparison-toggle"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.currentTarget.checked)} aria-controls="comparison-details" />Compare with a second scenario</label>
    <div id="comparison-details" hidden={!enabled}>
      <p class="comparison-baseline"><strong>Scenario A uses your inputs above.</strong> {statusName(baselineStatus)}{baseline ? ` · ${money(baseline.grossWages)} annual wages` : ' · check the wage amounts above'}. Edit those inputs to change scenario A.</p>
      <fieldset class="comparison-inputs"><legend>Scenario B · annual wages in US dollars</legend>
        <div><label for="comparison-status">Scenario B filing status</label><select id="comparison-status" value={status} onChange={event => setStatus(event.currentTarget.value as FilingStatus)}>{federalRates.filing_statuses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <div><label for="comparison-wages">Scenario B your annual wage income</label><input id="comparison-wages" type="text" inputMode="decimal" autoComplete="off" value={wagesText} aria-invalid={wages === null || combinedInvalid} aria-describedby="comparison-wages-hint comparison-error" onInput={event => setWagesText(event.currentTarget.value)} /><p class="field-hint" id="comparison-wages-hint">Before tax; use the same wage-base assumption as scenario A.</p></div>
        {status === 'married_joint' && <div><label for="comparison-spouse">Scenario B spouse’s annual wage income</label><input id="comparison-spouse" type="text" inputMode="decimal" autoComplete="off" value={spouseText} aria-invalid={spouse === null || combinedInvalid} aria-describedby="comparison-spouse-hint comparison-error" onInput={event => setSpouseText(event.currentTarget.value)} /><p class="field-hint" id="comparison-spouse-hint">Keep each spouse’s wages separate in this scenario too.</p></div>}
      </fieldset>
      <p id="comparison-error" class="input-error" role="alert">{error}</p>
      <p class="sr-only" role="status" aria-atomic="true">{baseline && scenario ? `Annual comparison updated. Scenario A modeled federal taxes ${money(baseline.totalFederal)}. Scenario B modeled federal taxes ${money(scenario.totalFederal)}. B minus A ${difference(scenario.totalFederal - baseline.totalFederal)}.` : 'Comparison unavailable. Check the inputs in both scenarios.'}</p>
      {baseline && scenario ? <><p class="comparison-scroll-hint field-hint">Scroll the table sideways to compare amounts. With the table focused, use the left and right arrow keys.</p><div class="table-scroll comparison-table" tabIndex={0} role="region" aria-labelledby="comparison-caption"><table><caption id="comparison-caption">Annual comparison · B minus A</caption><thead><tr><th scope="col">Annual amount</th><th scope="col">Scenario A<br /><span>{statusName(baselineStatus)}</span></th><th scope="col">Scenario B<br /><span>{statusName(status)}</span></th><th scope="col">B minus A</th></tr></thead><tbody>{metrics.map(metric => <tr key={metric.label}><th scope="row">{metric.label}</th><td>{money(metric.value(baseline))}</td><td>{money(metric.value(scenario))}</td><td>{difference(Math.round((metric.value(scenario) - metric.value(baseline)) * 100) / 100)}</td></tr>)}</tbody></table></div></> : <p class="invalid-result">Enter valid wage amounts in both scenarios to see a fresh comparison. Previous comparison amounts are hidden.</p>}
      <p class="field-hint">B minus A shows the change in each annual amount. All comparison amounts are annual, even if the estimate above shows a monthly average. The same exclusions apply: no credits, state/local taxes, benefits, investment income or self-employment. The remainder is not take-home pay or a refund. Changing filing status does not determine whether you qualify for it.</p>
      <p class="field-hint">Scenario B stays in this page’s memory and is not submitted or saved. “Copy estimate link” shares only scenario A; printing includes the visible comparison.</p>
    </div>
  </section>;
}
