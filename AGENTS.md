# Family Ledger Repository Guide

## Purpose

This is the source of truth for working in the Family Ledger repository. Use it for repo navigation, commands, validation expectations, and agent workflow.

## Project

Family Ledger is a private family finance dashboard built with:

- Next.js App Router
- React Server Components
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix primitives
- Recharts
- Prisma
- NextAuth

## Source-Of-Truth Docs

Read the smallest relevant set before changing code:

- Design system: `docs/design-system.md`
- Design conflict backlog: `docs/design/design-consistency-conflicts.md`
- Architecture guide: `docs/architecture-guide.md`
- Data model guide: `docs/data-model-guide.md`
- Testing strategy: `docs/testing-strategy.md`
- Validation harness: `docs/validation-harness.md`
- OpenSpec routing/process: `openspec/config.yaml`

The design conflict backlog can be removed after the harness and design rules are fully enforced elsewhere.

## Commands

| Command | Use |
| --- | --- |
| `pnpm dev` | Start the Next dev server. |
| `npm run typecheck` | Run TypeScript validation. |
| `npm run lint` | Run ESLint with zero warnings. |
| `npm run build` | Generate Prisma client and build Next. |
| `npm run design:check` | Run design-system drift checks. |
| `npm run architecture:check` | Run import-boundary checks. |
| `npm run docs:check` | Run docs/OpenSpec drift checks. |
| `npm run harness:check` | Run the Phase A validation harness. |
| `npm run test:unit` | Run Vitest directly. |
| `npm run test` | Run DB-isolated tests through `scripts/run-tests.mjs`. |

Package manager note:

- The repo has `pnpm-lock.yaml`, so use `pnpm` for installs and dev-server workflows.
- Existing package scripts use `npm run` and are valid for validation commands.

## Operating Contract

### MUST

- Preserve unrelated local changes.
- Read only the source-of-truth docs relevant to the change before editing.
- Keep durable rules mapped to a validation path in `docs/validation-harness.md`.
- Use `pnpm` for installs and dev-server workflows.
- Run the smallest relevant validation command set before completion.
- For changes that ship through GitHub-to-Vercel deployment, archive OpenSpec only after local validation, GitHub push, Vercel deployment success, and a deployed smoke check are recorded.

### ASK FIRST

- Adding dependencies.
- Changing Prisma schema, migrations, or database reset behavior.
- Adding or changing environment variables.
- Changing CI/CD, deployment, or production-like data workflows.
- Running destructive commands or data cleanup outside isolated test data.

### NEVER

- Never delete or reset real database data unless the user explicitly asks.
- Never edit `.env*` files into commits or expose secrets.
- Never put full source-of-truth design, architecture, data, or testing content into `openspec/config.yaml`.
- Never add broad frameworks or dependencies when a focused script/check is enough.

Detailed design, architecture, data, and testing rules live in the source docs above. `openspec/config.yaml` is only the concise process gate that routes agents to those docs.

## Deployment-Aware OpenSpec Lifecycle

Default flow for deployable changes:

```text
openspec:propose
  -> openspec:apply
  -> local validation
  -> commit and push
  -> Vercel deployment
  -> deployed smoke check
  -> openspec:archive
```

Small, low-risk fixes can use direct `main` deployment when the maintainer intentionally accepts production auto-deploy. CI/CD, deployment, environment variable, authentication, database, migration, production-like data workflow, or large UI changes should prefer a branch or Git worktree with Vercel Preview verification before merge, followed by production verification after merge.

Before archive, record the branch/worktree path used, local checks run, Vercel Preview or Production deployment result, deployed URL smoke check, and any skipped or manual-only checks.

## Validation Before Completion

For code or doc changes, run the smallest relevant command set.

Default for harness/doc/process changes:

```bash
npm run docs:check
npm run harness:check
```

Default for app behavior changes:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:unit
```

Use `npm run test` when database-backed behavior changes and a Prisma-compatible test database URL is available.

## Repo Map

| Path | Role |
| --- | --- |
| `app/` | App Router pages, layouts, and API routes. |
| `components/` | UI components and shadcn primitives. |
| `lib/actions.ts` | Current broad server action/service module. |
| `lib/monthly-refresh.ts` | Monthly refresh workflow engine. |
| `lib/balance-analysis.ts` | Balance analysis filtering and percentage logic. |
| `lib/fx.ts` | Currency conversion and FX rate caching. |
| `lib/pricing.ts` | Quote provider integration. |
| `lib/prisma.ts` | Prisma client. |
| `prisma/` | Schema and migrations. |
| `tests/` | Vitest tests. |
| `scripts/` | Local validation/test harness scripts. |
| `docs/` | Source-of-truth project docs. |
| `openspec/` | OpenSpec config and change artifacts. |
