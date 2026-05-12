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

| Area | Owner doc | Source rule | Validation method | Tool/script | Automated? | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Design system | `docs/design-system.md` | Semantic tokens, restricted decorative styles, chart colors, accessible icon actions, reusable component catalog. | Static scans plus catalog presence checks. | `npm run design:check`, `npm run docs:check` | Yes | Active |
| Design system | `docs/design-system.md` | shadcn/Radix primitives before custom primitives; status not communicated by color alone. | Manual UI review until shared APIs make this enforceable. | Manual checklist | No | Manual-only |
| Design system | `docs/design-system.md` | Mobile overflow and responsive checks at 320px, 375px, 1024px, and 1440px. | Future viewport smoke and screenshot checks. | Playwright plan | No | Planned |
| Architecture | `docs/architecture-guide.md` | UI/server import boundaries: no direct Prisma, provider, auth, filesystem, or API-route internals in client code. | Static import-boundary scan. | `npm run architecture:check` | Yes | Active |
| Architecture | `docs/architecture-guide.md` | Feature-internal imports, dependency justification, and shared abstraction judgment. | Proposal/design review against existing call sites and module boundaries. | Manual checklist | No | Manual-only |
| Data model | `docs/data-model-guide.md` | Money, month, value-source, asset/liability, refresh-state, and seed/test-data semantics. | Focused Vitest/database tests plus UI/status review where behavior changes. | `npm run test:unit`, `npm run test`, manual checklist | Partly | Active partial coverage |
| Testing | `docs/testing-strategy.md` | Changed behavior has focused tests; DB-backed tests use the isolated test runner, not direct unit tests. | Script checks plus focused test execution. | `npm run docs:check`, `npm run test:unit`, `npm run test` | Partly | Active |
| Testing | `docs/testing-strategy.md` | UI flow, smoke, and visual regression coverage. | Future deterministic Playwright setup. | Playwright plan | No | Planned |
| Deployment | `openspec/changes/fix-production-db-connectivity/specs/production-db-connectivity/spec.md` | Production Vercel Functions run in `sin1` while Neon is hosted in Singapore. | Static parse of `vercel.json` for exactly `["sin1"]` plus post-deploy metadata review. | `npm run docs:check`, manual checklist | Partly | Active |
| Deployment | `docs/testing-strategy.md`, `AGENTS.md` | Deployable OpenSpec changes are archived only after local validation, GitHub push, Vercel deployment success, and a deployed smoke check are recorded. | OpenSpec task review plus manual deployment checklist; docs/process drift checks keep the rule routed. | `npm run docs:check`, `npm run harness:check`, manual checklist | Partly | Active |
| Deployment | `docs/testing-strategy.md`, `AGENTS.md` | Riskier changes prefer branch or worktree implementation, Vercel Preview verification, merge to `main`, and production verification before archive. | OpenSpec task review confirms branch/worktree path, Preview result, Production result, skipped checks, and manual-only rules. | Manual checklist | No | Manual-only |
| OpenSpec process | `openspec/config.yaml` | Proposals identify affected areas, UI visual impact, reusable component impact, and validation impact. | OpenSpec review plus active-change scans. | `npm run docs:check` | Partly | Active |
| OpenSpec process | `docs/design-system.md` | UI changes include Visual Review; medium/large changes include a reference-only prototype checkpoint. | Active OpenSpec change scan for required sections and prototype contract. | `npm run docs:check` | Yes | Active |
| OpenSpec process | `openspec/config.yaml` | Tasks read relevant docs, run focused validation, and report skipped checks/manual-only rules. | OpenSpec review plus harness availability. | `npm run harness:check`, manual checklist | Partly | Active |
| Docs/process | `docs/validation-harness.md` | Source docs, OpenSpec config, and validation matrix stay present and routed correctly. | Required-file, unsupported-key, routing, and stale-doc checks. | `npm run docs:check` | Yes | Active |

## Manual-only rules

| Rule | Review method | Automation future |
| --- | --- | --- |
| shadcn/Radix primitives before custom primitives | Check whether `components/ui/*` or Radix already fits before accepting a custom control. | Add a light new-primitive flag only if repeated drift appears. |
| Status is not communicated by color alone | Confirm each color-coded state has readable text, an icon label, tooltip, or accessible name. | Partly enforce through shared status component APIs. |
| Feature internals should not be imported across unrelated features | When feature folders exist, require public entrypoints or shared `lib` modules. | Add dependency-cruiser after feature boundaries stabilize. |
| New dependencies require justification | Require proposal/design rationale: value, replacement, cost, and why local code is not enough. | Detect package diffs in CI; keep rationale as review judgment. |
| Shared abstractions require proven reuse | Require concrete reuse or a clear local pattern before adding abstraction layers. | Keep manual. |
| Responsive quality and visual polish | Check changed screens at 320px, 375px, 1024px, and 1440px; report skipped viewports. | Start with Playwright smoke/overflow checks, then stable screenshots. |
| Deployed smoke check before OpenSpec archive | Confirm Vercel deployment success, load the deployed URL, smoke-check the touched route or workflow, and record skipped checks. | Add browser smoke tests after deterministic auth and deployment tooling exist. |

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
