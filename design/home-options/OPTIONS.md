# CalcsDesk · nine home-page directions

**Current version: round 2, 2 November 2026.** The original studies and notes are preserved in round-1/. The revised ranking and review below supersede the initial scores and recommendation further down this file.

## Round 2 · competitor-informed refinement

Reviewed six live sites: Calculator.net, Omni, The Salary Calculator UK, Paycalculator Australia, Wealthsimple Canada and SmartAsset. Evidence and links: ../../research/home-design-review-2026-11-02.md. This was a design review, not a full P2 audit; no conversion, traffic or speed measurements are claimed.

All concepts now name the money task clearly, expose full country names, provide a region-specific next step on cards and shorten the path to the tool directory. Search handles country aliases and multiword queries. Options 2/5/7/8/9 replace the decorative arithmetic panel with a local country/task finder. Unsupported combinations have an explicit empty state. Tool previews show the intended URL and an official reference to consult; no result or verified-rate claim is fabricated.

### Revised picks and scores

Internal judgments /50: clarity, distinction, craft, audience fit and buildability. These are comparative design judgments rather than measured user outcomes.

| Rank | Option | Scores | Total | Advice |
|---|---|---|---|---|
| 1 | **1 · The clear answer** | 10 / 8 / 9 / 10 / 9 | **46** | Best launch default: search, named countries and direct tools; minimal prior knowledge required. |
| 2 | **4 · Your country, your calculation** | 10 / 8 / 9 / 9 / 9 | **45** | Best for the regional proposition: six markets are immediately scannable. Keep search available in the eventual header. |
| 3 | **7 · The calculator workspace** | 9 / 9 / 9 / 9 / 8 | **44** | Best for repeat visitors and country hubs. Denser desktop interface; mobile starts with the guided finder. |
| 4 | 2 · Find your number | 9 / 9 / 9 / 8 / 8 | 43 | Strong first impression and clear guided entry; fewer tools are visible immediately on mobile. |
| 5 | 6 · Money has a local language | 9 / 9 / 9 / 8 / 8 | 43 | Strongest editorial country directory; less flexible for query-led visitors. |
| 6 | 8 · Put your numbers to work | 9 / 9 / 8 / 8 / 8 | 42 | Memorable task mosaic; task tiles and finder introduce some repetition. |
| 7 | 3 · A little more certainty | 9 / 8 / 9 / 8 / 8 | 42 | Warm, readable search portal; slightly less obviously a calculator product. |
| 8 | 9 · Before the big decision | 8 / 9 / 9 / 8 / 7 | 41 | Elegant and reassuring; editorial copy slows direct tool discovery. |
| 9 | 5 · One desk. Different rules. | 8 / 9 / 8 / 8 / 7 | 40 | Distinctive international positioning; country list and guided finder duplicate a choice on smaller screens. |

**Recommended final direction:** option 1 as the home-page base, option 4's country navigation for the country section, and option 7's guided start panel on country hubs. This is a recommendation only; the owner has not selected a concept.

### Round 2 verification

Re-rendered at 1440×900 and 390×844, including full desktop pages and both desktop/mobile dark variants. Visually inspected the combined sheet, option 1 desktop and option 7 mobile. All nine passed horizontal-overflow checks at mobile width and 200% enlarged text, applicable search/country/finder checks, tool-preview opening and keyboard-focus checks. No page script errors were captured. Null in qa-results.json means that interaction is not present in that option. This is not a complete accessibility audit or tax-engine validation.

---

## Original concept rationale (round 1)

Local design studies, 2 November 2026. These are previews, not a deployed site. Calculator amounts are explicitly illustrative. No rates, tax results, reviews or freshness claims are asserted. No ad integration is included; the standing ad-approval gate takes precedence over the generic concept placeholder request.

## Shared design brief

Help people find the right money calculator for their jurisdiction, then understand the working behind the result. Brand: indigo #4338CA, C mark, divider and CalcsDesk wordmark. Neutral canvases, thin rules, tabular numbers and no photography. Domain §16 supplies the axes: search first, country picker and task dashboard; each is explored in utility, bold and editorial directions. All options use the same intended launch markets and honest preview labels. Typography uses locally available Segoe UI for interface text, Georgia for editorial display and Consolas for numeric accents. No external assets or font requests.

## Moodboards

- Utility: library catalogue drawers; carefully typeset bank statements; airport wayfinding; technical reference manuals.
- Bold: transit route diagrams; large typographic exhibition signage; contemporary financial annual reports; index tabs.
- Editorial: financial newspaper mastheads; accounting ledgers; cream paper; restrained book typography.

## Concept briefs, written before implementation

1. **The clear answer — search / utility.** For visitors arriving with a question rather than a tool name. A centred, tightly composed headline and prominent search communicate the task in five seconds. A narrow country selector leads into six labelled tools. Calm and direct; the signature is a query-like search field. Twelve-column grid, 8 px rhythm, 64 px sans headline. Best for fast discovery; risk: broad search needs useful synonyms.
2. **Find your number — search / bold.** For mobile visitors who want an unmistakable entry point. A left-aligned oversized headline meets a structured search panel on the right, with category index tabs below. Confident but precise, using indigo as an action and typographic accent rather than a full background. Signature: a large numbered search sequence. Best for first-visit clarity; risk: large display text consumes space.
3. **A little more certainty — search / editorial.** For readers who need context before trusting a finance tool. An asymmetric headline and a ledger-like search form anchor the page; a narrow editorial side note explains the method. Warm paper, serif headings and ruled lists. Signature: an open-ledger composition. Best for trust and reading; risk: serif tone feels less like a fast app.
4. **Your country, your calculation — country / utility.** For jurisdiction-led tasks. A compact introduction sits next to a country index, with a full-width six-market selector as the primary visual. Every country card names its relevant launch tool. Signature: an easy-to-scan jurisdiction matrix. Best for global navigation; risk: one extra choice for returning visitors.
5. **One desk. Different rules. — country / bold.** For a global audience that needs to understand why location matters. A broad headline is paired with a tall, indexed destination rail; region-specific calculator names replace generic country tiles. Signature: vertical country navigation like a departure board. Best for distinctiveness and regional depth; risk: uneven card heights need careful mobile ordering.
6. **Money has a local language — country / editorial.** For international workers and movers. A newspaper-style masthead over a two-column country atlas gives markets clear editorial hierarchy without maps or flags. Signature: country names as large typographic navigation. Best for sophisticated global positioning; risk: lower density than the utility grid.
7. **Make the next decision clearer — task / utility.** For visitors who know their money task. A left task rail, central calculator directory and right sample working panel form a calm instrument desk. Signature: an explanation panel adjacent to discovery. Best for a usable calculator product; risk: three-column density must collapse cleanly.
8. **Put your numbers to work — task / bold.** For action-oriented visitors comparing pay, tax and benefits. A large task mosaic anchors the hero beside a compact comparison preview. Indigo rules and oversized index numerals create hierarchy. Signature: a two-scenario arithmetic example, never a tax estimate. Best for an app-like identity; risk: sample comparison must stay clearly labelled.
9. **Before the big decision, do the maths. — task / editorial.** For considered financial choices. A magazine-style lead pairs a serif statement with an accounting worksheet; below it, tasks become a compact table of contents. Signature: visible working with a simple arithmetic illustration. Best for the brand promise; risk: more editorial than utilitarian.

## Interaction and states

Search filters the visible preview directory locally and announces the number of matches; no result produces a helpful empty state. Country/task buttons filter the same directory. Preview tool links explain that calculators are not built yet. Theme toggle supports dark mode. Hover uses a short border change; keyboard focus is visible. No animation is needed, and reduced motion is respected. Preview search values are never sent anywhere. Controls and input labels remain visible on mobile.

## Review

Scores below are internal design judgments, not measured performance or accessibility certification. Order: task clarity / distinctiveness / craft / audience fit / buildability, each out of 10. Screenshot and layout QA results are appended after rendering.

| Option | Scores | Total /50 | Rationale |
|---|---|---|---|
| 1 | 10 / 8 / 9 / 10 / 9 | 46 | The fastest general-purpose entry. The search and country chips have the clearest hierarchy. |
| 2 | 9 / 9 / 9 / 9 / 9 | 45 | Strong first impression with a clearly bounded search task. Retains a light financial utility tone. |
| 3 | 9 / 9 / 9 / 9 / 9 | 45 | Warm, deliberate typography makes the method approachable. The search stays above the fold. |
| 4 | 10 / 8 / 9 / 10 / 9 | 46 | The jurisdiction model is immediately understandable. Market-specific tool labels prevent vague navigation. |
| 5 | 9 / 10 / 9 / 9 / 9 | 46 | The destination rail is memorable and gives each market its own entry point. |
| 6 | 9 / 9 / 10 / 9 / 9 | 46 | The atlas composition has strong editorial character while remaining lightweight. |
| 7 | 10 / 9 / 9 / 10 / 9 | 47 | Closest to a practical calculator workspace. Explanation and discovery reinforce each other. |
| 8 | 9 / 10 / 9 / 9 / 9 | 46 | The task mosaic and comparison create a useful product identity. |
| 9 | 9 / 9 / 10 / 10 / 9 | 47 | The worksheet gives concrete visual meaning to “show their working.” |

**Recommendation:** 1 for the clearest launch experience; 7 for the strongest ongoing product experience. The owner chooses; no option is selected automatically.

## Render and interaction verification

Rendered using Playwright with installed Chrome: nine 1440×900 desktop previews, full-page desktop captures, nine 390×844 mobile previews, and desktop/mobile dark variants. The desktop contact sheet was visually inspected. All nine passed horizontal-overflow checks at mobile width and with text enlarged to 200%; the preview search (where present), country filters and keyboard focus checks passed without page-script errors. These checks do not constitute a full accessibility audit or verify tax calculations. Raw results: qa-results.json.

Files: contact-sheet.png includes all desktop concepts and a mobile strip; dark-contact-sheet.png compares the dark variants. Open index.html for the clickable gallery, then open any concept. P7 remains pending the owner's selection.
