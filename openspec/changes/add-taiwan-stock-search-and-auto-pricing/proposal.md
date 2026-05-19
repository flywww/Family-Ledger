## Why

Family Ledger can already add quote-backed cryptocurrency and US listed-stock holdings, but Taiwan stocks require manual entry even though they are a core local asset class for this user. Adding Taiwan stock search and automatic pricing keeps the holding creation and balance refresh workflow consistent across crypto, US stocks, and Taiwan stocks.

## What Changes

- Add Taiwan stock lookup to the existing listed-stock holding search flow.
- Support searching Taiwan stocks by stock number, display symbol, Chinese stock name, and free official English abbreviation when available, such as `2330`, `2330.TW`, `台積電`, and `TSMC`.
- Fetch Taiwan stock prices automatically from official free no-key TWSE and TPEx daily close data.
- Skip English-name matching whenever it would require a paid provider, new environment variable, new dependency, or non-official search/scraping fallback.
- Store Taiwan stock quote source metadata in existing holding fields so the balance create/edit forms and monthly refresh workflow can reuse the current listed-stock process.
- Preserve existing CoinMarketCap cryptocurrency and Financial Modeling Prep US listed-stock behavior.
- No Prisma schema change, dependency addition, or new environment variable is planned.

## Capabilities

### New Capabilities

- `taiwan-stock-auto-pricing`: Taiwan listed-stock lookup and daily-close price refresh for holdings.

### Modified Capabilities

- None.

## Impact

- Pricing integration: `lib/pricing.ts` gains TWSE and TPEx provider support and TWD quote results.
- Server actions: `lib/actions.ts` expands listed-stock search and price routing while keeping provider calls server-side.
- Monthly refresh: `lib/monthly-refresh.ts` includes Taiwan stock quote sources in the existing pending, success, failed, and retry workflow.
- UI workflow: existing holding create and balance create/edit components keep the same user-facing process, with Taiwan results appearing in the listed-stock search options.
- Tests: focused pricing/search tests and monthly refresh coverage validate Taiwan stock behavior.
