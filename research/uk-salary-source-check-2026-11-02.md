# UK monthly salary beta — primary-source check

Checked 2 November 2026. Tax year: 6 April 2026 to 5 April 2027. This records an automated implementation/source check, not a professional tax or payroll review.

## Supported model

One UK-resident category A employee below State Pension age, receiving twelve identical monthly payments. Gross pay is assumed identical for Income Tax and employee National Insurance. The tool excludes directors, pensions, salary sacrifice, student/postgraduate loans, taxable benefits, bonuses, multiple jobs, part-year employment, other income, reliefs and allowance transfers.

Annual salary is twelve times the entered monthly pay. Income Tax is an annual salary-band model; its separately rounded monthly average is NOT a cumulative PAYE calculation. The displayed monthly remainder subtracts that average and monthly NI from monthly gross pay. It excludes other payslip deductions. No tax-code, prior-earnings or prior-deductions simulation is claimed.

## Primary sources and implementation decisions

- [HMRC 2026/27 employer rates and thresholds](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027): annual taxable-income bands, separate England/Northern Ireland, Wales and Scotland schedules, plus monthly NI thresholds. Stored limits are AFTER the available allowance. Scottish gross thresholds were crosschecked against [GOV.UK Scottish Income Tax](https://www.gov.uk/scottish-income-tax). This distinction matters when the allowance tapers.
- [Personal Allowance guidance](https://www.gov.uk/income-tax-rates): £12,570 standard allowance; reduction above £100,000. Salary is assumed equal to adjusted net income. [Income Tax Act 2007 section 35](https://www.legislation.gov.uk/ukpga/2007/3/section/35) provides the whole-pound round-up of remaining allowance. The legislation search result supplied section 35(2)–(3); direct page extraction failed because the service rejected XHTML. The implementation retains the official statutory link for review.
- [Employee NI rates and category-A example](https://www.gov.uk/national-insurance-rates-letters): 8% within the main band and 2% above; monthly thresholds £1,048 and £4,189. The [2026/27 employer further guide](https://www.gov.uk/government/publications/cwg2-further-guide-to-paye-and-national-insurance-contributions/2026-to-2027-employer-further-guide-to-paye-and-national-insurance-contributions), section 1.7, establishes monthly earnings periods; its exact-percentage guidance describes nearest-penny rounding with exact half-pennies down. The engine uses integer pence and rounds the combined period charge once. Annual NI projection is twelve individually rounded monthly charges, not an annual-threshold calculation.

## Official examples and gates

[HMRC Income Tax Liabilities supporting documentation](https://www.gov.uk/government/statistics/income-tax-liabilities-statistics-tax-year-2023-to-2024-to-tax-year-2026-to-2027/bulletin-supporting-documentation), Tables 2a and 2b, explicitly uses 2026/27 rates for £60,000 earnings without savings/dividends. Rest-of-UK tax is £11,432. The Scottish table displays £13,182 to whole-pound precision; the model’s penny result is £13,182.05 and matches that published rounded total. Tests check the supplied taxable-band splits as well as totals. GOV.UK’s £1,000 weekly category-A NI example gives £58.66; a weekly helper reproduces this solely as a component regression check, while the UI supports monthly pay only.

These are two official Income Tax component examples and one official NI component example, not a complete payslip approval. Human review and the full release gate remain pending. The page stays noindex; no professional reviewer or payroll guarantee is claimed.

## Verification and privacy

The engine and independent rate/provenance validator pass 79 tests. The validator checks exact approved source hosts, tax-year boundaries, verification dates and the supported schedules/period thresholds. Astro check and the 18-page static build passed. An isolated headless Chrome run passed 22 checks covering all four nations, official-example outputs, monthly NI boundary behavior, taper, invalid-state recovery, persistent result announcements, keyboard table access, mobile containment, printing, reset-on-reload and no financial-input network/storage writes.

Inputs exist only in component memory. There is no financial-input endpoint, autosave, share link or analytics integration added by this beta. Printing uses the visible page. Screenshots were inspected at desktop and 375px mobile; the salary table was tightened to fit the available mobile width after this inspection.
