## Why

Family Ledger now auto-deploys from GitHub to Vercel, but the OpenSpec lifecycle still stops at local testing before archive. The process needs an explicit deployment verification gate so archived changes mean the code was validated locally, deployed by Vercel, and checked in the live or preview environment.

## What Changes

- Define the CI/CD lifecycle for OpenSpec changes that are deployed through GitHub and Vercel.
- Add deployment verification expectations before `openspec:archive`.
- Clarify when direct `main` deployment is acceptable and when a branch/worktree plus Vercel Preview deployment should be used.
- Add a lightweight source-rule-to-validation path through `docs/validation-harness.md`, `docs/testing-strategy.md`, and manual Vercel deployment review.
- Do not add dependencies, change Vercel project settings, change environment variables, or modify production data.

## Capabilities

### New Capabilities
- `cicd-deployment-process`: Defines the OpenSpec, GitHub, local validation, Vercel deployment, and archive workflow for Family Ledger changes.

### Modified Capabilities

## Impact

- Affected areas: OpenSpec process, repository operating guidance, validation harness documentation, testing strategy documentation, GitHub-to-Vercel deployment verification, and release/archive notes.
- Relevant source-of-truth docs: `AGENTS.md`, `openspec/config.yaml`, `docs/testing-strategy.md`, and `docs/validation-harness.md`.
- Visual impact: none.
- UI/design impact: none.
- Reusable component impact: none.
- Validation impact: new manual deployment review path mapped through the validation harness, plus existing `npm run docs:check` and `npm run harness:check` for process/doc drift.
