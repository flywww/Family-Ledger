## 1. Runtime Region Configuration

- [x] 1.1 Update `vercel.json` to set project-level Vercel Function region to `sin1` while preserving the existing monthly refresh cron.
- [x] 1.2 Add or update a lightweight validation check so repository validation can detect if `vercel.json` no longer sets `regions` to exactly `["sin1"]`.
- [x] 1.3 Document the post-deploy verification step: Vercel deployment metadata must show `regions: ["sin1"]`.

## 2. Database Connection Configuration

- [x] 2.1 Update the implementation notes or relevant repo docs to state that production runtime `DATABASE_URL` must use the Neon pooled `-pooler` hostname.
- [x] 2.2 Document the direct Neon connection variable used for Prisma CLI, migrations, and administrative workflows.
- [x] 2.3 Review Vercel production environment variables manually and record that runtime and direct database URLs are not confused.

## 3. Critical Failure Handling

- [x] 3.1 Identify the critical Prisma reads used by `/balance` and `/dashboard`, including settings, balance, value data, and refresh-state reads.
- [x] 3.2 Refactor selected critical page data paths so Prisma connectivity failures are not swallowed as `undefined` or empty successful data.
- [x] 3.3 Keep server-side logging for database failures while ensuring user-facing errors do not expose credentials, hosts, or secrets.
- [x] 3.4 Preserve non-critical optional behavior only where fallback data is explicitly safe and documented in code or task notes.

## 4. Validation

- [x] 4.1 Add focused tests or a documented manual failure-path review for Prisma connectivity failures on `/balance` and `/dashboard`.
- [x] 4.1a Confirm visual review remains no-impact because the change uses the existing error boundary path and adds no new UI.
- [x] 4.2 Run focused validation for changed behavior, including any new tests and the static region/config check.
- [x] 4.3 Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`, `pnpm run architecture:check`, and `pnpm run docs:check`.
- [x] 4.4 Run `pnpm run harness:check` if the focused checks pass and runtime cost is acceptable; otherwise record the skipped reason.

## 5. Deployment Verification

- [x] 5.1 Deploy the validated change to Vercel.
- [x] 5.2 Verify Vercel deployment metadata shows `regions: ["sin1"]`.
- [x] 5.3 Navigate production `/balance` and `/dashboard` and confirm normal traffic no longer emits Prisma reachability errors for the Neon host.
- [x] 5.4 Record any skipped checks, manual-only checks, or follow-up monitoring gaps in the change notes before archive.

## Production Verification Notes

- Production env review completed with Vercel CLI on 2026-05-11. `POSTGRES_PRISMA_URL` and `POSTGRES_URL` were confirmed as pooled hostnames, and `POSTGRES_URL_NON_POOLING` was confirmed as the direct/non-pooler administrative connection.
- Production `DATABASE_URL` initially pointed at a direct/non-pooler hostname. It was replaced with the existing pooled `POSTGRES_PRISMA_URL` value. The newly written production `DATABASE_URL` is sensitive and is not readable through `vercel env pull`; shape was validated before write from the pooled source value.
- Production deployment `dpl_EoaiMRSrs4mBujcyU4C9s42SrX69` completed and was aliased to `https://family-ledger.stanley004.com`.
- `vercel inspect family-ledger-pmbt69jrd-flywwws-projects.vercel.app` showed serverless functions in `[sin1]`.
- Production `/balance` and `/dashboard` returned HTTP 200. Response IDs included `hkg1::sin1`, confirming the requests reached Singapore runtime functions.
- Recent Vercel production log queries for error-level logs, `Prisma`, and `Can't reach database server` returned no matching errors for the new deployment window.
- No manual visual review was needed beyond confirming this change adds no UI and uses the existing error boundary behavior for critical database failures.
