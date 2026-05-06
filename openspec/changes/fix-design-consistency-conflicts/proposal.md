## Why

The current UI has several documented design consistency conflicts across login, status panels, cards, forms, tables, navigation, charts, and mobile actions. Fixing these now reduces visual drift and makes future Family Ledger UI changes follow one tokenized, accessible finance-dashboard system.

## What Changes

- Resolve the actionable items in `docs/design/design-consistency-conflicts.md` against `docs/design-system.md`.
- Preserve the existing shadcn/Tailwind token system, including CSS variables, shadcn primitives, and the current slate/blue operational dashboard direction.
- Standardize mobile-safe form widths, submission feedback, accessible error/status announcements, navigation hover/focus states, mobile create access, and rendered credential text.
- Make explicit design decisions for login treatment, status color usage, card radius, percentage text contrast, typography, and chart color limits without introducing a broad redesign.
- Update the design consistency backlog as conflicts are resolved or if implementation uncovers a new conflict.

Non-goals:

- No product repositioning, marketing redesign, or dashboard information architecture overhaul.
- No database, authentication model, or finance calculation changes.
- No new UI component library or design system replacement.

## Capabilities

### New Capabilities
- `design-consistency`: Defines visual, responsive, and accessibility requirements for resolving documented Family Ledger design consistency conflicts.

### Modified Capabilities
- None.

## Impact

- Affected UI areas include `app/login/page.tsx`, `app/layout.tsx`, `components/ui/card.tsx`, status/alert components, balance forms, balance table and columns, login and balance submission feedback, navigation links, dashboard charts, and balance toolbar mobile actions.
- Documentation impact includes `docs/design/design-consistency-conflicts.md` and the OpenSpec artifacts for this change.
- Verification requires focused UI review at 375px, 768px, 1024px, and 1440px, plus TypeScript/build or focused tests for touched components.
