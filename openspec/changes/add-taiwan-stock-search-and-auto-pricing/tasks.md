## 1. Provider And Parsing Foundation

- [x] 1.1 Add focused tests for TWSE and TPEx quote parsing, source routing, TWD currency results, and invalid close-price errors.
- [x] 1.2 Extend `lib/pricing.ts` quote provider types to include `twse` and `tpex`.
- [x] 1.3 Implement Taiwan source ID parsing for `TWSE:<code>` and `TPEX:<code>` while preserving unprefixed FMP stock symbols.
- [x] 1.4 Implement TWSE daily close price fetch from `https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`.
- [x] 1.5 Implement TPEx daily close price fetch from `https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes`.
- [x] 1.6 Update `fetchQuoteForSource()` to return Taiwan stock quotes with `currency: "TWD"`.

## 2. Taiwan Listed-Stock Search

- [x] 2.1 Add focused tests for Taiwan stock search matching by code, `.TW` / `.TWO` display symbol, Chinese name, and free official English abbreviation.
- [x] 2.2 Add TWSE search data loading that joins daily quote rows with profile rows from `https://openapi.twse.com.tw/v1/opendata/t187ap03_L`.
- [x] 2.3 Add TPEx search data loading that joins daily quote rows with profile rows from `https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O`.
- [x] 2.4 Update `fetchListedStocksFromAPI(query)` to return Taiwan results alongside existing FMP results without requiring a new category.
- [x] 2.5 Ensure English matching is skipped when unavailable from free official profile data; do not add paid providers, new dependencies, new environment variables, web search, or scraping fallback.
- [x] 2.6 Ensure Taiwan search results save existing holding fields only: `name`, `symbol`, `sourceId`, and `sourceURL`.

## 3. Existing Workflow Integration

- [x] 3.1 Verify holding create form continues using the existing listed-stock search and read-only selected holding fields.
- [x] 3.2 Verify balance create form auto-fills Taiwan prices through `fetchListedStockPriceFromAPI()` when a Taiwan holding is selected.
- [x] 3.3 Verify balance edit form auto-fills Taiwan prices through the same listed-stock price action.
- [x] 3.4 Keep UI changes limited to result labels or helper text needed to distinguish Taiwan holdings; record any unresolved design-system conflict if one appears.

## 4. Monthly Refresh

- [x] 4.1 Add or update database-backed monthly refresh tests for copied Taiwan balances becoming pending quote-backed assets.
- [x] 4.2 Add monthly refresh success coverage proving Taiwan prices update balance price, value, TWD currency, price status, fetched timestamp, and asset price snapshot.
- [x] 4.3 Add monthly refresh failure coverage proving missing or invalid Taiwan quotes mark balances and snapshots failed with retryable provider errors.
- [x] 4.4 Update monthly refresh provider grouping and provider counts so TWSE and TPEx sources process through the existing refresh workflow.

## 5. Validation And Handoff

- [x] 5.1 Run focused pricing/search tests.
- [x] 5.2 Run `npm run test` if monthly refresh database-backed tests changed.
- [x] 5.3 Run `npm run typecheck`.
- [x] 5.4 Run `npm run lint`.
- [x] 5.5 Run `npm run build`.
- [x] 5.6 Run manual visual review of the holding and balance forms against `docs/design-system.md`; report skipped viewport checks if not performed.
- [x] 5.7 Record local validation results, skipped checks, and manual-only review notes before moving to commit, deployment, smoke check, or archive gates.

## Validation Notes

- `npx vitest run tests/pricing.test.ts` passed: 5 tests.
- `npm run test` passed: 7 files, 41 tests. The run used an isolated `family_ledger_test_*` Prisma schema. Existing FX credential warnings appeared during value-data rebuild paths but did not fail the run.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Live official endpoint shape check passed for TWSE `2330`, TPEx `8069`, TWSE profile `2330`, and TPEx profile `8069`.
- Manual UI review: holding create, balance create, and balance edit forms continue using the existing listed-stock search and `fetchListedStockPriceFromAPI()` paths. No UI component or styling change was needed, so no new design-system conflict was recorded.
- Skipped manual browser viewport checks because this change did not alter form layout, visible controls, or responsive styling.
- Deployment gates not started: no commit, push, Vercel deployment, deployed smoke check, or archive performed in this implementation pass.
