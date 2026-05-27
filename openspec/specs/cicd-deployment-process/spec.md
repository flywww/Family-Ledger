## Purpose
Define the deployment-aware OpenSpec lifecycle for Family Ledger changes that ship through GitHub-to-Vercel deployment.

## Requirements

### Requirement: OpenSpec archive requires deployment verification
The Family Ledger change process SHALL verify the relevant Vercel deployment before archiving an OpenSpec change that is intended to ship through GitHub-to-Vercel deployment.

#### Scenario: Direct main deployment is archived
- **WHEN** a small, low-risk change is committed and pushed to `main`
- **THEN** the change tasks or notes record successful local validation, successful Vercel Production deployment, a production smoke check, and archive readiness

#### Scenario: Preview deployment is archived
- **WHEN** a branch or worktree change uses a Vercel Preview deployment before merge
- **THEN** the change tasks or notes record successful local validation, successful Vercel Preview verification, merge to `main`, successful Vercel Production deployment, production smoke check, and archive readiness

### Requirement: Riskier changes use branch or worktree preview flow
The Family Ledger change process SHALL prefer a branch or Git worktree with Vercel Preview verification for risky changes before merging to `main`.

#### Scenario: Deployment-sensitive change is proposed
- **WHEN** a change affects CI/CD, deployment, environment variables, authentication, database behavior, migrations, production-like data workflows, or large user-visible UI changes
- **THEN** the OpenSpec tasks identify branch or worktree implementation, Vercel Preview verification, and post-merge production verification unless the maintainer explicitly chooses direct `main` deployment

### Requirement: Deployment verification remains lightweight and explicit
The Family Ledger change process SHALL use existing local validation and explicit manual Vercel smoke checks until automated browser or CI deployment checks are introduced.

#### Scenario: Process validation runs
- **WHEN** the CI/CD process documentation or OpenSpec routing rules change
- **THEN** `npm run docs:check` and `npm run harness:check` are the validation commands for repository process drift

#### Scenario: Deployed app is smoke-checked
- **WHEN** a deployed change is verified before archive
- **THEN** the maintainer checks that the Vercel deployment succeeded, the relevant deployed URL loads, the touched route or workflow works at a smoke level, and skipped or manual-only checks are recorded

### Requirement: CI/CD workflow rules map to validation paths
The Family Ledger CI/CD process SHALL map every durable deployment workflow rule to an automated or manual validation path in `docs/validation-harness.md`.

#### Scenario: Source rule maps to validation
- **WHEN** the deployment-aware OpenSpec process is implemented
- **THEN** `docs/validation-harness.md` identifies the owner document, source rule, validation method, tool or manual checklist, automation status, and active status for the CI/CD deployment gate

### Requirement: Agents lead deployment gates
The Family Ledger change process SHALL require agents to lead maintainers through deployable OpenSpec lifecycle gates instead of silently skipping or reordering validation, push, deployment, smoke check, and archive steps.

#### Scenario: Next gate changes repository or deployment state
- **WHEN** an agent completes local validation, commit and push, Vercel deployment verification, deployed smoke check, or deployment evidence recording
- **THEN** the agent reports the completed evidence and asks the maintainer to confirm the next gate before changing repository or deployment state unless the maintainer already requested the full CI/CD sequence

#### Scenario: Maintainer skips a gate
- **WHEN** the maintainer asks to skip local validation, commit and push, Vercel deployment verification, deployed smoke check, evidence recording, or archive order
- **THEN** the agent warns which checkpoint is being skipped, states what evidence will be missing, and continues only after explicit confirmation
