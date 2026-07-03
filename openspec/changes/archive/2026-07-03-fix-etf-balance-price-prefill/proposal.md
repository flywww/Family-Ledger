## Why

Selecting an existing ETF holding in the new balance form can leave the price field at `0`, even though US stock holdings already prefill a quote. This creates incorrect balance values unless the user notices and manually enters the ETF price.

## What Changes

- Ensure existing US-listed ETF holdings use the same listed-security quote path as US stock holdings when selected in the new balance form.
- Preserve the existing create-balance workflow: selecting a holding should update `holdingId`, prefill `price`, set the quote currency, and recalculate `value`.
- Treat provider failures as non-destructive: do not overwrite a manually entered price with `0` when an ETF quote cannot be fetched.
- Add a no-key fallback quote lookup for US-listed ETF symbols when Financial Modeling Prep blocks ETF quote endpoints for the current subscription.
- Add focused regression coverage for ETF price lookup through the public quote/prefill interface.
- Record manual create-balance workflow review because this is an authenticated UI flow.

## Capabilities

### New Capabilities
- `balance-price-prefill`: Price prefill behavior when an existing holding is selected in the create-balance workflow.

### Modified Capabilities
- `taiwan-stock-auto-pricing`: Preserve the existing Taiwan listed-stock pricing path while fixing ETF price prefill behavior for listed holdings.

## Impact

- Affected code: `components/balance/balance-create-form.tsx`, potentially shared balance form quote helpers, `lib/actions.ts`, `lib/pricing.ts`, and focused tests.
- Affected behavior: `/balance/create` holding selection for listed-stock/ETF holdings.
- External systems: existing Financial Modeling Prep quote provider plus no-key Yahoo chart fallback for US-listed symbols blocked by FMP subscription limits; no new dependency, environment variable, database schema, or migration.
- Validation path: focused Vitest coverage for ETF quote/prefill behavior, `npm run typecheck`, `npm run lint`, and manual authenticated create-balance review if credentials/browser state are available.
- Visual impact: small. Reuses the existing create-balance form and holding combobox; no new reusable component.
