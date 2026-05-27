## Context

Family Ledger currently supports quote-backed holdings through the existing listed-stock and cryptocurrency flows. Holding creation searches provider data from `lib/actions.ts`, stores provider metadata in `Holding.sourceId` and `Holding.sourceURL`, then balance create/edit forms call narrow server actions to fetch prices. Monthly refresh deduplicates quote sources through `lib/monthly-refresh.ts` and provider adapters in `lib/pricing.ts`.

Taiwan stocks need to fit this same workflow. The user wants free API support, search by number, symbol, stock name, and English abbreviation when free official data already provides it, with no separate Taiwan-only process. Official TWSE and TPEx OpenAPI endpoints provide free no-key daily close quote data and company-profile data. TWSE profile rows include `英文簡稱` such as `TSMC`; TPEx profile rows include `Symbol` such as `EIH`.

## Goals / Non-Goals

**Goals:**

- Add Taiwan stock search to the existing listed-stock holding creation flow.
- Match Taiwan stocks by stock code, display symbol, Chinese company name or abbreviation, and free official English abbreviation when available.
- Fetch Taiwan stock prices automatically from official no-key daily close quote endpoints.
- Store Taiwan quote source metadata in existing holding fields without changing the Prisma schema.
- Preserve existing crypto and US listed-stock behavior.
- Keep provider calls server-side and covered by focused tests.

**Non-Goals:**

- Real-time intraday Taiwan quotes.
- English company-name search that requires paid providers, new dependencies, new environment variables, web search, or scraping.
- Full English company-name fuzzy search beyond free official abbreviation fields.
- New paid API providers, dependencies, or environment variables.
- Prisma schema or migration changes.
- Major redesign of holding or balance forms.

## Decisions

1. Use official TWSE and TPEx daily close data as the Taiwan price source.
   - Rationale: It is free, no-key, official, and suitable for a monthly ledger.
   - Alternative considered: Yahoo Finance quote/search endpoints. They are easier for symbols like `2330.TW`, but are unofficial and returned rate-limit responses during exploration.
   - Validation: Focused pricing tests with mocked TWSE/TPEx responses and manual review of provider terms/source URLs.

2. Join quote rows with free official company-profile rows for search.
   - Rationale: Daily quote rows provide current code, Chinese name, and close price; company-profile rows provide English abbreviation fields for searches like `TSMC` when the exchanges publish them.
   - Alternative considered: Search quote rows only. That would miss free official English abbreviation matches.
   - Alternative rejected: Add paid English search, new API keys, web search, or scraping. The user explicitly prefers skipping English matching instead of adding those costs or moving parts.
   - Validation: Search tests for `2330`, `2330.TW`, `台積電`, `TSMC`, `8069`, `8069.TWO`, `元太`, and `EIH`.

3. Encode Taiwan provider identity in `Holding.sourceId`.
   - Format: `TWSE:<code>` for TWSE listed stocks and `TPEX:<code>` for TPEx OTC stocks.
   - Rationale: Existing holdings have only `sourceId` and `sourceURL`; the prefix avoids ambiguity without a migration.
   - Alternative considered: Add a provider column to `Holding`. That is cleaner long term but requires a migration and explicit database approval.
   - Validation: Unit tests for `getHoldingQuoteSource()` and existing Zod schemas.

4. Return Taiwan quote currency as `TWD`.
   - Rationale: Taiwan stock prices are quoted in New Taiwan dollars, and existing balance/value-data logic already preserves row currency and converts display values through FX helpers.
   - Alternative considered: Convert Taiwan prices to USD during quote fetch. That would hide original quote currency and duplicate conversion responsibility.
   - Validation: Monthly refresh tests assert refreshed Taiwan balances store TWD and rebuild value data through the existing conversion path.

5. Keep UI changes narrow.
   - Rationale: The existing command popover and add-holding flow already match the user’s requested process.
   - Implementation direction: Reuse the same controls and improve option labels only if needed to distinguish Taiwan results, for example `台積電 (2330.TW)`.
   - Validation: Manual visual review against `docs/design-system.md`; no prototype is required because this is a small extension to an existing form, not a new screen.

## Risks / Trade-offs

- Official endpoints are daily close, not live quotes -> label implementation and tests around daily-close behavior, and do not imply intraday freshness.
- TWSE and TPEx field names differ and include Chinese keys -> isolate parsing in small adapter helpers and cover both providers with tests.
- English abbreviation availability may be inconsistent -> search by English abbreviation only where free official profile data provides it; do not add paid providers, new keys, web search, or scraping to fill gaps.
- Existing `Listed stock` category also covers US stocks -> route by `sourceId` prefix first, and leave unprefixed symbols on the existing FMP path.
- Adding provider fetches to search can increase latency -> fetch TWSE/TPEx data in parallel and limit returned results to the same approximate size as existing listed-stock search.

## Migration Plan

- No database migration is required.
- Existing US listed-stock holdings keep their current FMP `sourceId` values and behavior.
- New Taiwan holdings use prefixed `sourceId` values. Rollback is code-only: remove Taiwan provider routing and search results; existing Taiwan holdings would remain saved but no longer auto-price until support is restored.

## Open Questions

- None for v1. The accepted default is official daily close pricing for TWSE and TPEx.
