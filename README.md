# CalcsDesk · calcsdesk.com

Project code: AD01. The owner's local workspace includes `CLAUDE.md`, `DOMAIN_FILE.md`, `KIT/` and `ops/`. Those internal handover and account-operations files are intentionally excluded from this public repository.

The handover is copied from the owner's INFODES_FINAL folder. The selected design uses Astro, TypeScript and Preact: option 1 home, option 4 country section and option 7 country-page finder. The development site is deployed at https://calcsdesk.com/ (Cloudflare Pages alias: https://calcsdesk.pages.dev/), with www redirecting to non-www. No ad files or ad code have been generated.

P7 is complete. The home page, six country hubs, methodology, sources and 404 layout are built. Search, country filters, guided selection, mobile navigation and persistent dark mode work. The first calculator is a limited 2026 US federal wage-income beta at `/us/tax/income-tax-calculator/`: five filing statuses, basic standard deduction, progressive regular income tax, employee Social Security, Medicare and Additional Medicare, with per-person wage caps for joint returns. It includes annual/monthly views, bracket working, printable results and URL-fragment sharing. Other tools remain in preparation; all pages are noindex and no sitemap is emitted. Human review, full official worked-example release checks, legal/contact work and launch checks remain outstanding.

The apex domain is connected to Cloudflare Pages. HTTP and www requests redirect to HTTPS non-www with path/query preserved. DNSSEC and other remaining setup tasks are tracked in the owner's local handover.

Cloudflare Pages project: `calcsdesk`, production branch: `main`. The initial deployment was a direct upload of `dist/`; future GitHub pushes currently run CI without automatically deploying to Cloudflare. All deployed pages remain noindex while calculators are in preparation.

## Local development

- `npm ci` installs the locked dependencies.
- `npm run dev` starts the development site.
- `npm run verify` checks types, calculator/validator tests, source-data provenance, the build, metadata, links, structured data, noindex, no-email and no-ad requirements.
- `npm test` runs the calculator and data-validator suite.
- `npm run validate:data` checks the sourced 2026 data records in `src/data/us/2026/federal.json`.
- `npm run build` produces `dist/` for a future Cloudflare Pages deployment.

Review screenshots are in `design/selected/`. The isolated local layout-review helper, `scripts/review-layout.cjs`, uses this desktop's bundled browser libraries and installed Chrome; it is a local review utility rather than a portable CI browser suite. Its results are in `design/selected/review-results.json`.

## Calculator scope and review status

The federal beta models regular federal income tax before credits on wage income, using the basic standard deduction. It assumes the same wage base for income tax and FICA. It is not a W-4/paycheck-withholding calculator or a complete tax return. The page lists exclusions and supported cases. Rates carry source URLs, effective dates and a source-check date; professional/human review is not claimed. Official tax-schedule checkpoints and wage portions of IRS Medicare examples are tested, but do not replace the pending full official worked-example gate. No entered financial amounts are submitted to a server; share links use the fragment and are created only on request.
