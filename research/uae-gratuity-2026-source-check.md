# UAE gratuity source check — 2 November 2026

Status: beta arithmetic foundation; human legal review and two official worked examples pending. This is not a determination of any worker's entitlement. No official numerical worked examples were verified; tests below are our own illustrations.

## Sources inspected

- [UAE Government private-sector benefits guidance](https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/end-of-service-benefits-for-employees-in-the-private-sector): confirms full-time foreign-worker scope, basic-salary basis, unpaid absence exclusion and proportional fractional service after eligibility. The page also describes alternative savings arrangements; these are excluded.
- [UAE Government hosted MOHRE Decree-Law 33/2021 English PDF](https://assets.u.ae/api/public/content/eb65a60bbff949fa912eddd566613014?v=7174ed78): Article 51, PDF page 28, describes one-year continuous-service eligibility, 21 days per first five years, then 30 per subsequent year, using last basic wage. Article 67, PDF page 34, provides 365 days per year and 30 per month. Article 1 distinguishes wage from basic wage. PDF labels its English text as not an official translation; Arabic prevails. It is an older English publication, not evidence that every provision is consolidated through 2026.
- [MOHRE limited-term job-offer annex](https://mohre.gov.ae/assets/a00f738d/annex-of-job-offer-for-limited-term-employment-contract.aspx): official-domain search excerpt specifies a limit of two years' basic wage. Direct PDF retrieval timed out; applicability/current wording remains unverified.

## Unresolved cap interpretation

Article 51(6) uses two years' wage, whereas the annex excerpt says basic wage. We have not resolved this difference. The engine only returns accrual at or below 24 months of basic wage, where either interpretation would produce the same result. It throws for any higher unrounded accrual. It does not assert that either cap basis is legally correct. The UI must show unsupported, rather than zero or a previous result, when that occurs.

## Modeling decisions and limitations

Inputs are confirmed continuous calendar-service days and unpaid-absence days, plus last monthly basic wage. Date parsing, endpoint inclusivity, disputed continuity and employment-law applicability are not inferred. Counted service subtracts unpaid absence. Monthly-to-daily conversion uses 30; year fractions use 365. Final accrual rounds once to the nearest fils, half up, as a display convention awaiting official-example confirmation. Band displays round independently and may differ by a fils from the rounded total.

Scope excludes DIFC, ADGM, government, domestic workers, UAE nationals, alternative/savings schemes, non-full-time and piecework arrangements. Exclusions are product scope boundaries, not claims that all listed workers have no entitlement. The result omits deductions, other final-settlement amounts, enhanced contractual benefits and eligibility disputes. Product bounds of AED 10 million monthly basic wage and 36,500 service days are technical limits, not statutory limits.

## Local illustrations and release gate

At AED 6,000 monthly basic wage: 365 counted days produces AED 4,200; 1,825 produces AED 21,000; 2,555 produces AED 33,000. These locally constructed regression fixtures are not official worked examples. Tests cover the eligibility transition, five-year transition, unpaid absence, fractions, precision, invalid input and cap exclusion. Before indexing or removing beta labels, obtain human review, two applicable official worked examples, cap clarification and date-boundary confirmation if date inputs are added.
