# Validation Harness

## Purpose

The validation harness keeps Family Ledger's source-of-truth documents aligned with the codebase. If a rule is durable enough to live in a design, architecture, data, testing, or process document, it needs a validation path: TypeScript, ESLint, custom script, dependency-cruiser, unit test, integration test, Playwright test, visual regression test, manual checklist, or CI workflow.

The first version favors small, inspectable checks that one maintainer can understand and adjust.

## Source-of-truth documents

| Document | Governs |
| --- | --- |
| `docs/design-system.md` | Product UI style, tokens, components, accessibility, responsive behavior, chart rules, and design review expectations. |
| `docs/design/design-consistency-conflicts.md` | Known design-system conflicts, accepted temporary exceptions, and follow-up decisions. This can be removed after the harness fully enforces the covered rules. |
| `docs/architecture-guide.md` | App structure, module boundaries, runtime flows, dependency rules, and architecture constraints. |
| `docs/data-model-guide.md` | Prisma model semantics, month identity, money/currency behavior, value confidence, and seed/test data rules. |
| `docs/testing-strategy.md` | Testing layers, command expectations, database-test rules, and future Playwright strategy. |
| `openspec/config.yaml` | Concise agent routing and process rules for proposal, specs, design, and tasks. |
| `AGENTS.md` | Repository guide, command map, agent operating rules, and validation expectations. |

## Validation hierarchy

1. Source-of-truth docs define the rule.
2. OpenSpec config routes the agent to the rule.
3. OpenSpec tasks require implementation and validation.
4. Scripts, linters, tests, and CI enforce the rule.
5. Manual review covers what automation cannot.

## Validation matrix

| Area | Source rule | Validation method | Tool/script | Automated? | Status |
| --- | --- | --- | --- | --- | --- |
| Design system | Semantic Tailwind tokens should be preferred over one-off palette utilities. | Static scan for suspicious direct palette utilities in `app/` and non-primitive `components/`. | `npm run design:check` | Yes | Active, high-signal only |
| Design system | No hard-coded decorative colors in app/component source. | Static scan for hex colors in `.ts`, `.tsx`, `.js`, and `.jsx`. | `npm run design:check` | Yes | Active |
| Design system | No unauthorized gradients in authenticated app UI. | Static scan for gradient utilities and purple/pink/fuchsia/violet gradient stops. | `npm run design:check` | Yes | Active |
| Design system | No glassmorphism in authenticated app UI. | Static scan for `backdrop-blur`, blur utilities, and translucent white/black surfaces. | `npm run design:check` | Yes | Active |
| Design system | shadcn/Radix primitives should be used before custom primitives. | Manual review during UI proposals and implementation. | Manual checklist | No | Manual-only for now |
| Design system | Chart colors use `--chart-1` through `--chart-5`. | Static scan of chart files for raw `stroke`, `fill`, and `color` literals. | `npm run design:check` | Yes | Active |
| Design system | Icon-only actions have accessible labels. | Static scan for `Button size="icon"` without `aria-label`, `title`, or `sr-only` text. | `npm run design:check` | Yes | Active, simple pattern |
| Design system | Reusable component files must be managed in both the Markdown design system and static HTML reference. | Static check that managed reusable component paths appear in `docs/design-system.md` and `docs/design-system.html`. | `npm run docs:check` | Yes | Active |
| Design system | Status is not communicated by color alone. | Manual review until component-level status patterns are standardized. | Manual checklist | No | Manual-only for now |
| Design system | Mobile has no horizontal overflow. | Future viewport smoke checks. | Playwright plan | No | Planned |
| Design system | Responsive checks at 320px, 375px, 1024px, and 1440px. | Future viewport smoke checks and targeted screenshots. | Playwright plan | No | Planned |
| Architecture | UI must not import Prisma directly. | Static import-boundary scan. | `npm run architecture:check` | Yes | Active |
| Architecture | Client components must not import server-only modules. | Static import-boundary scan for Prisma, provider modules, auth internals, filesystem/runtime APIs, and API route internals. | `npm run architecture:check` | Yes | Active, narrow rule set |
| Architecture | Feature internals should not be imported across unrelated features. | Manual review because the repo does not currently have a formal `features/` structure. | Manual checklist | No | Manual-only for now |
| Architecture | New dependencies require justification. | Proposal/design review; future dependency-cruiser or package diff check if churn grows. | Manual checklist | No | Manual-only for now |
| Architecture | Shared abstractions require proven reuse. | Proposal/design review against current call sites. | Manual checklist | No | Manual-only for now |
| Data model | Money, currency, and precision behavior must remain explicit and tested where calculations change. | Focused unit/integration tests for changed finance calculations. | `npm run test:unit` or focused Vitest tests | Partly | Existing tests cover selected flows |
| Data model | Month format behavior should use month-key helpers, not ad hoc timestamp equality. | Existing tests plus focused tests for changed month logic. | Vitest, TypeScript | Partly | Existing tests cover monthly refresh and balance analysis |
| Data model | Asset/liability value semantics must stay visible and correct. | Focused unit tests for balance analysis and UI review for status/label presentation. | `tests/balance-analysis.test.ts`, manual checklist | Partly | Existing partial coverage |
| Data model | Estimated, imported, refreshed, and manual values must remain distinguishable. | Monthly refresh tests and UI/status review. | `tests/monthly-refresh*.test.ts`, manual checklist | Partly | Existing partial coverage |
| Testing | Changed behavior has focused tests. | OpenSpec task requirement and code review. | `npm run test:unit` or focused command | Partly | Existing convention |
| Testing | Database-backed tests must not run through the direct unit-test command. | Static check that `npm run test:unit` excludes database-backed test files and database reset helpers include an isolated-schema guard. | `npm run docs:check` | Yes | Active |
| Testing | Important finance calculations have unit tests. | Vitest tests for pure helpers and calculation modules. | `npm run test:unit` | Partly | Active for balance analysis |
| Testing | Important UI flows have integration or E2E tests. | Future Playwright smoke and authenticated flow setup. | Playwright plan | No | Planned |
| Testing | Visual regression tests for stable key screens, if feasible. | Screenshot comparisons after page states stabilize. | Playwright `toHaveScreenshot()` | No | Planned |
| OpenSpec process | Proposal identifies affected areas. | OpenSpec config rule and docs drift check. | `openspec/config.yaml`, `npm run docs:check` | Partly | Active process rule |
| OpenSpec process | UI/design changes classify visual impact and include an embedded Visual Review. | Active OpenSpec change scan for `Visual impact: none/small/medium/large`, `## Visual Review`, and visual validation notes. | `npm run docs:check` | Yes | Active for unfinished changes |
| OpenSpec process | Medium and large visual changes use a reference-only prototype checkpoint before implementation. | Active OpenSpec change scan for `prototype/notes.md`, design link, and reference-only prototype contract. | `npm run docs:check` | Yes | Active for unfinished changes |
| OpenSpec process | Tasks include relevant doc reading. | OpenSpec config rule and manual review of generated tasks. | `openspec/config.yaml` | Partly | Active process rule |
| OpenSpec process | Tasks include validation commands. | OpenSpec config rule and harness script availability. | `openspec/config.yaml`, `npm run harness:check` | Partly | Active |
| OpenSpec process | Change notes report skipped checks and manual-only rules. | OpenSpec config rule and manual review. | Manual checklist | No | Manual-only for now |
| Docs/process | Source docs and OpenSpec config should not drift. | Required file checks, unsupported OpenSpec rule key scan, config routing checks, and matrix presence check. | `npm run docs:check` | Yes | Active |
| Docs/process | Old report-style docs should not return as source-of-truth files. | Static check that `docs/architecture-design-report.md`, `docs/code-optimization-report.md`, and generic short names are absent. | `npm run docs:check` | Yes | Active |
| Design system | Static HTML reference is generated/present when the design system exists. | Required file check and stale nested path check. | `npm run docs:check` | Yes | Active |

## Manual-only rules

### shadcn/Radix primitives before custom primitives

Why it is manual: a useful primitive decision depends on UX shape, accessibility behavior, and how close the existing shadcn component is to the need.

How to review it: during proposal/design or code review, check whether a matching `components/ui/*` primitive or Radix primitive already exists before accepting a custom control.

Should it become automated later: only if repeated drift appears. A script could flag new files under `components/ui/`, but it would still need human judgment.

### Status is not communicated by color alone

Why it is manual: static scans can find some color classes, but they cannot reliably prove whether nearby text, icon labels, tooltips, or `aria-label` text communicate the same state.

How to review it: inspect changed status UI and confirm every color-coded state has readable text, an icon label, tooltip, or accessible name.

Should it become automated later: partly. Shared status components could make this enforceable through component APIs.

### Feature internals should not be imported across unrelated features

Why it is manual: the repo does not yet have a formal `features/` directory or public/internal module convention.

How to review it: when feature folders are introduced, require imports through public index files or shared `lib` modules.

Should it become automated later: yes, once the folder structure exists. dependency-cruiser is a good fit then.

### New dependencies require justification

Why it is manual: package necessity depends on product value, bundle/runtime cost, security posture, and maintenance burden.

How to review it: require the proposal or design to state why the dependency helps, what it replaces, and why a small local implementation is not enough.

Should it become automated later: partly. CI can detect package changes, but justification quality remains a review task.

### Shared abstractions require proven reuse

Why it is manual: reuse is architectural judgment, not just call-site count.

How to review it: ask whether the abstraction removes real duplication across at least two concrete callers or matches an established local pattern.

Should it become automated later: no. Keep this as review judgment.

### Responsive quality and visual polish

Why it is manual: until Playwright fixtures and stable page states exist, automated screenshots would be brittle and expensive to maintain.

How to review it: check changed screens at 320px, 375px, 1024px, and 1440px and record skipped viewports in change notes.

Should it become automated later: yes. Start with smoke/overflow checks, then add screenshots for stable screens.

## Adoption phases

### Phase A - Cheap static checks

- `design:check`: scan app/component source for high-signal design-system drift.
- `architecture:check`: scan imports for direct Prisma/server-only boundary violations.
- `docs:check`: scan required source docs and OpenSpec config for process drift.
- `harness:check`: run typecheck, lint, build, design, architecture, and docs checks.

### Phase B - Better linting

- Add ESLint rules or config upgrades once repeated patterns are clear.
- Add dependency-cruiser after architecture boundaries are stable enough to encode.
- Candidate dependency-cruiser value: import graph visualization and declarative forbidden dependency rules.
- Current recommendation: do not add dependency-cruiser yet. The custom script is enough for Phase A and has lower maintenance cost.

### Phase C - Runtime and visual checks

- Add Playwright smoke tests once auth/test-state setup is clear.
- Add viewport checks at 320px, 375px, 1024px, and 1440px.
- Add screenshot comparisons only for stable pages whose data and layout are deterministic.

### Phase D - CI enforcement

- Run harness checks in CI.
- Block merges on failures after the local harness is stable.
- Keep manual-only rules visible in proposal/design/task review until automation exists.

## Future Playwright checks

Playwright is the right tool for runtime UI validation, but it should come after the Phase A static checks are stable.

Recommended first checks:

- Smoke test for `/login`.
- Authenticated dashboard screenshot once auth test setup is available.
- Viewport checks at 320px, 375px, 1024px, and 1440px.
- Horizontal overflow checks on key authenticated pages.
- Screenshot comparisons for stable pages only.

Playwright supports visual screenshot comparison with `expect(page).toHaveScreenshot()`. Family Ledger should adopt screenshot comparisons after page state, seeded data, and auth setup are deterministic enough to avoid noisy failures.
