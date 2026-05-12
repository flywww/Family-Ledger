## 1. Preparation

- [x] 1.1 Review `docs/design-system.md`, `docs/architecture-guide.md`, `docs/data-model-guide.md`, `docs/testing-strategy.md`, and `docs/validation-harness.md` sections relevant to Dashboard chart UI and `ValueData`.
- [x] 1.2 Inspect current Dashboard chart composition in `app/(auth)/dashboard/page.tsx`, `components/dashboard/chart-section.tsx`, `components/dashboard/dashboard-line-chart.tsx`, and `components/dashboard/dashboard-pie-chart.tsx`.

## 2. Chart Data And UI

- [x] 2.1 Split Dashboard chart data shaping into asset and liability datasets using existing `ValueData` type semantics.
- [x] 2.2 Render a liability trend chart that excludes asset rows and uses the existing converted, category-filtered Dashboard data.
- [x] 2.3 Render a liability ratio pie chart for the selected month under the existing Assets ratio area.
- [x] 2.4 Preserve current asset trend and asset ratio behavior while adding liability chart coverage.
- [x] 2.5 Handle empty or zero liability data without breaking the Dashboard layout.

## 3. Design Review

- [x] 3.1 Verify the Dashboard chart layout follows `docs/design-system.md` card, chart, token, typography, and responsive rules.
- [x] 3.2 Review `/dashboard` at 320px, 375px, 1024px, and 1440px or record any skipped viewport checks.
- [x] 3.3 Record any intentional design-system divergence in `docs/design/design-consistency-conflicts.md`; otherwise confirm no conflict backlog update is needed.

## 4. Validation

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Run `npm run lint`.
- [x] 4.3 Run `npm run build`.
- [x] 4.4 Run `npm run test:unit` or focused unit tests if data-shaping logic is extracted.
- [x] 4.5 Report skipped checks, failing checks, manual-only visual review results, and deployment/archive readiness notes before completion.
