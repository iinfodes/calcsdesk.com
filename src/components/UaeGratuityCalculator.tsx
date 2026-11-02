import { useState } from 'preact/hooks';
import { estimateUaeGratuity, MAX_MONTHLY_WAGE, MAX_SERVICE_DAYS } from '../calc/ae/gratuity';

const money = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const number = (value: number) => new Intl.NumberFormat('en-AE', { maximumFractionDigits: 6 }).format(value);
function amount(text: string) {
  const value = text.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value)) return null;
  const parsed = Number(value.replaceAll(',', ''));
  return Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_MONTHLY_WAGE ? parsed : null;
}
function days(text: string) { return /^\d+$/.test(text.trim()) && Number.isSafeInteger(Number(text)) && Number(text) <= MAX_SERVICE_DAYS ? Number(text) : null; }

export default function UaeGratuityCalculator() {
  const [basicText, setBasic] = useState('10000');
  const [serviceText, setService] = useState('1825');
  const [absenceText, setAbsence] = useState('0');
  const basic = amount(basicText), service = days(serviceText), absence = days(absenceText);
  let error = '';
  let result: ReturnType<typeof estimateUaeGratuity> | null = null;
  if (basic === null) error = 'Enter a positive monthly AED amount, up to AED 10,000,000, with no more than two decimal places.';
  else if (service === null || absence === null) error = 'Enter whole days from 0 to 36,500 for service and unpaid absence.';
  else if (absence > service) error = 'Unpaid absence cannot exceed total service days.';
  else { try { result = estimateUaeGratuity({ monthlyBasicWage: basic, serviceDays: service, unpaidAbsenceDays: absence }); } catch { error = 'No estimate is shown for this service period. Cap-affected cases are unsupported while the conflicting official cap wording is reviewed. This does not mean your gratuity is zero.'; } }
  return <div class="uae-gratuity" id="calculator">
    <section class="uae-gratuity-inputs" aria-labelledby="uae-input-title"><p class="micro">01 / Your inputs</p><h2 id="uae-input-title">Wage and service.</h2>
      <p class="uae-help">For the supported full-time, monthly-paid case only. Use the last applicable basic wage and actual service days; this tool does not decide employment eligibility.</p>
      <label for="uae-basic">Monthly basic wage · AED</label><input id="uae-basic" type="text" inputMode="decimal" autoComplete="off" value={basicText} onInput={event => setBasic(event.currentTarget.value)} aria-invalid={basic === null} aria-describedby="uae-basic-hint uae-input-error" /><p id="uae-basic-hint" class="uae-help">Basic wage is used for the 21-day and 30-day service bands.</p>
      <label for="uae-service">Total calendar service days</label><input id="uae-service" type="text" inputMode="numeric" autoComplete="off" value={serviceText} onInput={event => setService(event.currentTarget.value)} aria-invalid={service === null} aria-describedby="uae-service-hint uae-input-error" /><p id="uae-service-hint" class="uae-help">Include unpaid absence here, then enter it separately below. Confirm the correct service period from your employment records; date counting is not automated.</p>
      <label for="uae-absence">Unpaid absence days to exclude</label><input id="uae-absence" type="text" inputMode="numeric" autoComplete="off" value={absenceText} onInput={event => setAbsence(event.currentTarget.value)} aria-invalid={absence === null || (service !== null && absence > service)} aria-describedby="uae-absence-hint uae-input-error" /><p id="uae-absence-hint" class="uae-help">These days are subtracted from total service once.</p>
      <p id="uae-input-error" class="uae-error" role="alert">{error}</p><p class="uae-help">Input limits are AED 10 million per month and 36,500 service days. Calculations run in this page; inputs are not submitted or saved by this tool.</p>
    </section>
    <section class="uae-gratuity-results" aria-labelledby="uae-result-title"><p class="micro">02 / The estimate</p><h2 id="uae-result-title">See the working.</h2>
      <p class="sr-only" role="status" aria-atomic="true">{result ? `Estimated gratuity ${money(result.gratuity)}. ${result.eligible ? 'Minimum service requirement met in this model.' : 'Counted service is below one year.'}` : 'Estimate unavailable. Check the wage and service inputs.'}</p>
      {result ? <><div class="uae-headline"><span>Modeled traditional gratuity</span><strong data-testid="uae-gratuity">{money(result.gratuity)}</strong><p>{result.eligible ? 'Before any other lawful adjustments or deductions.' : 'Below one year of counted service: no gratuity in this model.'}</p></div>
        <dl class="uae-breakdown"><div><dt>Counted service days</dt><dd>{number(result.countedServiceDays)}</dd></div><div><dt>Service years · days ÷ 365</dt><dd>{number(result.serviceYears)}</dd></div><div><dt>Daily basic wage · monthly ÷ 30</dt><dd>{money(result.dailyBasicWage)}</dd></div><div><dt>First five years · 21 days per year</dt><dd>{money(result.firstBandAmount)}</dd></div><div><dt>Later years · 30 days per year</dt><dd>{money(result.laterBandAmount)}</dd></div><div class="uae-final"><dt>Estimated gratuity</dt><dd>{money(result.gratuity)}</dd></div></dl>
        <p class="uae-help">Cap-affected cases are excluded while official wording is reviewed; this tool does not choose between the conflicting cap interpretations. Service years and daily wage are shown rounded; the engine uses unrounded values. The total is rounded once to the nearest fils, half up; independently rounded bands can differ from it by one fils. This rounding convention awaits official-example review.</p>
        <details class="uae-working" open><summary>Calculation method</summary><p>Subtract unpaid absence from total service. Divide counted days by 365. After at least one counted year, use 21 days of basic wage for each of the first five years and 30 days for each later year, with proportional parts of a year.</p><p>When this accrual exceeds 24 months of basic wage, the tool shows no estimate pending cap clarification. That boundary limits this beta’s supported cases; it is not a conclusion about which wage definition applies to the legal cap.</p><p>This is a limited calculation, not a determination of a final employment settlement. Other entitlements and deductions are outside the result.</p></details>
      </> : <div class="uae-invalid"><h3>Check your inputs.</h3><p>A fresh estimate appears when the amounts and day counts are valid. Previous results are hidden.</p></div>}
    </section>
  </div>;
}
