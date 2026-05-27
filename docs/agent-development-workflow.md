# AI Agent Development Workflow

## Purpose

This document is the shared operating map for AI-assisted Family Ledger development. It makes local startup, OpenSpec command choice, validation, handoff reporting, and dirty-worktree handling repeatable without changing product behavior.

Use this with `AGENTS.md`, not instead of it. `AGENTS.md` remains the top-level repository contract. This document expands the agent workflow details.

## Start Here

For every non-trivial task:

1. Run `git status --short`.
2. Run `npm run env:health`.
3. Read the smallest relevant source-of-truth docs listed in `AGENTS.md`.
4. Identify whether the task is product behavior, docs/process, OpenSpec, deployment, database, UI, or investigation.
5. Choose the workflow from the command map below.
6. Before editing, name user-owned dirty files that must be avoided or patched carefully.

Safe read-only startup commands:

```bash
git status --short
npm run env:health
openspec list --json
```

Safe validation commands depend on the change type. Use the decision tree below.

## Development Principles

These repo-specific guardrails reduce common agent coding mistakes. They bias toward caution over speed; use judgment for trivial tasks.

### Think Before Coding

- State assumptions before implementing. If uncertainty changes the solution, ask.
- Surface multiple reasonable interpretations instead of choosing silently.
- Name simpler approaches or tradeoffs when they exist, and push back when warranted.
- Stop and ask when the request or evidence is unclear enough that coding would be guessing.

### Simplicity First

- Implement the minimum code that solves the requested problem.
- Do not add speculative features, single-use abstractions, unrequested configurability, or impossible-scenario handling.
- If the solution is much larger than the problem requires, simplify it before continuing.

### Surgical Changes

- Touch only files and lines that trace directly to the request.
- Match existing style, even when another style would be preferable.
- Do not improve adjacent code, comments, or formatting unless required by the change.
- Remove imports, variables, functions, and other orphans created by your own edits.
- Mention unrelated dead code or cleanup opportunities instead of deleting them.

### Goal-Driven Execution

- Turn the request into verifiable success criteria before or during implementation.
- For fixes and validation work, reproduce the issue or define the failing case before claiming it is fixed.
- For multi-step tasks, use a brief plan that pairs each step with its verification.
- Continue the loop until the smallest relevant validation proves the goal or a concrete blocker is reported.

## Planning Protocol

Use this protocol before implementing non-trivial plans, especially when a request combines source material, OpenSpec workflow, Codex Plan Mode, validation, examples, or multiple revisions. The point is to prevent a later revision from improving one dimension while accidentally dropping another.

```text
Planning protocol

goal
  |
  v
source material
  |
  v
coverage checklist
  |
  v
activation paths
  |
  v
automated validation
  |
  v
manual review boundaries
  |
  v
examples and diagrams
  |
  v
acceptance criteria
```

Before presenting a final implementation plan, include or internally verify this readiness check:

```text
Plan readiness check

- Source links inspected:
- Required aspects covered:
- Activation paths covered:
- Automated validation covered:
- Manual review boundaries covered:
- Repo files to update:
- Examples/diagrams included:
- Acceptance criteria:
- What changed from previous plan:
- What was intentionally preserved:
- Deferred feature backlog updates:
```

Revision rule: a revised plan is a complete replacement plan, not a small patch. When revising, preserve earlier approved detail unless there is a clear reason to remove it. If detail is removed, state why. If the reason is not clear, keep the detail.

Feature backlog rule: when a requirement is split across stages, add the deferred parts to `docs/feature-backlog.md` before finishing the current planning or implementation turn. The backlog entry should name the feature area, deferred requirement, why it is deferred, suggested future stage, dependencies or safeguards, and validation notes. Do not treat a backlog entry as implementation approval; future work still needs its own OpenSpec change and validation plan.

For Family Ledger process changes, check these repo-specific questions before implementation:

```text
- Does this affect OpenSpec propose/apply?
- Does this affect Codex Plan Mode?
- Does this affect docs/testing-strategy.md?
- Does this affect docs/agent-development-workflow.md?
- Does this affect docs/validation-harness.md?
- Does this affect openspec/config.yaml?
- Does this require scripts/docs-check.mjs enforcement?
- Does the active OpenSpec change need to be updated so validation still passes?
- What runs in npm run docs:check?
- What runs in npm run harness:check?
```

## Agent Command Map

The canonical lifecycle is OpenSpec-centered:

```text
explore -> propose -> continue/apply -> verify -> validate -> commit/push -> deploy -> smoke check -> archive
```

| Intent | OpenSpec CLI / concept | Cursor command | Claude command/skill | Codex behavior |
| --- | --- | --- | --- | --- |
| Think without implementation | Read files, inspect code, discuss tradeoffs | `/opsx:explore` | `/opsx:explore`, `openspec-explore` | Explore, report findings, do not edit unless asked |
| Start a change shell | `openspec new change <name>` | `/opsx:new` | `/opsx:new`, `openspec-new-change` | Create only when requested; otherwise explain next artifact |
| Create all artifacts | `openspec status`, `openspec instructions ...` | `/opsx:propose` or `/opsx:ff` | `openspec-propose`, `openspec-ff-change` | Generate proposal/specs/design/tasks when user asks for one-pass proposal |
| Continue artifact creation | `openspec instructions <artifact>` | `/opsx:continue` | `openspec-continue-change` | Create the next ready artifact only |
| Implement tasks | `openspec instructions apply --change <name>` | `/opsx:apply` | `openspec-apply-change` | Read context files, implement scoped tasks, update checkboxes |
| Verify implementation | `openspec instructions apply --change <name>` plus repo inspection | `/opsx:verify` | `openspec-verify-change` | Report completeness, correctness, coherence, and missing validation |
| Sync delta specs | Compare `openspec/changes/<name>/specs` to `openspec/specs` | `/opsx:sync` | `openspec-sync-specs` | Sync only after explicit request or archive flow decision |
| Archive completed change | Move to `openspec/changes/archive/YYYY-MM-DD-<name>` | `/opsx:archive` | `openspec-archive-change` | Archive only after required evidence or explicit skip confirmation |
| Pause and ask | No CLI command | Ask maintainer | Ask maintainer | Ask when safety, schema, database, deployment, or unclear scope blocks progress |

Pause and ask before:

- Adding dependencies.
- Editing `.env*`.
- Changing Prisma schema or migrations.
- Running destructive data cleanup.
- Changing CI/CD, deployment, production-like data workflows, or environment variables.
- Committing, pushing, inspecting deployment, smoke-checking protected production URLs, or archiving when the next gate changes repository or deployment state.

## TDD Apply Loop

For behavior-changing work, `openspec apply` and Codex implementation must follow the TDD contract in `docs/testing-strategy.md`. Do not turn RED into "write every test first." Work one behavior at a time.

```text
openspec apply

read change artifacts
      |
      v
pick one unchecked TDD behavior task
      |
      v
RED evidence exists?
      |
      +-- no --> write/run failing behavior test
      |
      v
GREEN implementation
      |
      v
focused test passes?
      |
      +-- no --> continue minimal implementation
      |
      v
refactor only if useful
      |
      v
rerun focused test
      |
      v
update task evidence
```

Apply sequence:

1. Select exactly one unchecked `TDD behavior` task.
2. Confirm the `Public interface` under test.
3. Write one RED behavior test only.
4. Run the focused command from `Test command` and keep the failure reason.
5. Implement the smallest GREEN change.
6. Rerun the focused command and record the pass.
7. Refactor only after GREEN, and only when it improves duplication, interface design, module depth, naming, or code placement.
8. Rerun the focused command after refactor.
9. Update task notes with RED, GREEN, REFACTOR, final validation, skipped checks, and manual-only rules.
10. Move to the next behavior only after the current task has evidence.

Codex Plan Mode must include a `TDD Contract` section for behavior-changing work before implementation. The contract names the first RED behavior, public interface under test, focused test command, mocking boundary, interface design, module depth, refactor checkpoint, final validation, and manual-only checks. Plan Mode output is reviewed manually until it is copied into OpenSpec tasks; `npm run docs:check` then validates the durable artifact.

## Local Dev Bootstrap

Use this startup flow when an agent needs to work in the repo:

```text
git status
  -> env health
  -> active OpenSpec changes
  -> relevant docs
  -> scope and validation choice
  -> edits
  -> focused validation
  -> handoff report
```

Dev-server workflow:

- Use `pnpm dev`.
- If port 3000 is busy, Next may choose another port such as 3001.
- A `Ready` message is not enough. Verify the relevant URL responds before claiming the app is running.
- Do not start a dev server for docs-only work unless browser review is required.
- Stop and ask before using production credentials, bypass tokens, or protected deployed URLs.

Dirty-worktree workflow:

- Treat pre-existing modified and untracked files as user-owned.
- Avoid editing dirty files unless they are directly required.
- If a dirty file must be edited, inspect its current content first and patch only the needed lines.
- Never use `git reset`, `git checkout --`, `git clean`, or destructive history commands without explicit approval.
- Before commit or handoff, distinguish files changed by this task from pre-existing user-owned changes.

Local AI tooling folders:

| Path | Current role | Recommendation |
| --- | --- | --- |
| `.cursor/` | Cursor OpenSpec command definitions | Document as project tooling if the maintainer wants cross-agent command parity; otherwise keep local-only. |
| `.claude/` | Claude commands, skills, and local settings | Partially commit reusable commands/skills only after review; keep `settings.local.json` local-only. |
| `.codex/` | Local Codex skill folder, currently UI/UX focused | Keep local-only unless the skill is intentionally promoted as project tooling. |

Do not change `.gitignore` or commit these folders without maintainer approval.

## DB-Safe Validation Decision Tree

Use the smallest relevant set.

| Change type | Minimum validation | Add when relevant | Avoid |
| --- | --- | --- | --- |
| Docs/process only | `npm run docs:check` | `npm run harness:check` for broad source-of-truth or harness changes | DB tests |
| Script or package-script change | `node scripts/<script>.mjs`, `npm run docs:check`, `npm run typecheck`, `npm run lint` | `npm run harness:check` if validation behavior changed | DB tests unless DB behavior changed |
| OpenSpec-only change | `npm run docs:check` | `openspec status --change <name> --json` | App build unless code changed |
| UI-only app change | `npm run typecheck`, `npm run lint`, `npm run build`, `npm run design:check` | Visual review at required viewports; focused tests if behavior changed | DB tests unless data behavior changed |
| Architecture/import-boundary change | `npm run architecture:check`, `npm run typecheck`, `npm run lint` | `npm run build` for app wiring | DB tests unless persistence behavior changed |
| Finance calculation change | `npm run typecheck`, `npm run lint`, `npm run test:unit` | `npm run build` | DB tests unless persistence behavior changed |
| Prisma/data-model/database-backed behavior | `npm run typecheck`, `npm run lint`, `npm run build` | `npm run test` only when env health shows a compatible base Prisma URL is present | Direct Vitest DB tests, manual reset, seed cleanup |
| Deployment/process gate change | `npm run docs:check`, `npm run harness:check` | Manual deployment checklist after user approval | Deployment inspection or smoke checks without approval |

DB-backed tests are allowed only through:

```bash
npm run test
```

`npm run test` is the safe entrypoint because it creates an isolated Prisma schema when a compatible base database URL is available. Do not add DB-backed tests to `npm run test:unit`.

Skip DB-backed tests when:

- The task did not change database-backed behavior.
- `npm run env:health` reports no base Prisma database URL key.
- The only available database context is production-like and the maintainer has not approved test use.
- A test or helper would delete rows outside an isolated `family_ledger_test_` schema.

## OpenSpec Lifecycle Onboarding

Default deployable flow:

```text
propose
  -> apply
  -> local validation
  -> commit and push
  -> Vercel deployment
  -> deployed smoke check
  -> archive
```

Evidence required:

| Gate | Evidence |
| --- | --- |
| Proposal/artifacts | Change name, schema, artifact status, affected docs read |
| Apply | Completed tasks, changed files, implementation notes |
| Local validation | Commands run, pass/fail results, skipped checks and reasons |
| Commit/push | Commit hash and pushed branch |
| Vercel deployment | Preview or production deployment status and URL metadata |
| Smoke check | Touched route/workflow checked, URL or route, result |
| Archive | Spec sync status, archive path, skipped deployment evidence if any |

Do not archive when:

- Required local validation has not run and the maintainer has not explicitly accepted the skip.
- Deployment evidence is missing for deployable changes.
- The deployed smoke check is blocked or skipped without explicit confirmation.
- Delta specs have not been synced or intentionally skipped after review.
- Tasks are incomplete and the maintainer has not confirmed archive with warnings.

Riskier changes should prefer a branch or Git worktree with Vercel Preview verification. Riskier means CI/CD, deployment, env vars, authentication, database behavior, migrations, production-like data workflows, or large user-visible UI changes.

## Handoff Report Template

Use this for substantial AI-agent tasks:

```markdown
## Handoff Report

### Summary

### Changed Files

### User-Owned Changes Preserved

### Validation Run

### Skipped Validation

### OpenSpec Status

### Database Safety

### Deployment Gate Status

### Remaining Risks

### Recommended Next Step
```

Report skipped checks honestly. A task is not complete unless validation evidence is provided or skipped checks are clearly explained.
