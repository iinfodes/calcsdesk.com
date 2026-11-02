# 2026 US federal calculator foundation

Source check: 2 November 2026. Scope: a development beta for wage-only regular income tax before credits, with employee Social Security, Medicare and Additional Medicare annual liability. No professional or human review is claimed.

## Official references

- IRS Rev. Proc. 2025-32, sections 4.01 and 4.14: https://www.irs.gov/irb/2025-45_IRB — brackets and basic standard deductions.
- IRS Publication 505 (2026): https://www.irs.gov/publications/p505 — estimated-tax schedules and an independent multiplication/subtraction worksheet check.
- SSA 2026 COLA fact sheet: https://www.ssa.gov/cola/factsheets/2026.html — employee Social Security/Medicare rates and wage base.
- IRS Additional Medicare Tax FAQ: https://www.irs.gov/businesses/small-businesses-self-employed/questions-and-answers-for-the-additional-medicare-tax — filing-status thresholds, annual liability versus withholding, and example wage components.

## Evidence and limits

The data file records URLs, titles, effective dates, verification date, verification method and review limitations for every filing-status and payroll record. Structural validation blocks missing provenance, malformed dates, unsorted bands and missing payroll thresholds. Independent expected base-tax amounts come from the published IRS schedule, rather than calculations using the same implementation.

The automated suite has 67 tests: all filing-status schedule checkpoints and basic deductions, bracket continuity, a multiplication/subtraction worksheet cross-check, per-person Social Security caps, Additional Medicare wage components from IRS FAQ examples, parsing and invalid-input cases, and validator rejection cases. The IRS FAQ examples also contain self-employment income; only their explicitly identified wage components are reproduced. They are not misrepresented as full wage-only official worked examples.

The two visible page illustrations are CalcsDesk examples calculated from official schedules, not IRS-authored examples. Full reproduction of two suitable official worked examples and human review remain release gates. The beta therefore stays noindex. This foundation completes the first B4 engine/validator implementation, not the full launch checklist or all-country data work.

## Supported case

US-resident wage income, basic standard deduction, under age 65, not blind, not a dependent, eligible filing status, same modeled wage base for income tax and FICA. Joint returns separate spouses' wages for Social Security. Married-separate cases assume the spouse does not itemize and no community-property allocation is required. The model excludes credits, special deductions, investment and business income, AMT, state/local taxes, benefit deductions and W-4 withholding.

Share links use the URL fragment, not query parameters. No wage input is submitted to a server. Calculation after load also works with the browser network disabled.
