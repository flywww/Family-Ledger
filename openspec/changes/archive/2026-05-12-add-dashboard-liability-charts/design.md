## Context

The Dashboard route already resolves the selected month, loads user settings, filters categories, converts `ValueData` into the selected display currency, and passes the result to `ChartSection`. `ChartSection` currently shapes two asset-only datasets: a multi-month asset line chart and a selected-month asset ratio pie chart.

Liabilities already exist in the same `ValueData` read model through `data.type.name === "Liabilities"`, so the change can stay in the presentation/data-shaping layer. The implementation must follow `docs/design-system.md` for chart cards, token-backed colors, tabular finance values, responsive layout, and manual visual review. No Prisma schema, migration, external dependency, or production data workflow change is needed.

## Goals / Non-Goals

**Goals:**

- Show liability trend and liability ratio charts on the Dashboard using the existing converted `ValueData` array.
- Keep category filtering consistent with the current asset charts.
- Reuse existing chart primitives and card layout patterns where practical.
- Preserve accessible chart titles, legends, and readable empty/zero-data behavior.
- Validate through existing app checks and manual visual review at desktop and mobile widths.

**Non-Goals:**

- Do not add new database models, migrations, seed data, or reset behavior.
- Do not change how `ValueData` is generated, refreshed, converted, or stored.
- Do not add a new charting library or broad dashboard framework.
- Do not redesign the full Dashboard page or alter SummarySection calculations.

## Decisions

1. Build liability charts from existing `ValueData` in `ChartSection`.

   Rationale: Dashboard chart reads are already supposed to prefer `ValueData`, and the route has already applied user category filtering and currency conversion. Reusing that array keeps the change narrow.

   Alternative considered: query balances directly for liabilities. Rejected because it duplicates dashboard read-model work and conflicts with the current architecture direction.

2. Split chart shaping by type name: assets use non-liability rows, liabilities use `Liabilities` rows.

   Rationale: The current code already treats `data.type.name !== "Liabilities"` as the asset boundary. Mirroring that boundary keeps behavior compatible with existing data semantics.

   Alternative considered: derive asset/liability state from category names or chart colors. Rejected because asset/liability meaning must come from type/category data, not presentation styling.

3. Reuse existing line and pie chart components before adding specialized components.

   Rationale: Existing `DashboardLineChart`, `DashboardPieChart`, and `components/ui/chart.tsx` already encode the local Recharts/shadcn pattern. Reuse reduces visual drift and avoids new dependencies.

   Alternative considered: create new liability-only chart components immediately. Rejected unless the current components cannot express required empty states or labels cleanly.

4. Extend the chart layout into a compact two-row dashboard chart grid.

   Rationale: The user asked for the new charts under the existing Assets/Assets ratio area. A second row lets the Dashboard scan as Assets + Assets ratio, then Liabilities + Liabilities ratio, while keeping the same two-thirds/one-third desktop rhythm.

   Alternative considered: combine assets and liabilities in one chart. Rejected because trend comparison and composition answer different questions and would make the current ratio chart less clear.

## Visual Review

UI tree:

```text
(dashboard
  (month controls)
  (category filters)
  (summary metrics)
  (chart grid
    (assets trend)
    (assets ratio)
    (liabilities trend)
    (liabilities ratio)))
```

Visual Validation plan:

- Confirm chart cards use existing card primitives, semantic tokens, `--chart-*` colors, clear titles, legends/tooltips, and stable 300px chart areas.
- Review `/dashboard` at 320px, 375px, 1024px, and 1440px when browser validation is available; record any skipped viewport checks before completion.
- Confirm no new design-system conflict is introduced; update `docs/design/design-consistency-conflicts.md` only if a deliberate divergence is needed.

## Risks / Trade-offs

- Chart area becomes taller on mobile -> Mitigation: keep one-column stacking, stable card dimensions, and verify 320px and 375px widths manually.
- Selected categories might exclude all liability categories -> Mitigation: render a clear empty chart state or omit the empty chart consistently with existing behavior, then verify the behavior against the selected category filter.
- Recharts labels can collide for small pie slices -> Mitigation: keep legends visible and favor existing chart tooltip/legend patterns over dense in-slice text if needed.
- Type-name string matching is existing behavior but brittle -> Mitigation: keep the change scoped to the current pattern and avoid introducing a broader type abstraction without a separate architecture change.

## Migration Plan

Implement as a normal UI change on the Dashboard. Rollback is removing the new liability dataset shaping and chart render calls from `ChartSection`. No data migration, dependency install, environment variable, or deployment workflow change is required.

## Open Questions

- None before implementation. If production data has no liability rows for the selected month, implementation should use the existing Dashboard empty-data conventions rather than blocking the change.
