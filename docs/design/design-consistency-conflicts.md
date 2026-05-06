# Design Consistency Conflicts

Last updated: 2026-05-06

This is a discussion backlog, not an implementation change list. The current pass documents conflicts found while scanning the codebase so they can be fixed deliberately later.

## New Conflict Record Template

Use this template when a proposal, design, spec, task, or implementation discovers or introduces a design-system inconsistency:

```md
- [ ] **Short conflict title.**
  Date: YYYY-MM-DD
  Surface: route, component, or workflow
  Conflict: what differs from `docs/design-system.md`
  Reason: why this exists or why the change needs it
  Temporary or permanent: temporary/permanent/unknown
  Follow-up action: concrete next step
  Owner/status: owner or status
```

## Task List

- [ ] **Settings page user id uses a direct slate text color.**
  Date: 2026-05-06
  Surface: `app/(auth)/setting/page.tsx`
  Conflict: The user id uses `text-slate-500` instead of the semantic `text-muted-foreground` token expected by `docs/design-system.md`.
  Reason: Existing implementation predates the validation harness and is a narrow metadata-text inconsistency.
  Temporary or permanent: temporary
  Follow-up action: Replace with `text-muted-foreground` in a scoped settings UI cleanup.
  Owner/status: documented known design-check exception

- [x] **Login page uses a one-off blue-to-slate gradient.**
  Location: `app/login/page.tsx`
  Conflict: The authenticated app uses tokenized shadcn slate/blue surfaces, while login uses `bg-gradient-to-b from-blue-500 to-slate-500`. Decide whether login should keep a distinct entry treatment or move to tokenized surfaces.
  Resolution: Replaced with a token-backed `bg-muted` entry surface and preserved the focused login card.

- [x] **Some status panels bypass theme tokens with hard-coded slate palettes.**
  Locations: `components/monthly-refresh-status.tsx`, `components/cron-health-alert.tsx`, `components/setting/cron-test-toggle.tsx`
  Conflict: These components use direct `slate`, `sky`, `amber`, `rose`, `emerald`, and `orange` utility classes. Status colors are valid, but the dark cron-test panel creates a separate visual language from the rest of the app.
  Resolution: Status surfaces now use tokenized card, muted, border, foreground, and destructive classes by default; emerald, amber, rose, and sky remain only as labeled status vocabulary.

- [x] **Card radius differs from the repo token guidance.**
  Location: `components/ui/card.tsx`
  Conflict: Tailwind exposes `rounded-lg` as `var(--radius)` and the design rules favor small-radius operational UI, but cards use `rounded-xl`. Decide whether to standardize cards to `rounded-lg` or keep larger cards as an intentional shadcn override.
  Resolution: Accepted for this change. `rounded-xl` remains intentionally preserved until a component-level radius migration is scheduled.

- [x] **Mobile form controls use fixed `w-80` widths.**
  Locations: `components/balance/balance-create-form.tsx`, `components/balance/balance-edit-form.tsx`, `components/balance/holding-create-form.tsx`, `components/setting/change-password-form.tsx`
  Conflict: Fixed width can be acceptable on desktop, but mobile-safe design should use `w-full sm:w-80` or a constrained form container.
  Resolution: Replaced mobile-risk fixed widths with `w-full sm:w-80` or Radix trigger-width equivalents for popover/select content.

- [x] **Percentage text uses white for non-liability values.**
  Locations: `components/balance/balance-table.tsx`, `components/balance/balance-columns.tsx`
  Conflict: `text-white` may be low contrast on light backgrounds unless the row has a dark/category background. Decide whether positive/asset percentages should use a semantic success/foreground token.
  Resolution: Non-liability percentages now use `text-foreground`; liabilities keep the documented rose status color.

- [x] **Form submission feedback is inconsistent.**
  Locations: `components/login/login-form.tsx`, `components/balance/balance-create-form.tsx`, balance inline edit cells
  Conflict: Login has loading and error text, inline edits show spinners, but create balance has a TODO for transition UI and no success/error state.
  Resolution: Login, balance create/edit, holding create, password change, and inline edit paths now expose visible pending and result feedback where the UI remains on the page.

- [x] **Accessible error/status announcements are inconsistent.**
  Locations: form messages, `components/login/login-form.tsx`, status/alert components
  Conflict: Error text is visible, but not consistently marked with `role="alert"` or `aria-live`. Decide a shared pattern for validation and async errors.
  Resolution: Async pending/success messages use `role="status"` and error paths use `role="alert"` or assertive live regions.

- [x] **Navigation hover state is too subtle.**
  Location: `components/layouts/nav-links.tsx`
  Conflict: `hover:text-opacity-80` gives weak feedback and does not change background. Decide a stronger hover/focus/active style using `bg-accent` and `text-accent-foreground`.
  Resolution: Authenticated nav links now use tokenized hover, focus-visible, active, and `aria-current` states.

- [x] **Typography source is implicit.**
  Location: `app/layout.tsx`
  Conflict: The design direction recommends a deliberate finance-friendly font pairing if typography is upgraded, but the app currently uses the browser/system default. Decide whether to keep system font as a product choice or add `next/font`.
  Resolution: Deferred for this change. System typography remains intentionally preserved; future `next/font` migration should be a separate typography change.

- [x] **Chart color capacity is limited to five recurring tokens.**
  Locations: `app/globals.css`, `components/dashboard/dashboard-line-chart.tsx`, `components/dashboard/dashboard-pie-chart.tsx`
  Conflict: Categories beyond five repeat colors. Decide whether labels/tooltips are enough or whether the chart token set should expand.
  Resolution: Accepted for this change. Charts continue using `--chart-1` through `--chart-5`; labels, legends, and tooltips remain the required disambiguation when colors repeat.

- [x] **Desktop-only actions hide important create controls on mobile.**
  Location: `components/balance/balance-table-toolbar.tsx`
  Conflict: The `More` menu with `New balance` is hidden on mobile. Decide whether mobile needs a visible create action or a mobile menu equivalent.
  Resolution: Mobile now has a visible `New balance` button while the existing desktop `More` menu remains intact.

- [x] **In-app code text uses literal backticks in body copy.**
  Location: `components/login/login-form.tsx`
  Conflict: `Demo login: \`demo\` / \`demo\`` reads like Markdown source in the rendered UI. Decide whether to style credentials with inline code elements or plain text.
  Resolution: Demo credentials now render as inline code UI elements rather than literal Markdown-style backticks.

## Implementation Notes

- 2026-05-06: No new design consistency conflicts were discovered while implementing `fix-design-consistency-conflicts`.
