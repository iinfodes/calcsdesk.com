# CalcsDesk · calcsdesk.com

Project code: AD01. The owner's local workspace includes `CLAUDE.md`, `DOMAIN_FILE.md`, `KIT/` and `ops/`. Those internal handover and account-operations files are intentionally excluded from this public repository.

The handover is copied from the owner's INFODES_FINAL folder. The selected design is implemented locally with Astro, TypeScript and Preact: option 1 home, option 4 country section and option 7 country-page finder. No deployment has been made. No ad files or ad code have been generated.

P7 is complete. The home page, six country hubs, methodology, sources and 404 layout are built. Search, country filters, guided selection, mobile navigation and persistent dark mode work. Calculator engines are not implemented; tools are labelled in preparation, all pages remain noindex and no sitemap is emitted. Legal/contact work, sourced rates, accuracy tests and launch checks are still outstanding.

Cloudflare setup remains incomplete pending approved external changes and verification; account identity has been confirmed. The owner's local workspace contains the setup plan.

## Local development

- `npm ci` installs the locked dependencies.
- `npm run dev` starts the development site.
- `npm run verify` checks types, builds, and checks metadata, links, structured data, noindex, no-email and no-ad requirements.
- `npm run build` produces `dist/` for a future Cloudflare Pages deployment.

Review screenshots are in `design/selected/`. The isolated local layout-review helper, `scripts/review-layout.cjs`, uses this desktop's bundled browser libraries and installed Chrome; it is a local review utility rather than a portable CI browser suite. Its results are in `design/selected/review-results.json`.
