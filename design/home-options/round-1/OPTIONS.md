# CalcsDesk · nine home-page directions

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
