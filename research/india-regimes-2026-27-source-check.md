# India salary regime foundation — Tax Year 2026–27

Primary-source check: 2 November 2026. Human/professional review and current-year full official worked-example gates remain pending.

## Current-year basis

The [Income Tax Department’s new-Act scope FAQ](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/objective-and-scope-new-act-faq) confirms that income earned in FY 2026–27 is “Tax Year 2026–27” under the Income-tax Act, 2025, effective 1 April 2026. AY 2026–27 portal filing guidance concerns the previous income year; it was not accepted as the sole authority for current rules. The model avoids using legacy section numbers as if they were current.

The Department-hosted [Income-tax Act, 2025 as amended by Finance Act, 2026](https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf) is the principal consolidated source. The [enacted Finance Act, 2026](https://www.incometaxindia.gov.in/documents/d/guest/finance-act-2026-pdf-1), assented to on 30 March 2026, supplies current-year old-regime rates and cess. Bills, proposed provisions and third-party calculators are not the authority for stored rates.

## Verified provisions

Consolidated Act (zero-based PDF pages used during review):

- Section 19(1), table item 2, page 45: salary-capped standard deductions of ₹75,000 under section 202(1), ₹50,000 otherwise.
- Section 156, pages 215–216: resident old-regime rebate up to ₹12,500 where total income does not exceed ₹5 lakh; new-regime rebate up to ₹60,000 at total income up to ₹12 lakh. Above the new threshold, supported marginal relief reduces pre-cess tax to the excess income where applicable. No corresponding old-regime rebate marginal relief is applied.
- Section 202(1), pages 263–264: new-regime slabs at ₹4/8/12/16/20/24 lakh with rates 0/5/10/15/20/25%, then 30% above ₹24 lakh.
- Section 516, page 575: disregard paise, round total income and final tax to the nearest ₹10, with a final rupee digit of five rounding upward.

Enacted Finance Act:

- Section 3, page 8, applies the Act 2025 framework to the tax year starting 1 April 2026.
- First Schedule Part I-B, Paragraph A(I), page 83, provides the old under-60 schedule: nil to ₹2.5 lakh, 5% to ₹5 lakh, 20% to ₹10 lakh, then 30%.
- Section 3(15), page 28, provides 4% Health and Education Cess. The surcharge schedule starts above ₹50 lakh; the model limits gross salary to ₹50 lakh so neither regime’s rounded taxable income can enter that case.

## Narrow model and arithmetic

Resident individual under 60; ordinary, fully taxable salary only. Gross salary is a whole-rupee amount from zero to ₹50 lakh. Optional additional old-regime deductions are an already-eligible user-provided aggregate, excluding the automatic standard deduction. The engine checks its arithmetic bound after the standard deduction; it does not establish deduction eligibility or category limits. No additional new-regime deduction is modeled.

Sequence: standard deduction → eligible entered old-only deductions → total-income rounding → slab tax → resident rebate or supported marginal relief → cess → final statutory tax rounding. Integer paise arithmetic preserves intermediate values. The displayed comparison uses final rounded annual tax and describes only a lower modeled amount, not a recommendation or filing election.

Excluded: non-residents, senior-citizen schedules, HRA/LTA/exempt components, CTC conversion, taxable benefits, special-rate income, capital gains, agricultural/business/foreign income, loss adjustments, surcharge, tax already paid, interest and penalties. The model is not salary withholding, take-home pay or a refund calculation.

## Tests, examples and review

74 engine/data-provenance tests pass. Tests cover standard-deduction caps, both slab schedules, old rebate cliff, new marginal relief through its derived endpoint, income rounding before rebate, cess after relief, final rounding, deduction bounds, ₹50 lakh maximum, Indian digit grouping and a supported-salary reconciliation sweep. Arithmetic illustrations are explicitly CalcsDesk examples; no complete current-year official worked example has been fabricated or claimed.

An independent agent re-opened the enacted sources, reviewed the engine sequence and boundary arithmetic, and found no concrete financial defect. A separate UI agent implemented the source-driven interface; this agent independently checked its supported-case and pending-review wording. Automated/source review does not satisfy the outstanding human/professional or complete official-example gates. Any public page remains beta and noindex.
