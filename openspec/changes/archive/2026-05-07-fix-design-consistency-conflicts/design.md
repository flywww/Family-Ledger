## Context

Family Ledger already has a documented design system in `docs/design-system.md` and a backlog of current conflicts in `docs/design/design-consistency-conflicts.md`. The app uses Next.js App Router, Tailwind CSS, shadcn/ui primitives, CSS variable tokens, Radix primitives, Lucide/Radix icons, and Recharts.

The affected surfaces are cross-cutting: unauthenticated login, authenticated navigation, dashboard chart colors, status panels, balance forms, balance table percentages, mobile balance actions, form feedback, and accessible announcements. This is a UI consistency change only; implementation must keep the existing finance-dashboard product shape.

## Goals / Non-Goals

**Goals:**

- Resolve each documented design consistency conflict with an explicit token-first decision.
- Make login, status, navigation, form, table, chart, and mobile action behavior consistent with the Family Ledger design system.
- Improve accessibility for async errors/status messages and keyboard-visible navigation states.
- Preserve responsive behavior at 375px mobile and authenticated desktop breakpoints.
- Keep `docs/design/design-consistency-conflicts.md` accurate after implementation.

**Non-Goals:**

- Replace shadcn/ui, Tailwind, Radix, Recharts, or the current token model.
- Redesign authenticated information architecture, dashboard chart types, or balance table data model.
- Add a new typography dependency in this change.
- Expand chart palette tokens in this change.
- Change authentication, database schema, refresh business logic, or finance calculations.

## Decisions

1. Preserve the existing token system.

   Use semantic classes such as `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `bg-accent`, and `text-accent-foreground` whenever a semantic token exists. Status colors may keep emerald, amber, rose/destructive, and sky only when they communicate status meaning.

   Alternative considered: introduce a new palette or page-specific theme. Rejected because the design system already defines a quiet shadcn/Tailwind finance dashboard direction.

2. Treat login as a calmer entry surface, not a separate visual language.

   Replace the one-off `bg-gradient-to-b from-blue-500 to-slate-500` with a tokenized surface treatment that still feels distinct enough for unauthenticated entry, such as `bg-muted` or a restrained token-backed background with the existing login card.

   Alternative considered: keep the blue-to-slate gradient as an intentional auth-only treatment. Rejected because it is hard-coded and diverges from the documented token system.

3. Keep the card primitive radius unchanged in this change.

   `components/ui/card.tsx` currently uses `rounded-xl`, and the design system explicitly says to preserve it until a component-level decision changes it. This change will mark that conflict as intentionally accepted rather than changing every card radius.

   Alternative considered: switch `Card` to `rounded-lg`. Deferred because it would affect many surfaces and is now documented as a separate component-level decision.

4. Keep system font and five chart tokens unchanged.

   `app/layout.tsx` will not add `next/font`. `--chart-1` through `--chart-5` will remain the chart color source. The implementation should ensure chart labels/tooltips remain usable when colors repeat.

   Alternative considered: add Lexend/Source Sans 3 and expand chart tokens. Deferred because these are design-system migrations, not required to fix the current consistency conflicts.

5. Make forms mobile-safe and feedback-explicit.

   Replace fixed `w-80` field/control widths with `w-full sm:w-80` or an equivalent constrained form container in balance create/edit, holding create, and change-password forms. Add explicit pending, success, redirect, and error feedback where create/edit submissions currently lack UI state.

   Alternative considered: keep fixed widths and rely on centered form containers. Rejected because the design system requires mobile-safe form widths and 375px checks.

6. Standardize accessible async announcements.

   Error messages that appear after async work should use `role="alert"` or an assertive live region. Non-error progress/success/status copy should use a polite live region when it updates dynamically. Visible color must not be the only status indicator.

   Alternative considered: rely on shadcn `FormMessage` only. Rejected because several affected messages are not only field validation messages.

7. Strengthen navigation and mobile create access without changing app structure.

   `components/layouts/nav-links.tsx` should use visible background/text changes for hover, focus-visible, and active states, using `bg-accent`, `text-accent-foreground`, or the current foreground token. `components/balance/balance-table-toolbar.tsx` should expose `New balance` on mobile through a visible button or mobile-safe menu, while keeping desktop density.

   Alternative considered: redesign navigation or toolbar layout. Rejected because the change is consistency-focused.

## Risks / Trade-offs

- Broad UI file touch set -> Keep edits scoped to the documented conflicts and avoid opportunistic restyling.
- Status color tokenization could make severity less obvious -> Preserve documented emerald/amber/rose/sky meanings and pair color with text labels.
- Form feedback changes may interact with existing server actions -> Use existing action return shapes where possible and verify submission paths manually or with focused tests.
- Mobile toolbar changes can crowd the 375px layout -> Prefer wrapping controls and compact visible actions over fixed-width desktop patterns.
- Updating the conflict doc too early could hide incomplete work -> Mark items resolved only after the corresponding implementation and verification are complete.
