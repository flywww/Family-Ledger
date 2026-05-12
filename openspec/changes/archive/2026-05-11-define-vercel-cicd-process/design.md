## Context

Family Ledger uses OpenSpec to control change intent and task readiness, local npm scripts to validate code and docs, GitHub as the source of deployable commits, and Vercel as the hosting/deployment platform. Vercel is already configured to auto-deploy after GitHub commits, so the missing process decision is where deployment verification belongs in the OpenSpec lifecycle.

Current process:

```text
openspec:propose
  -> openspec:apply
  -> test
  -> openspec:archive
```

Target process:

```text
openspec:propose
  -> openspec:apply
  -> local validation
  -> commit and push
  -> Vercel deployment
  -> deployment smoke check
  -> openspec:archive
```

Relevant source documents are `AGENTS.md`, `openspec/config.yaml`, `docs/testing-strategy.md`, and `docs/validation-harness.md`.

## Goals / Non-Goals

**Goals:**

- Make deployment verification an explicit gate before archiving an OpenSpec change.
- Keep OpenSpec responsible for intent, acceptance criteria, and task readiness.
- Keep GitHub/Vercel responsible for deployability and production or preview release evidence.
- Define when direct `main` deployment is acceptable and when a branch/worktree plus Vercel Preview deployment is preferred.
- Map the new durable workflow rule to validation paths in `docs/validation-harness.md`.

**Non-Goals:**

- Do not change Vercel project settings.
- Do not add GitHub Actions, Playwright, or a new dependency in this change unless implementation finds an existing lightweight script gap.
- Do not change environment variables, Prisma schema, database data, or production credentials.
- Do not make OpenSpec duplicate the full deployment process; route details to source docs instead.

## Decisions

### Decision: Archive only after deployment verification

`openspec:archive` should happen after the relevant Vercel deployment is verified. Archive means the change is implemented, locally validated, deployed, and smoke-checked in the deployed environment.

Alternative considered: archive immediately after local tests. This is too weak now that GitHub-to-Vercel auto-deploy is part of the release path; a change can pass locally but fail during Vercel build, routing, environment, or runtime startup.

### Decision: Use two deployment paths based on change risk

Small, low-risk fixes can continue to use direct `main` deployment when the maintainer intentionally accepts production auto-deploy:

```text
local validation
  -> commit to main
  -> push
  -> Vercel Production deployment
  -> production smoke check
  -> archive
```

Larger or riskier changes should use a branch or Git worktree so Vercel Preview can be verified before merge:

```text
worktree or branch
  -> local validation
  -> push branch
  -> Vercel Preview deployment
  -> preview smoke check
  -> merge to main
  -> Vercel Production deployment
  -> production smoke check
  -> archive
```

Riskier changes include CI/CD, deployment, environment variables, authentication, database behavior, migrations, production-like data workflows, and large UI changes.

Alternative considered: always require worktrees and preview deployments. That is too heavy for a solo-maintainer workflow and would slow down small fixes.

### Decision: Keep validation lightweight

Process/document changes should be validated with existing repository checks:

- `npm run docs:check`
- `npm run harness:check`

Deployment evidence remains manual for now:

- Vercel deployment completed successfully.
- Production or preview URL loads.
- The changed route or workflow is smoke-checked.
- Any skipped checks or manual-only rules are recorded in tasks/change notes.

Alternative considered: add GitHub Actions or Playwright immediately. The current source docs already mark Playwright as planned; this change should define the process first and avoid new tooling until repeated gaps justify it.

## Risks / Trade-offs

- Manual deployment review can be skipped or inconsistently recorded. -> Add explicit OpenSpec task checklist items and map the rule in `docs/validation-harness.md`.
- Direct `main` deployment can expose production before preview verification. -> Limit direct `main` flow to small, low-risk fixes and document branch/worktree preference for risky changes.
- Vercel success does not prove user-facing behavior. -> Require a small smoke check of the touched route or workflow before archive.
- Preview deployments may not match production secrets or production data. -> Treat preview verification as pre-merge evidence, then still verify production after merge for production-sensitive changes.
- Documentation can drift from real practice. -> Validate process docs with `npm run docs:check` and `npm run harness:check`.

## Visual Review

Visual impact is none. This change updates process documentation and OpenSpec routing only; no screens, layouts, reusable components, or visual tokens are changed.

Visual Validation: not applicable beyond confirming the documentation check recognizes this as a process-only change.

## Migration Plan

1. Update source-of-truth docs to describe the deployment-aware OpenSpec lifecycle.
2. Map the CI/CD deployment gate in `docs/validation-harness.md`.
3. Keep `openspec/config.yaml` concise, adding only routing/task expectations if implementation needs a process reminder.
4. Run process validation with `npm run docs:check` and `npm run harness:check`.
5. For this process-only change, no Vercel production deployment is required until the docs are pushed; if pushed, verify the Vercel deployment succeeds before archiving.

Rollback strategy: revert the documentation/process edits and keep the previous local-validation-before-archive flow.

## Open Questions

- Should the repository later add a GitHub Actions workflow that runs `npm run harness:check` before Vercel production deployment?
- Should the first Playwright smoke checks cover only `/login`, or also an authenticated dashboard path once deterministic auth setup exists?
