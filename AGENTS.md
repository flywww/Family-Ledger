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

## Working Rules

- Preserve unrelated local changes.
- Do not delete or reset the database unless the user explicitly asks.
- Demo/test data must be additive or isolated.
- No durable rule without a validation path.
- If a source-of-truth doc changes, update `docs/validation-harness.md` with the validation method or manual review path.
- OpenSpec config should route to docs; it should not duplicate full source-of-truth content.
- Prefer small, focused harness checks before adding broad frameworks or dependencies.

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
