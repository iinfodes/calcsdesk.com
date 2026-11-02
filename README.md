# CalcsDesk · calcsdesk.com

Astro, TypeScript and Preact calculators hosted on Cloudflare Pages at [calcsdesk.com](https://calcsdesk.com/). HTTPS and www requests redirect to the HTTPS apex, preserving the path and query. Ads are off.

The substantive homepage is eligible for indexing. Calculator betas, country collections and trust pages remain `noindex`; `/sitemap.xml` contains only the homepage. Search-engine inclusion is not guaranteed by that policy.

## Available limited betas

| Tool | Route | Supported model and important limit |
| --- | --- | --- |
| US federal income tax | `/us/tax/income-tax-calculator/` | 2026 wage-only regular income tax before credits, basic standard deduction and employee FICA. Separate spouse wages preserve per-earner Social Security caps. Not W-4 withholding, a complete return or take-home pay. |
| UK monthly salary | `/uk/pay/salary-calculator/` | 2026/27, twelve equal monthly pays, annual salary Income Tax and period-based category A employee NI. Includes Scotland. Excludes pensions, loans, uneven pay and PAYE history. |
| UAE gratuity | `/ae/gratuity/gratuity-calculator/` | Narrow federal private-sector traditional-gratuity case using basic wage and confirmed service days. Cap-affected cases are unsupported pending source clarification; no entitlement is inferred from an unavailable result. |
| India salary regimes | `/in/tax/income-tax-calculator/` | Enacted Tax Year 2026–27 ordinary-salary comparison for resident individuals under 60, up to ₹50 lakh gross. Shows rebate, marginal relief, cess and rounding. Additional old-regime deductions must be independently confirmed eligible. |

Each page provides its own assumptions, source records, check date and review status. Automated source/component checks do not establish human or professional sign-off. Full official worked-example gates remain pending where stated.

The federal beta also provides annual/monthly views, bracket working, optional scenario comparison, printing and explicit sharing. Comparison values are annual; share links contain scenario A only. Shared fragments are validated atomically before restoring a scenario.

Australian resident and Canadian federal bracket engines are unpublished foundations. They do not complete their planned pay/income-tax tools or include all levies, offsets, credits, provincial taxes or payroll contributions. Other directory entries remain clearly labelled preparation tools.

## Navigation, trust and privacy

The homepage defaults to available betas, with optional preparation tools and country filtering. A country preference is saved locally only after opt-in; it never redirects visitors. Six country collections include guided finders. About, review status, editorial policy, corrections, methodology, sources and updates describe the work actually completed.

Calculations run in the browser without financial-input submission or automatic wage storage. Theme and optional country preferences use localStorage. Only an explicitly requested federal share link places financial inputs in a URL fragment. Recipients can read those figures.

Contact delivery and final legal publication are not active. The corrections page makes that limitation clear. Human calculator review, applicable official-example checks and the remaining full-launch work are still outstanding.

## Development and verification

Use Node 24 and the locked dependencies.

- `npm ci` installs dependencies.
- `npm run dev` starts the development site.
- `npm run verify` checks types, engine/validator tests, all six source-data documents, static output, metadata, internal links, indexing/sitemap policy, no-email/no-ad requirements and page-size budgets.
- `npm run test:browser` runs desktop/mobile Chromium flows against an existing build. Install Chromium with `npx playwright install chromium`, or set `PLAYWRIGHT_CHROME_PATH` to an installed Chrome executable. GitHub CI installs Chromium and runs these checks after verification.
- `npm run validate:data` checks registered US, UK, UAE, India, AU and CA datasets.
- `npm run build` writes `dist/`.
- `node scripts/check-live.mjs` performs read-only production smoke checks after deployment: canonical/robots responses, sitemap discovery, missing pages and one-hop redirects. It does not submit indexing requests or visitor data.

Size guards limit HTML to 100 KiB, all linked/inline CSS to 30 KiB and transitive plus inline JavaScript to 70 KiB gzip per page. Lab performance results and selected layout evidence are in `design/selected/readiness-final/`; they are not field Core Web Vitals. Desktop-specific review helpers use this workspace's installed Chrome and bundled runtime; portable CI flows live under `tests/browser/`.

## Source review and reset dry-run

Run `node scripts/data-review.mjs --current src/data/us/2026/federal.json` for the existing federal source/effective-date checklist. Add `--candidate <local-candidate.json>` to inspect rate-versus-metadata changes, or `--format json` for a deterministic report. Both files must pass validation.

This command reads files without fetching sources, changing verification dates, approving review, promoting rates or publishing updates. A next-year dataset requires validator, engine, route and test updates first. Source review and human release decisions remain separate.

## Deployment and local handover

Cloudflare Pages project: `calcsdesk`, production branch: `main`. GitHub pushes run CI; the project currently uses direct uploads of `dist/` rather than automatic Cloudflare deployment. Deploy only the verified revision and run the production smoke check afterward.

Project code: AD01. The selected composition uses option 1 home, option 4 country cards and option 7 guided finders. Private owner files (`CLAUDE.md`, `DOMAIN_FILE.md`, `KIT/`, `ops/`), credentials, build outputs and dependency directories are excluded from public Git. Logo explorations remain unapplied. Remaining account/security setup is tracked in that local handover.
