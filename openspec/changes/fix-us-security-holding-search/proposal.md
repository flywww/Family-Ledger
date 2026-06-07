## Why

Users cannot reliably search and add US stocks or ETFs from the create balance page because the app was still calling a legacy Financial Modeling Prep search endpoint and valid results were also filtered too narrowly. This blocks normal listed-security balance entry for common US assets such as Tesla and ETFs.

## What Changes

- Move listed-security search to the current FMP stable search endpoint so US stocks and ETFs can appear in the create-balance Add Holding flow.
- Broaden listed-security filtering so recognized US exchanges are accepted instead of one narrow NASDAQ label.
- Preserve Taiwan listed-stock results from the existing official-source flow.
- Preserve existing holding creation metadata shape: selected results still populate `name`, `symbol`, `sourceId`, and `sourceURL`.
- Add focused regression coverage for NYSE/NASDAQ-listed US equities and ETF search results.

## Capabilities

### New Capabilities
- `listed-security-holding-search`: Listed stock and ETF search behavior used by the create-balance Add Holding workflow.

### Modified Capabilities
- `taiwan-stock-auto-pricing`: Preserve existing Taiwan listed-stock search and pricing behavior while broadening US listed-security search.

## Impact

- Affected code: `lib/actions.ts`, potentially `lib/pricing.ts`, and create-balance holding search UI paths in `components/balance/holding-create-form.tsx`.
- Affected tests: focused Vitest coverage for listed-security search normalization/filtering.
- External systems: existing Financial Modeling Prep provider using current stable endpoints; no new provider, dependency, environment variable, database schema, or migration.
- Validation path: `npm run typecheck`, `npm run lint`, focused Vitest command for pricing/search behavior, and manual create-balance search review if browser credentials are available.
- Visual impact: small. Reuses the existing Add Holding dialog and combobox; no new reusable component.
