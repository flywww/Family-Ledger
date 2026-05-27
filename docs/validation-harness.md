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
| `docs/agent-development-workflow.md` | AI-agent command mapping, local bootstrap, DB-safe validation choices, handoff reporting, local tooling treatment, and dirty-worktree handling. |
| `docs/feature-backlog.md` | Deferred staged requirements, future feature reminders, and validation notes for work intentionally left out of the current stage. |
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
| Testing | `docs/testing-strategy.md` | TDD behavior tests use public interfaces and one RED/GREEN/REFACTOR cycle at a time. | Active OpenSpec task scan plus focused test execution. | `npm run docs:check`, `npm run test:unit`, `npm run test` | Partly | Active |
| Testing | `docs/testing-strategy.md` | Behavior-changing OpenSpec tasks include the TDD contract: TDD behavior, Public interface, Test command, Mocking, Module depth, RED, GREEN, REFACTOR, and VALIDATE. | Active OpenSpec task scan. | `npm run docs:check` | Yes | Active |
| Testing | `docs/testing-strategy.md` | DB-backed TDD uses the isolated `npm run test` runner, not `npm run test:unit` as the only command. | Active OpenSpec task scan plus package-script guard. | `npm run docs:check`, `npm run test` | Partly | Active |
| Testing | `docs/testing-strategy.md` | Mock system boundaries only; do not mock internal collaborators. | Required docs guidance plus manual review of OpenSpec task notes. | `npm run docs:check`, manual checklist | Partly | Active |
| Architecture | `docs/testing-strategy.md`, `docs/architecture-guide.md` | Testable interfaces use small public surfaces and hide complexity in deep modules. | OpenSpec task scan for Public interface and Module depth plus manual review. | `npm run docs:check`, manual checklist | Partly | Active |
| Testing | `docs/testing-strategy.md` | Refactor only while GREEN and rerun focused tests after refactor. | Required docs guidance plus OpenSpec task evidence review. | `npm run docs:check`, manual checklist | Partly | Active |
| Agent workflow | `docs/agent-development-workflow.md` | Development principles require agents to think before coding, keep changes simple and surgical, and execute toward validation evidence. | Manual review of agent plans, diffs, and handoff reports. | Manual checklist | No | Manual-only |
| Agent workflow | `docs/agent-development-workflow.md` | Non-trivial planning uses the Planning Protocol readiness check so revisions preserve source links, required aspects, activation paths, validation, manual review boundaries, examples, and acceptance criteria. | Required-section and required-phrase checks plus manual review of plans before implementation. | `npm run docs:check`, manual checklist | Partly | Active |
| Agent workflow | `docs/agent-development-workflow.md`, `docs/feature-backlog.md` | When a requirement is split across stages, deferred parts are added to the feature backlog before the current stage is finished. | Required-file and required-phrase checks plus manual review of staged plans and backlog entries. | `npm run docs:check`, manual checklist | Partly | Active |
| Agent workflow | `docs/agent-development-workflow.md`, `docs/testing-strategy.md` | Codex Plan Mode behavior-changing plans include a TDD Contract before implementation, then copy the contract into OpenSpec tasks for durable validation. | Required docs guidance plus manual plan review before artifact validation. | `npm run docs:check`, manual checklist | Partly | Active |
| Testing | `docs/testing-strategy.md` | Existing UI workflow integration requires create-and-visible proof: the create/submit path writes data and the list/detail/read path shows that data under relevant filters or views. | OpenSpec task scan plus focused integration tests or recorded manual evidence. | `npm run docs:check`, `npm run test`, manual checklist | Partly | Active |
| Testing | `docs/testing-strategy.md` | UI flow, smoke, and visual regression coverage. | Future deterministic Playwright setup. | Playwright plan | No | Planned |
| Agent workflow | `docs/agent-development-workflow.md` | Agents run read-only environment health diagnostics, use the unified command map, choose DB-safe validation, preserve dirty worktrees, and produce standard handoff reports. | Required-file, package-script, and workflow-routing checks plus manual review of agent behavior. | `npm run env:health`, `npm run docs:check`, manual checklist | Partly | Active |
| Deployment | `openspec/changes/fix-production-db-connectivity/specs/production-db-connectivity/spec.md` | Production Vercel Functions run in `sin1` while Neon is hosted in Singapore. | Static parse of `vercel.json` for exactly `["sin1"]` plus post-deploy metadata review. | `npm run docs:check`, manual checklist | Partly | Active |
| Deployment | `docs/testing-strategy.md`, `AGENTS.md` | Deployable OpenSpec changes are archived only after local validation, GitHub push, Vercel deployment success, and a deployed smoke check are recorded. | OpenSpec task review plus manual deployment checklist; docs/process drift checks keep the rule routed. | `npm run docs:check`, `npm run harness:check`, manual checklist | Partly | Active |
| Deployment | `AGENTS.md`, `docs/testing-strategy.md`, `openspec/config.yaml` | Agent-led gate mode asks the maintainer before moving between validation, push, deployment verification, smoke check, and archive; skipped gates require an explicit warning and confirmation. | Required phrase checks plus manual review of agent behavior during OpenSpec archive/apply turns. | `npm run docs:check`, manual checklist | Partly | Active |
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
| Local AI tooling folder treatment | Confirm whether `.claude/`, `.cursor/`, and `.codex/` are intentionally committed, partially committed, ignored, or kept local-only before changing `.gitignore` or staging them. | Add a lightweight status check only if repeated accidental staging appears. |
| Dirty-worktree preservation | Confirm user-owned modified/untracked files are identified, avoided, or patched narrowly before editing and before commit. | Keep manual; `npm run env:health` reports dirty status. |
| Planning Protocol readiness | Confirm non-trivial plans name source links inspected, required aspects, activation paths, automated validation, manual review boundaries, repo files, examples/diagrams, acceptance criteria, changes from previous plan, and intentionally preserved detail. | Keep lightweight phrase checks in `docs:check`; exact plan quality remains review judgment. |
| Staged requirement backlog | Confirm deferred requirements from staged plans are captured in `docs/feature-backlog.md` with feature area, deferred requirement, reason, future stage, safeguards, and validation notes. | Add structured backlog parsing only if entries become hard to review manually. |
| Create-and-visible UI workflow proof | For existing workflow integration, confirm the agent verified the create/submit path writes data and the list, table, detail, or read path visibly shows the created data under the relevant filters or views. Code inspection alone is not sufficient. | Encode deterministic Playwright or server-action integration tests for repeated workflows. |
| TDD behavior quality | Confirm the RED test proves user/caller-visible behavior through a public interface, not private implementation or call order. | Expand docs-check only if repeated task wording drift appears; behavior quality remains review judgment. |
| TDD mocking boundary | Confirm each mock named in `Mocking:` is a real system boundary such as a provider, clock, filesystem, or network failure, not an internal collaborator. | Add targeted static checks only after repeated drift appears. |
| TDD module depth | Confirm `Module depth:` is accurate: small interface, deep implementation, and no unnecessary public helper spread. | Add architecture checks after feature boundaries stabilize. |
| TDD refactor evidence | Confirm refactoring happened only after GREEN and focused tests reran after the refactor. | Add command wrappers only if the workflow becomes scriptable. |
| Codex Plan Mode TDD Contract | Confirm behavior-changing Codex plans include First RED behavior, Public interface under test, Focused test command, Mocking boundary, Interface design, Module depth, Refactor checkpoint, Final validation, and Manual-only checks. | Durable enforcement begins after the plan is copied into OpenSpec tasks and `npm run docs:check` runs. |
| Responsive quality and visual polish | Check changed screens at 320px, 375px, 1024px, and 1440px; report skipped viewports. | Start with Playwright smoke/overflow checks, then stable screenshots. |
| Deployed smoke check before OpenSpec archive | Confirm Vercel deployment success, load the deployed URL, smoke-check the touched route or workflow, and record skipped checks. | Add browser smoke tests after deterministic auth and deployment tooling exist. |
| Agent-led deployment gates | Confirm the agent reports completed evidence, asks before the next state-changing gate, and warns when the maintainer skips validation, push, deployment verification, smoke check, or archive order. | Add a command wrapper or OpenSpec plugin check if the workflow becomes scriptable. |

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
