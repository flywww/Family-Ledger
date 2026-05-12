## Purpose
Define Dashboard chart behavior for monthly liability trends and selected-month liability composition using existing `ValueData` rows.

## Requirements

### Requirement: Dashboard displays liability trend chart
The Dashboard SHALL display a liability trend chart derived from existing `ValueData` rows whose type is `Liabilities`.

#### Scenario: Liability data exists across months
- **WHEN** the Dashboard receives converted `ValueData` containing `Liabilities` rows for multiple months
- **THEN** the chart section displays a liability line chart using those liability values over time

#### Scenario: Asset chart remains separate
- **WHEN** the Dashboard receives both asset and liability `ValueData`
- **THEN** the existing asset trend chart excludes liability rows and the liability trend chart excludes asset rows

### Requirement: Dashboard displays liability ratio chart for the selected month
The Dashboard SHALL display a liability ratio pie chart for the selected month using existing category-filtered and currency-converted `ValueData`.

#### Scenario: Selected month has liability values
- **WHEN** the selected Dashboard month has liability `ValueData`
- **THEN** the chart section displays a liability ratio chart grouped by liability category for that month

#### Scenario: Selected month filtering is respected
- **WHEN** the user changes the Dashboard month or category filters
- **THEN** the liability ratio chart reflects the selected month and selected categories using the same filter inputs as the asset charts

### Requirement: Liability charts follow Dashboard design and validation rules
The Dashboard liability charts SHALL reuse existing chart/card primitives, semantic chart colors, accessible titles or legends, and responsive layout behavior.

#### Scenario: Visual review covers changed chart section
- **WHEN** the liability chart implementation is complete
- **THEN** the implementer records manual review of `/dashboard` at 320px, 375px, 1024px, and 1440px or explicitly records any skipped viewport checks

#### Scenario: Existing validation remains green
- **WHEN** the Dashboard liability charts are implemented
- **THEN** `npm run typecheck`, `npm run lint`, `npm run build`, and relevant focused tests pass before the change is considered ready for deployment
