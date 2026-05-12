## Why

The Dashboard currently shows asset trend and asset ratio charts, but it does not give an equally visible view of liabilities. Adding liability chart coverage makes the monthly finance cockpit more complete without sending the user to the Balance table for basic liability composition.

## What Changes

- Add a liability trend chart to the Dashboard chart section using existing monthly `ValueData`.
- Add a liability ratio pie chart under the existing Assets ratio area so assets and liabilities can be compared in the same dashboard scan.
- Preserve the current asset charts and category filtering behavior.
- Use existing chart primitives, card styling, semantic tokens, and accessible labels; no new dependency is expected.
- Keep the implementation read-only and avoid Prisma schema, migration, seed, or database reset changes.

## Capabilities

### New Capabilities

- `dashboard-liability-charts`: Dashboard chart behavior for monthly liability trend and liability composition views.

### Modified Capabilities

- None.

## Impact

- Affected UI: `app/(auth)/dashboard/page.tsx`, `components/dashboard/chart-section.tsx`, and existing chart components under `components/dashboard/`.
- Visual impact: small
- Affected data flow: Dashboard continues to consume converted `ValueData` filtered by selected categories and selected month.
- Affected validation: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:unit` if chart data shaping is extracted into testable logic, plus manual visual review of `/dashboard` at desktop and mobile widths.
