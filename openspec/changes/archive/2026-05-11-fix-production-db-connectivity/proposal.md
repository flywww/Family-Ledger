## Why

Production requests to `/balance` and `/dashboard` intermittently fail Prisma reads and writes with `Can't reach database server` against the Neon Singapore endpoint while Vercel Functions currently run in `iad1`. The app also catches several critical database failures and continues with partial data, so users can receive a successful page response while core financial data did not load or save.

## What Changes

- Run production Vercel Functions in the Singapore region nearest the Neon database.
- Use Neon connection pooling for production application traffic while preserving a direct connection path for Prisma administrative workflows.
- Make critical database connectivity failures visible to the application instead of silently returning partial data.
- Add focused validation so deployment region, database URL shape, and critical DB failure behavior can be reviewed before release.

## Capabilities

### New Capabilities
- `production-db-connectivity`: Production runtime database connectivity requirements for region alignment, pooled Neon application connections, and visible database failure handling.

### Modified Capabilities

## Impact

- `vercel.json` function region configuration.
- Vercel production environment variables for `DATABASE_URL` and direct Prisma connection variables.
- Prisma client usage and selected server action/query error handling in `lib/prisma.ts`, `lib/actions.ts`, and authenticated page data paths.
- Validation scripts, tests, or manual release checklist entries covering production deployment metadata and database connectivity configuration.

Visual impact: none
