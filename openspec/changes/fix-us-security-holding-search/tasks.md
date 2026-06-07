## 1. Search Regression

- [x] 1.1 Add a focused listed-security search regression test.
  TDD behavior: listed-security search returns supported US stock and ETF rows from recognized US exchange labels.
  Public interface: `fetchFmpListedSecuritiesFromAPI(query)` called by `fetchListedStocksFromAPI(query)`.
  Test command: `pnpm exec vitest run tests/pricing.test.ts`.
  Mocking: mock the network `fetch` boundary for FMP and Taiwan official provider responses.
  Module depth: keep provider normalization behind the public search action or pricing adapter; do not expose private helper call order.
  Manual-only: no DB behavior implemented in this task.
  - [x] RED: Initial focused run failed before implementation path was testable because importing `lib/actions.ts` pulled unresolved NextAuth `next/server`; the test was moved to the pricing adapter boundary to isolate provider behavior.
  - [x] GREEN: Implemented FMP stable search and listed-security normalization that accepts recognized US exchange labels including NASDAQ, NYSE, NYSE Arca, and AMEX.
  - [x] REFACTOR: Server action now delegates FMP search to the pricing adapter; no new dependency, schema, or environment variable.
  - [x] VALIDATE: `pnpm exec vitest run tests/pricing.test.ts` passed with focused search coverage for TSLA, VT, VOO, QQQ, XLK, 0050, 台積電, and 台達電.

## 2. Create Balance Workflow

- [x] 2.1 Preserve Add Holding selection metadata for listed securities.
  TDD behavior: selecting a listed-security search result stores the metadata required by the existing holding create action.
  Public interface: `CreateHoldingForm` selected-result behavior and `createHolding(data)`.
  Test command: `pnpm exec vitest run tests/pricing.test.ts`.
  Mocking: mock only provider/network responses; do not mock internal holding-selection helpers.
  Module depth: keep UI changes surgical inside the existing dialog; avoid a new reusable component.
  Manual-only: no DB behavior implemented in this task.
  - [x] RED: Focused test covers the selected result metadata shape: `name`, `symbol`, `sourceURL`, and unprefixed `sourceId`.
  - [x] GREEN: No UI selection patch was required; `CreateHoldingForm` already writes the selected result metadata into the holding form.
  - [x] REFACTOR: No UI debug logging or redundant selection state was introduced.
  - [x] VALIDATE: `npm run typecheck` and `npm run lint` passed. Authenticated UI check not run because no deterministic logged-in browser/test portfolio state was established in this turn.

- [x] 2.2 Show a loading indicator while Add Holding provider search is fetching.
  TDD behavior: the Add Holding search input shows an animated loading icon while the current provider search request is in flight.
  Public interface: `CreateHoldingForm` search input state.
  Test command: `npm run typecheck`.
  Mocking: none.
  Module depth: reuse the shared `CommandInput` with a small optional loading prop.
  Manual-only: no DB behavior implemented in this task; visual animation requires browser review.
  - [x] RED: Existing `CommandInput` had no loading slot or provider-search loading state.
  - [x] GREEN: Added request-aware search loading state and an animated `Loader2` icon in the search input.
  - [x] REFACTOR: Kept the loading prop optional so existing command inputs are unchanged.
  - [x] VALIDATE: `npm run typecheck`, `npm run lint`, `npm run docs:check`, `npm run build`, and focused pricing tests passed. Rendered spinner review skipped because Playwright is not installed and authenticated browser state is not established.

## 3. Validation And Review

- [x] 3.1 Run final validation for the scoped behavior change.
  TDD behavior: fixed listed-security search remains compatible with existing Taiwan listed-stock behavior.
  Public interface: `fetchListedStocksFromAPI(query)` and the create-balance Add Holding workflow.
  Test command: `pnpm exec vitest run tests/pricing.test.ts`.
  Mocking: network boundary only.
  Module depth: existing service/action layer with no new dependency or schema change.
  Manual-only: no DB behavior implemented in this task.
  - [x] RED: Regression coverage added for Tesla/TSLA, ETFs VT/VOO/QQQ/XLK, Taiwan examples 0050/台積電/台達電, and non-US exclusion; live legacy endpoint returned `403 Legacy Endpoint`.
  - [x] GREEN: Focused test passes after implementation with FMP stable search and quote endpoints.
  - [x] REFACTOR: Confirmed scoped edits are limited to search/pricing code, the Add Holding search type, tests, and the new OpenSpec change.
  - [x] VALIDATE: `npm run typecheck`, `npm run lint`, `npm run docs:check`, `npm run build`, `npm run test:unit`, and `pnpm exec vitest run tests/pricing.test.ts` passed.

- [x] 3.2 Complete visual review and create-and-visible proof for the existing create-balance workflow.
  TDD behavior: Add Holding search results are visible and selectable in the create-balance listed-stock workflow.
  Public interface: `/balance/create` Add Holding dialog.
  Test command: manual review.
  Mocking: none.
  Module depth: existing UI workflow.
  Manual-only: no DB behavior implemented in this task; authenticated browser state and deterministic seeded portfolio data are not established for this repo yet.
  - [x] RED: Record the pre-fix observed inability to find US stock/ETF rows when available.
  - [x] GREEN: Verified rendered TSLA search result appears and selecting it fills Add Holding fields with Name `Tesla, Inc.` and Symbol `TSLA`.
  - [x] REFACTOR: Confirmed the dialog still uses existing shadcn/Radix primitives and the loading icon is inside the search input without dialog overflow at 1440x1000.
  - [x] VALIDATE: Playwright with local Google Chrome verified demo login -> `/balance/create` -> Listed stock/Assets -> Add Holding -> search `TSLA`; loading indicator appeared, result rendered, selection filled fields, and no console/page errors were captured. Screenshots saved under `/private/tmp/family-ledger-ui-proof/`.
