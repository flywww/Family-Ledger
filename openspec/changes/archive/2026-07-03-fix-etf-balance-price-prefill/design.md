## Context

The create balance page uses `components/balance/balance-create-form.tsx` to let a user choose a category, type, and existing holding. When the selected category is quote-backed, selecting a holding calls the listed-stock or cryptocurrency price action and writes the returned price into the form. The observed regression is that ETF holdings can remain at the default `0` price after selection, while US stock holdings work.

The pricing adapter already supports unprefixed Financial Modeling Prep symbols and Taiwan-prefixed source IDs (`TWSE:` / `TPEX:`). The likely implementation surface is therefore the create-balance prefill decision path and its contract with holding metadata, not a new market-data provider.

Relevant source docs inspected: `docs/architecture-guide.md`, `docs/testing-strategy.md`, `docs/validation-harness.md`, and `docs/design-system.md`.

## Goals / Non-Goals

**Goals:**
- Prefill a non-zero ETF quote when an existing ETF holding with valid quote metadata is selected in `/balance/create`.
- Preserve US stock, Taiwan listed-stock, and cryptocurrency quote behavior.
- Avoid overwriting a user-entered or existing form price with `0` when a provider response fails or is invalid.
- Cover the behavior through focused tests around the public quote/prefill interface.
- Record authenticated create-balance manual review evidence when implementation is complete.

**Non-Goals:**
- No new paid quote provider, dependency, or environment variable. A no-key Yahoo chart fallback is allowed only after FMP quote endpoints fail for US-listed symbols.
- No new dependency, environment variable, Prisma model, or migration.
- No redesign of the create-balance page or holding combobox.
- No change to monthly refresh behavior except preserving existing quote routing.
- No broad refactor of `lib/actions.ts` or all balance form state.

## Decisions

- Diagnose and fix the create-balance holding-selection prefill path before changing providers.
  - Rationale: ETF search and quote adapter support already exists, and the user reports US stock quote prefill works. The highest-risk regression is inconsistent classification or metadata handling for ETF holdings in the form.
  - Alternative considered: add an ETF-specific provider branch. Rejected because US-listed ETFs should use the same FMP quote endpoint as US stocks.

- Treat valid ETF holdings as listed securities, not as a separate form category.
  - Rationale: existing search results store FMP ETF source IDs as unprefixed symbols such as `VOO`, `VT`, or `QQQ`, which are compatible with the listed-stock quote action.
  - Alternative considered: introduce a separate ETF category rule. Rejected because it would expand product taxonomy and risk breaking existing holdings.

- Keep provider failures visible but non-destructive.
  - Rationale: a failed quote fetch should not silently leave or write `0` as if it were a real market price. The user can still manually enter a price.
  - Alternative considered: always clear the price to `0` before fetch. Rejected because it makes transient provider errors look like valid zero prices.

- Use Yahoo chart only as a last-resort fallback after FMP quote endpoints fail for a US-listed symbol.
  - Rationale: the maintainer's current FMP subscription blocks ETF quote endpoints with HTTP 402, while Yahoo chart returns structured USD ETF prices without a new key or dependency.
  - Alternative considered: require an FMP plan upgrade. Rejected because the form should work for existing ETF holdings under the current setup.

- Use focused tests before UI review.
  - TDD behavior: selecting an ETF-compatible listed holding causes the public quote/prefill path to return a numeric ETF price and preserve USD currency.
  - Public interface: the listed-security quote action or an extracted public form prefill helper used by `CreateBalanceForm`.
  - Mocking: mock only provider/network responses such as FMP; do not mock internal form helpers or pricing adapter internals.
  - Module depth: keep a small public interface with quote classification hidden behind the pricing/action layer.
  - Refactoring checkpoint: only extract a shared helper if it removes duplication between create/edit forms or makes the prefill behavior testable without exposing implementation details.

## Risks / Trade-offs

- ETF holdings created before the search fix may have missing or malformed `sourceId` metadata -> Mitigation: implementation should detect missing quote metadata and leave manual price entry intact, with manual review noting any legacy-data limitation.
- FMP may block ETF quote endpoints under the current subscription -> Mitigation: add focused tests for 402 fallback to Yahoo chart and invalid fallback responses.
- Authenticated UI automation may not be deterministic -> Mitigation: run focused automated tests and record manual `/balance/create` review, or explicitly report skipped browser proof.
- Small UI state changes can regress form value recalculation -> Mitigation: verify price and value update together after ETF selection.

## Visual Review

Visual Validation plan: visual impact is small because the existing create-balance form and shadcn/Radix combobox are reused. Review the containing workflow at `/balance/create`: select a listed-stock category and asset type, choose an ETF holding, confirm the price input changes from `0` to the fetched price, confirm the value field recalculates when quantity is present, and confirm no layout overflow or unrelated stacked content appears.

## Validation Strategy

- Focused automated test for ETF quote/prefill behavior, preferably `pnpm exec vitest run tests/pricing.test.ts` or a narrower balance-form helper test if a public helper is extracted. Pricing tests must cover FMP 402 fallback to Yahoo chart for ETF symbols.
- `npm run typecheck`
- `npm run lint`
- Manual authenticated `/balance/create` create-and-visible review: select an ETF holding, verify price and value fields, save a balance if safe test data is available, and confirm the created balance is visible in the balance list for the selected month.
