import { useEffect, useState } from 'preact/hooks';
import { estimateFederal, federalRates, parseWages, type FilingStatus } from '../calc/us/federal';

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const percent = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(value);

export default function FederalCalculator() {
  const [status, setStatus] = useState<FilingStatus>('single');
  const [wagesText, setWagesText] = useState('75000');
  const [spouseText, setSpouseText] = useState('0');
  const [period, setPeriod] = useState<'annual' | 'monthly'>('annual');
  const [shareStatus, setShareStatus] = useState('');
  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const savedStatus = params.get('status');
      if (federalRates.filing_statuses.some(item => item.id === savedStatus)) setStatus(savedStatus as FilingStatus);
      for (const [key, setter] of [['wages', setWagesText], ['spouse', setSpouseText]] as const) {
        const value = params.get(key);if (value !== null && parseWages(value) !== null) setter(value);
      }
    };
    restore();window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);
  const wages = parseWages(wagesText);
  const spouse = status === 'married_joint' ? parseWages(spouseText) : 0;
  let result: ReturnType<typeof estimateFederal> | null = null;
  let error = '';
  if (wages === null || spouse === null) error = 'Enter a valid annual dollar amount from $0 to $10,000,000, with no more than two decimal places.';
  else { try { result = estimateFederal({ status, wages, spouseWages: spouse }); } catch { error = 'Combined wages must be $10,000,000 or less.'; } }
  const divisor = period === 'annual' ? 1 : 12;
  const displayMoney = (value: number) => money(value / divisor);
  const selectedRates = federalRates.filing_statuses.find(item => item.id === status)!;
  const share = async () => {
    if (!result || wages === null || spouse === null) return;
    const params = new URLSearchParams({ status, wages: String(wages) });
    if (status === 'married_joint') params.set('spouse', String(spouse));
    const url = new URL(window.location.href);url.hash = params.toString();
    try { await navigator.clipboard.writeText(url.href);setShareStatus('Link copied. It contains the wage amounts and filing status you entered.'); }
    catch { window.history.replaceState(null, '', url);setShareStatus('Your inputs are now in the address-bar fragment. Copy the URL to share this estimate.'); }
  };
  return <div class="federal-calculator" id="calculator">
    <section class="calculator-inputs" aria-labelledby="inputs-title">
      <div class="calculator-panel-heading"><span class="micro">01 / Your situation</span><h2 id="inputs-title">Start with your wages.</h2><p>Tax year 2026 · US dollars</p></div>
      <label for="filing-status">Filing status</label><select id="filing-status" value={status} onChange={event => { setStatus(event.currentTarget.value as FilingStatus);setShareStatus(''); }}>{federalRates.filing_statuses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <label for="annual-wages">Your annual wage income</label><div class="money-input"><span aria-hidden="true">$</span><input id="annual-wages" type="text" inputMode="decimal" autoComplete="off" value={wagesText} aria-invalid={wages === null} aria-describedby="wages-hint input-error" onInput={event => { setWagesText(event.currentTarget.value);setShareStatus(''); }} /></div><p class="field-hint" id="wages-hint">Use wages before tax, assuming the same amount is taxable for income tax, Social Security and Medicare.</p>
      {status === 'married_joint' && <><label for="spouse-wages">Spouse’s annual wage income</label><div class="money-input"><span aria-hidden="true">$</span><input id="spouse-wages" type="text" inputMode="decimal" autoComplete="off" value={spouseText} aria-invalid={spouse === null} aria-describedby="spouse-hint input-error" onInput={event => { setSpouseText(event.currentTarget.value);setShareStatus(''); }} /></div><p class="field-hint" id="spouse-hint">Keep each spouse’s wages separate so each Social Security cap is applied correctly.</p></>}
      <div id="input-error" role="alert" class="input-error">{error}</div>
      <div class="deduction-card"><span>2026 basic standard deduction</span><strong>{money(selectedRates.standard_deduction)}</strong><p>Applied automatically; limited by available wage income.</p></div>
      <details class="scope-disclosure"><summary>Who this estimate is for</summary><p>US-resident wage earners under 65, not blind and not claimed as someone else’s dependent, taking the basic standard deduction. It assumes you qualify for the selected filing status.</p><p>For married filing separately, it assumes your spouse does not itemize and no community-property income allocation is required.</p><p>No credits, itemizing, retirement-plan adjustments, self-employment, investment income, state/local taxes or special deductions for tips, overtime, seniors or car-loan interest are modeled.</p></details>
      <p class="privacy-note">Your inputs stay in this browser. No account or financial-input submission is required.</p>
    </section>
    <section class="calculator-results" aria-labelledby="result-title">
      <div class="calculator-panel-heading"><span class="micro">02 / The estimate</span><h2 id="result-title">See the working.</h2><div class="period-switch" role="group" aria-label="Display period"><button aria-pressed={period === 'annual'} onClick={() => setPeriod('annual')}>Annual</button><button aria-pressed={period === 'monthly'} onClick={() => setPeriod('monthly')}>Monthly average</button></div></div>
      {result ? <>
        <div class="headline-result" aria-live="polite" aria-atomic="true"><span>Regular federal income tax · before credits</span><strong data-testid="income-tax">{displayMoney(result.incomeTax)}</strong><p>{period === 'annual' ? 'Annual estimate using the 2026 tax-rate schedule.' : 'Annual estimate divided by 12; not a paycheck withholding figure.'}</p></div>
        <div class="result-rate-pair"><div><span>Highest bracket used</span><strong>{percent(result.marginalRate)}</strong></div><div><span>Income tax ÷ wages</span><strong>{percent(result.effectiveRate)}</strong></div></div>
        <dl class="result-breakdown"><div><dt>Wage income</dt><dd>{displayMoney(result.grossWages)}</dd></div><div><dt>Standard deduction used</dt><dd>−{displayMoney(result.deductionUsed)}</dd></div><div class="subtotal"><dt>Taxable income</dt><dd data-testid="taxable-income">{displayMoney(result.taxableIncome)}</dd></div><div><dt>Regular federal income tax</dt><dd>{displayMoney(result.incomeTax)}</dd></div><div><dt>Social Security · employee</dt><dd data-testid="social-security">{displayMoney(result.payroll.socialSecurity)}</dd></div><div><dt>Medicare · employee</dt><dd>{displayMoney(result.payroll.medicare)}</dd></div><div><dt>Additional Medicare</dt><dd data-testid="additional-medicare">{displayMoney(result.payroll.additionalMedicare)}</dd></div><div class="subtotal"><dt>Modeled federal taxes</dt><dd data-testid="total-federal">{displayMoney(result.totalFederal)}</dd></div><div class="remainder"><dt>Wages minus modeled taxes</dt><dd data-testid="remainder">{displayMoney(result.federalOnlyRemainder)}</dd></div></dl>
        <p class="result-caution">This remainder excludes state and local taxes, benefit deductions and tax credits. It is not a take-home-pay quote or a refund estimate.</p>
        <div class="result-chart" role="img" aria-label={`Annual wages ${money(result.grossWages)}: regular income tax ${money(result.incomeTax)}, employee payroll taxes ${money(result.payroll.total)}, remainder ${money(result.federalOnlyRemainder)}.`}>{result.grossWages > 0 && <><span class="chart-income" style={{ width: `${100 * result.incomeTax / result.grossWages}%` }} /><span class="chart-payroll" style={{ width: `${100 * result.payroll.total / result.grossWages}%` }} /><span class="chart-remainder" style={{ width: `${100 * result.federalOnlyRemainder / result.grossWages}%` }} /></>}</div><div class="chart-key"><span>■ Income tax</span><span>▨ Payroll taxes</span><span>□ Remainder</span></div>
        <details class="working-disclosure" open><summary>Bracket-by-bracket working</summary><p>Annual taxable income is split across the brackets. Only the amount inside each band receives that band’s rate.</p><div class="table-scroll"><table><caption>Annual regular income tax calculation</caption><thead><tr><th scope="col">Rate</th><th scope="col">Amount in band</th><th scope="col">Tax</th></tr></thead><tbody>{result.bands.filter(band => band.taxable > 0).map(band => <tr key={band.from}><th scope="row">{percent(band.rate)}</th><td>{money(band.taxable)}</td><td>{money(band.tax)}</td></tr>)}{result.taxableIncome === 0 && <tr><td colSpan={3}>No income remains after the deduction.</td></tr>}</tbody><tfoot><tr><th scope="row" colSpan={2}>Regular federal income tax</th><td>{money(result.incomeTax)}</td></tr></tfoot></table></div></details>
        <div class="calculator-actions"><button class="secondary-button" onClick={share}>Copy estimate link ↗</button><button class="secondary-button" onClick={() => window.print()}>Print result</button></div><p class="share-status" role="status">{shareStatus}</p><p class="field-hint">Shared links include your entered amounts in the URL fragment. Share only if you are comfortable disclosing them.</p>
      </> : <div class="invalid-result"><h3>Check your wage amounts.</h3><p>A fresh result will appear when the inputs are valid. The previous estimate is hidden.</p></div>}
    </section>
  </div>;
}
