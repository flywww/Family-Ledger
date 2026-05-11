## Context

Family Ledger is deployed on Vercel Hobby as a Next.js App Router application using Prisma against a Neon PostgreSQL database in AWS Asia Pacific Singapore. The current production deployment runs Vercel Functions in `iad1`, while the Neon endpoint is in `ap-southeast-1`. Recent production logs show Prisma `Can't reach database server` errors on `/balance` and `/dashboard` during normal authenticated traffic.

The app currently uses a direct Neon hostname in `DATABASE_URL`. Several server action reads catch Prisma errors and return `undefined`, which lets authenticated pages render partial or fallback data while hiding critical database connectivity failures behind HTTP 200 responses.

Relevant source-of-truth docs:

- `docs/architecture-guide.md` for server action, Prisma, and runtime-flow boundaries.
- `docs/testing-strategy.md` for focused tests and database-backed test safety.
- `docs/validation-harness.md` for mapping durable rules to automated checks or manual review.

## Goals / Non-Goals

**Goals:**

- Run production Vercel Functions in the Singapore compute region nearest the Neon database.
- Use a Neon pooled connection string for production application traffic.
- Preserve a direct connection path for Prisma CLI, migrations, and administrative workflows.
- Make critical page data and settings failures visible instead of silently rendering partial financial pages.
- Add a lightweight validation path for region configuration, database URL shape, and failure behavior.

**Non-Goals:**

- Move or recreate the Neon database.
- Upgrade the Vercel plan or introduce multi-region failover.
- Replace Prisma, NextAuth, or the current server action architecture.
- Build a full observability platform.
- Refactor all of `lib/actions.ts` into feature modules.

## Decisions

### Decision: Use one Vercel Function region, `sin1`

Set the project-level Vercel Function region to `sin1` in `vercel.json`. Hobby supports a single function region, which fits this app because the database is also in Singapore.

Alternatives considered:

- Keep `iad1`: lower change risk, but preserves high cross-region latency and the current production failure shape.
- Move Neon near `iad1`: possible but higher data-migration risk and worse for Taiwan/Singapore-adjacent usage.
- Upgrade for multi-region functions: not needed for the current single-database architecture and not available on Hobby.

Validation:

- Automated or scripted check that `vercel.json` contains `"regions": ["sin1"]`.
- Post-deploy manual check of Vercel deployment metadata showing `regions: ["sin1"]`.

### Decision: Use pooled Neon URL for runtime traffic

Production `DATABASE_URL` should use the Neon pooled hostname with `-pooler` for application runtime traffic. Add or document a separate direct connection variable for Prisma CLI and administrative workflows.

Alternatives considered:

- Keep direct runtime connections: simpler but fragile in serverless traffic and cold-start patterns.
- Adopt Prisma Accelerate or a new adapter: more moving parts than needed for the current bug.

Validation:

- Manual Vercel environment review confirms production `DATABASE_URL` host includes `-pooler`.
- Local docs or scripts document which variable is used for direct Prisma workflows.
- Existing `pnpm run build` continues to generate Prisma client successfully.

### Decision: Surface critical database failures on authenticated page data paths

Critical reads for authenticated finance pages and settings should not swallow Prisma connectivity errors. Page-level data paths can either throw to the Next.js error boundary or return an explicit error state that the page renders clearly.

Critical reads identified for this change:

- `/balance`: last balance month, user settings, monthly balance rows, monthly refresh state, lagged-month creation state, and currency conversion reads used while flattening rows.
- `/dashboard`: last balance month, categories, user settings, monthly refresh state, value data, and currency conversion reads used while building chart data.
- Shared settings reads: display currency and display categories must not fall back to misleading defaults when the underlying settings read fails.

Alternatives considered:

- Continue returning `undefined`: avoids immediate UI work but hides outages and can show stale or misleading financial context.
- Convert every action at once to typed results: desirable later, but too broad for this fix.

Validation:

- Focused tests for selected query helpers or error-normalization logic.
- Manual runtime review of `/balance` and `/dashboard` behavior when database access fails, if a deterministic failure harness is not added in this change.

### Decision: Keep validation lightweight

Use targeted checks and manual deployment review rather than introducing new infrastructure. Durable rules are mapped through `docs/validation-harness.md`: configuration can be checked statically, deployed region and environment values need release review, and error behavior should be covered with focused tests where practical.

Alternatives considered:

- Add Playwright or external uptime monitoring now: useful later but too large for this connectivity fix.
- Add a health endpoint that touches production DB: useful, but it raises access-control and logging questions and is not required for the initial fix.

## Visual Review

Visual impact: none. This change intentionally uses the existing Next.js error boundary path for critical database failures rather than adding a new screen, component, or layout state.

Visual Validation: no viewport or screenshot review is required for this change. Validate behavior through focused failure-handling tests and production navigation after deployment.

## Risks / Trade-offs

- Region change could affect cron execution latency or external API latency. -> Keep cron in the same project-level region and verify monthly refresh logs after deployment.
- Pooled connections can behave differently from direct connections for session-level Postgres features. -> Family Ledger Prisma usage should avoid session state; keep direct URL for admin workflows.
- Vercel environment variable changes are outside the git diff. -> Tasks must include an explicit production environment review and post-deploy deployment metadata check.
- Throwing database errors can expose more visible error screens. -> Prefer clear failure over partial financial data; keep messages user-safe and log details server-side.
- Hobby has no multi-region function failover. -> Accept single-region `sin1` as the correct fit for one Singapore-hosted database.

## Migration Plan

1. Update `vercel.json` to set project-level function region to `sin1`.
2. Update production Vercel `DATABASE_URL` to the Neon pooled connection string.
3. Add or document the direct connection variable for Prisma administrative workflows.
4. Harden selected critical data paths so connectivity failures do not silently return partial page state.
5. Run focused local validation: typecheck, lint, build, architecture/docs checks, and any focused tests added for failure behavior.
6. Deploy to Vercel.
7. Verify deployment metadata shows `regions: ["sin1"]`.
8. Verify production `/balance` and `/dashboard` no longer emit Prisma reachability errors during normal navigation.

Rollback:

- Revert the `vercel.json` region change if deployment fails.
- Restore the previous Vercel `DATABASE_URL` only if pooled runtime connection causes a confirmed compatibility issue.
- Keep error-handling changes unless they cause a user-facing regression; partial financial pages should not be the fallback behavior.

## Open Questions

- What exact Neon direct connection variable name should be canonical in Vercel: `DIRECT_URL`, `POSTGRES_URL_NON_POOLING`, or the existing provider-specific variable already present in the project settings?
- Should this change add a small config validation script now, or fold the check into the existing docs/architecture validation harness during implementation?
