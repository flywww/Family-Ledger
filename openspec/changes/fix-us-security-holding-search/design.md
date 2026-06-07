## Context

The create balance page lets users add a new listed holding through `components/balance/holding-create-form.tsx`. That dialog calls `fetchListedStocksFromAPI()` in `lib/actions.ts`, which merges official Taiwan listed-stock results with Financial Modeling Prep search results for US-listed securities.

The current FMP result handling calls a legacy `/api/v3/search` endpoint that now returns a `403 Legacy Endpoint` response for the maintainer's current key. It also only kept rows whose `stockExchange` equals `NASDAQ Global Select`, which is too narrow for US listed assets: it excludes common NYSE securities, other NASDAQ market labels, and ETF rows. The database schema and holding metadata model already support these assets through `symbol`, `sourceId`, and `sourceURL`, so the fix should stay inside search normalization/filtering and existing UI selection behavior.

## Goals / Non-Goals

**Goals:**
- Return valid US stock and ETF results from the current FMP stable search endpoint in listed holding search.
- Keep Taiwan listed-stock search and source metadata unchanged.
- Keep selected listed-security metadata compatible with `createHolding()`.
- Cover the regression through a public search interface test.

**Non-Goals:**
- No new market data provider.
- No new dependency or environment variable.
- No Prisma schema or migration change.
- No redesign of the create-balance form.
- No change to quote refresh provider identity beyond preserving existing unprefixed FMP source IDs.

## Decisions

- Use FMP stable endpoints for US listed-security search and price fetch.
  - Rationale: the legacy search endpoint now returns `403 Legacy Endpoint`, and selecting a US result also calls price fetch immediately.
  - Alternative considered: keep the legacy endpoint and only change exchange filtering. Rejected because live TSLA lookup still fails before filtering.

- Broaden FMP filtering by excluding known non-US or malformed rows rather than accepting only one exact exchange label.
  - Rationale: FMP stable search returns the needed `symbol`, `name`, `exchange`, and currency metadata; the old exact label filter is too narrow.
  - Alternative considered: remove exchange filtering entirely. Rejected because the create-balance US search would be more likely to include unrelated international rows when users search broad terms.

- Keep the FMP source ID as the unprefixed symbol.
  - Rationale: `taiwan-stock-auto-pricing` already relies on unprefixed listed-stock source IDs continuing through Financial Modeling Prep.
  - Alternative considered: introduce `FMP:<symbol>`. Rejected because it would require source parsing and migration decisions outside this bug fix.

- Put regression coverage around the listed-security search normalization path.
  - Rationale: the bug is provider-response filtering, and a focused test can prove NYSE stock, NASDAQ stock, and ETF rows survive without browser credentials.
  - Manual review remains required for the authenticated create-balance dialog because deterministic Playwright auth is not yet established.

## Risks / Trade-offs

- Broader FMP rows may include securities from US OTC or ambiguous exchange labels -> Mitigation: normalize known US exchange labels and keep the result limit.
- ETF identification depends on FMP search response shape -> Mitigation: do not require a specific ETF type field; accept ETF rows when their exchange is a recognized US exchange.
- Authenticated UI proof may not be automated in this change -> Mitigation: record manual create-balance search review as a task item if credentials/browser setup are unavailable.

## Visual Review

Visual Validation plan: because this change reuses the existing shadcn/Radix dialog and command combobox, visual review is limited to the containing create-balance workflow. Verify that opening Add Holding for a listed-stock category still shows the existing dialog, search results remain readable, selecting a US stock or ETF fills the Name and Symbol fields, and no overflow or unrelated stacked content appears in the dialog.

Manual review path: authenticated create-balance page review at desktop width. If credentials or deterministic browser auth are unavailable, record that the visual and create-and-visible checks were skipped and rely on focused search tests plus code inspection for this turn.
