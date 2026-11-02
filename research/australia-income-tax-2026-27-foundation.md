# Australia schedule foundation · checked 2 November 2026

This is an internal engine component, without a public calculator route. It does not complete the planned Australian pay calculator.

The [Income Tax Rates Act compilation dated 1 July 2026, Schedule 7 Part I](https://www.legislation.gov.au/C2004A03348/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html) supplies the ordinary resident schedule. The [ASIC Moneysmart income-tax page](https://moneysmart.gov.au/work-and-tax/income-tax) cross-checks the schedule and supplies one genuinely official worked illustration: 60,000 taxable income gives 8,520 before levies and offsets. Published band totals are checkpoint tests, not a second official worked example.

The component accepts taxable income already determined by the caller. It models ordinary full-year adult resident rates only. It deliberately returns `incomeTaxBeforeOffsetsAndLevies`, without a take-home or total-tax field. It does not determine deductions or include offsets, Medicare levy/surcharge, HELP, salary sacrifice or special residency/income rules. Monetary output is a cent-rounded mathematical component, not an ATO assessment or PAYG rounding implementation.

Remaining gates: provenance validation in the build; additional official examples; human review; current levy/offset/repayment and withholding rules; supported-case design and tests; accessible UI; explicit beta/indexing review. No Australian tool is promoted to available by this foundation.
