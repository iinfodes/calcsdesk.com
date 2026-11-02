# Launch-readiness review · 2 November 2026

Independent source review at the start of the homepage/indexing phase. This is a local-code and handover review, not a live legal compliance audit, measured user study or professional review of tax calculations.

## Recommended phase boundary

The home page can be made independently useful and considered for indexing while the federal calculator remains a clearly labelled beta/noindex. Changing a global robots setting would expose preparation hubs and incomplete calculator work. Use a strict canonical-route allowlist and generate the sitemap from the same policy.

KIT_04 §1 requires approximately 600 useful words, a working tool or a genuine data table with at least ten rows for an indexable page. A short marketing directory whose main destinations are unavailable tools does not clearly meet that bar. The useful beta should be the primary task, with substantive selection and interpretation guidance. An embedded working tool is another possible way to provide standalone utility, but its beta status must remain conspicuous and does not remove the calculator's pending release gates.

## Findings and concrete actions

| Area | Observed at review start | Action for this phase |
|---|---|---|
| Home promise | The headline/description imply international pay, salary, tax and gratuity discovery, but only one of eight listed tools is interactive. | Lead with the US federal beta. Separate working beta tools from the development roadmap. Do not suggest UK/UAE tools are usable. |
| Quick routes | Three of four routes lead to in-preparation country anchors. | Keep the beta as the principal action. Label preparation destinations before the visitor follows them. |
| Country cards | Six launch-market cards look equally available. | Retain navigation, but make coverage/status explicit; do not index country stubs yet. |
| Federal calculator | The page says human review and the full official worked-example gate are pending. Its estimate assumes equal income-tax and FICA wage bases and excludes credits/special cases. | Keep it noindex and labelled beta. Do not use homepage indexing as a reason to mark the tool fully released. |
| Trust navigation | Footer has Countries, Methodology and Sources only. | Link real About, Editorial policy, Corrections, Team and Updates pages as they are completed; do not link nonexistent final legal/contact pages. |
| Contact/reporting | No public contact page, form endpoint, Turnstile or mail-delivery flow is present in the application source. | Treat a reachable report/contact channel as outstanding. A disabled form or status page is not a functioning contact mechanism. Do not promise receipt, reference IDs or response times before delivery is verified. |
| Privacy statements | Financial input is processed in Preact; sharing uses a URL fragment. Theme preference is stored locally. No analytics/ad integration is present in the source. | Draft policies from that actual behaviour. Do not copy template claims about GA4, AdSense, marketing cookies or contact-message retention into the current site. |
| Methodology wording | It states that development pages do not collect financial inputs, although the beta has wage inputs. | Say financial inputs are not sent to a server, rather than implying that no input fields exist. |
| Robots/sitemap | Base emits noindex globally; robots allows normal search crawling and blocks the DATA-MOAT training/bulk groups. There is no sitemap in the deployed build. | Implement route-specific robots and an indexable-only sitemap. Keep normal crawling allowed so noindex can be seen. Preserve the training/bulk policy. |

## Required approvals and external work

The customized `CLAUDE.md` §5 requires asking before publishing legal texts as final and before changing Cloudflare account settings or introducing data collection beyond the domain file. Legal drafts can be prepared locally without blocking unrelated work. The domain file already describes a contact form, so the form's basic implementation is in scope; creating/configuring a Turnstile widget, delivery bindings or Email Routing changes are separate Cloudflare settings actions and need the applicable authorization. Complete the concrete form/worker/draft review first rather than asking the owner to approve an unspecified future solution.

The full site launch remains incomplete until the contact route, final approved legal texts, human calculator verification and remaining launch checks are finished. Homepage indexability is a narrower decision, not a declaration that those gates passed.

## Revised phase review

The revised homepage is suitable for this limited phase release. Its new home-guide has 674 visible words after stripping HTML tags and supplies practical scope, workflow, evidence and sharing guidance. The directory defaults to the working federal beta; preparation tools require an explicit opt-in. Country cards now expose availability. Reviewed destinations are real routes or anchors, and the added copy does not introduce tax rates or unsupported financial advice.

The root-only index allowlist is explicit and deny-by-default; robots values and sitemap derive from the same policy. This makes the homepage eligible for indexing while preserving noindex for the beta and all other routes. Eligibility does not guarantee search-engine inclusion.

Minor copy suggestion: when preparation tools are enabled and a search has no results, change the empty-state heading from “No matching beta calculator yet” to “No matching calculator yet”. This is not a release blocker. Contact, final legal publication and human calculator review remain outstanding full-launch gates.

## Accessibility and scenario-comparison follow-up

Implemented targeted keyboard/ARIA fixes: search submission focuses the results heading; the fixed country is a named group rather than an invalid label target; joint combined-wage errors mark both inputs invalid; the main estimate uses a persistent result-status region through invalid/valid transitions; and the working table is a named keyboard-focusable scroll region. Existing reduced-motion support was retained.

Added optional two-scenario comparison on the existing beta. Scenario A follows the original inputs; B has independent, explicitly named inputs. Both use the unchanged estimateFederal engine. Comparison outputs are annual regardless of the main display-period setting, with signed B-minus-A differences and the same wage-base/exclusion/beta warnings. B is neither persisted nor submitted; the existing share action is explicitly A-only. Printing includes the comparison only while open.

The isolated headless Chrome regression script scripts/review-accessibility.cjs passed 31 checks before the sharing helper integration, including engine parity, equal and unequal comparison arithmetic, invalid-state handling, keyboard navigation, mobile containment, print visibility, and no network/storage writes during edits. Desktop and 375px mobile screenshots were inspected; the mobile table scrolls within its named region and now includes a sideways-scroll hint. Build passed; typecheck found zero errors (generated Playwright trace files produced unrelated hints in the concurrent workspace).

## Final multi-agent release review

The phase expanded to four deliberately limited interactive betas: US federal wage-income tax, UK equal-monthly salary, UAE traditional gratuity and India ordinary-salary regime comparison. Each has separate primary-source records, automated checks, scope exclusions and an explicit pending human-review gate. UK official component examples do not claim complete PAYE verification. UAE cap-affected cases are unsupported pending source clarification, and the page does not present zero as their entitlement. India uses the enacted current Tax Year 2026–27 rules, with the new Act section references. Australian and Canadian bracket engines remain unpublished foundations.

Final homepage guidance has 708 useful visible words. The directory defaults to available betas and lists preparations only after opt-in. The remembered country filter is optional, local and never redirects visitors. Home-only CSS was separated to preserve the conservative all-linked-CSS budget. A small-screen heading-spacing defect was corrected in the shared heading markup.

Verification evidence is in design/selected/readiness-final/: 19 routes passed desktop, mobile and 200% text layout checks; 50 portable desktop/mobile browser flows passed; all registered datasets and page budgets passed. Lighthouse 13.6 mobile lab measurements scored 100 in performance, accessibility and best practices on home and all four calculators. Home SEO scored 100; beta SEO scores reflect intentional noindex. These are local lab results, not field Core Web Vitals.

A read-only production smoke checker covers canonical/robots responses, sitemap discovery, redirects and missing-page handling after deployment. Search Console inspection before this release reported the home URL unknown to Google and no submitted sitemap; source eligibility does not establish actual indexing. Final legal publication, protected contact account setup/delivery, human calculator review and the broader full-launch gates remain pending. Local contact/retention drafts are excluded from public Git.

A clean npm ci verification also passed all 559 tests and build guards. Its 38 built files match the working build after normalizing only generated Astro island UID attributes; every JavaScript and stylesheet asset is byte-identical. Raw HTML UID differences are retained in the comparison report rather than described as a byte-identical build.
