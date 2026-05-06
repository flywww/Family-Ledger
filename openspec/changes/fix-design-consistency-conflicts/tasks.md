## 1. Preparation

- [x] 1.1 Review `docs/design-system.md`, `docs/design/design-consistency-conflicts.md`, this change proposal, design, and `specs/design-consistency/spec.md` before implementation.
- [x] 1.2 Confirm the exact touched file list from the conflict backlog and avoid unrelated UI cleanup outside this change.

## 2. Tokenized Visual Decisions

- [x] 2.1 Replace the login page hard-coded blue-to-slate gradient with a tokenized entry surface in `app/login/page.tsx`.
- [x] 2.2 Align status panel surfaces and text with documented token/status vocabulary in `components/monthly-refresh-status.tsx`, `components/cron-health-alert.tsx`, and `components/setting/cron-test-toggle.tsx`.
- [x] 2.3 Preserve the current `components/ui/card.tsx` radius decision and document that `rounded-xl` remains intentionally accepted for this change.
- [x] 2.4 Preserve system typography in `app/layout.tsx` and document that font migration is intentionally out of scope.
- [x] 2.5 Preserve `--chart-1` through `--chart-5` chart token usage in dashboard charts and verify labels/tooltips remain clear when colors repeat.

## 3. Forms And Feedback

- [x] 3.1 Replace fixed mobile-risk `w-80` form/control widths with `w-full sm:w-80` or an equivalent constrained pattern in balance create/edit, holding create, and change-password forms.
- [x] 3.2 Add visible pending and completion/error feedback for create/edit balance and related form submission paths that currently lack submission UI.
- [x] 3.3 Add `role="alert"`, `aria-live`, or equivalent accessible announcement patterns for async error, success, and status messages in login, form, and status components.
- [x] 3.4 Render demo credentials in `components/login/login-form.tsx` as plain UI text or inline code elements instead of literal Markdown-style backticks.

## 4. Navigation, Tables, And Mobile Actions

- [x] 4.1 Strengthen authenticated nav hover, focus-visible, and active states in `components/layouts/nav-links.tsx` using tokenized background/text classes.
- [x] 4.2 Update balance percentage text in `components/balance/balance-table.tsx` and `components/balance/balance-columns.tsx` so non-liability values maintain contrast on light surfaces.
- [x] 4.3 Expose the `New balance` action on mobile in `components/balance/balance-table-toolbar.tsx` without removing the existing desktop menu behavior.

## 5. Documentation

- [x] 5.1 Update `docs/design/design-consistency-conflicts.md` after implementation to mark resolved items and record any intentionally deferred design decisions.
- [x] 5.2 Add any newly discovered design consistency conflict to `docs/design/design-consistency-conflicts.md` instead of silently diverging from the design system.

## 6. Verification

- [x] 6.1 Run TypeScript/build or focused tests for the touched UI and form code.
- [x] 6.2 Visually check affected login, dashboard, balance, settings, and form surfaces at 375px, 768px, 1024px, and 1440px.
- [x] 6.3 Verify keyboard focus states, accessible labels/announcements, and absence of mobile horizontal overflow on the affected surfaces.
- [x] 6.4 Re-run `openspec status --change "fix-design-consistency-conflicts"` and confirm the change is apply-ready.
