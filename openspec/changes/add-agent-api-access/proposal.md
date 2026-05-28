## Why

Family Ledger needs a safe network-accessible interface so trusted external agents can read portfolio context and create or update monthly balance records without using the browser UI. This must be designed with financial-data safeguards first because agent mistakes can mutate real asset values.

## What Changes

- Add an authenticated Agent API inside the existing Next.js app under `/api/agent/*`.
- Use dedicated agent API keys instead of browser sessions for external agent calls.
- Add API-key management UI in Settings with fixed presets, one-time token display, revoke flow, and a small recent activity panel.
- Add dedicated database tables for agent API keys and agent audit logs.
- Add read endpoints for holdings and balances.
- Add single-balance create/update dry-run and apply endpoints.
- Require `month=YYYY-MM` as a month key, not a timestamp, for balance reads and writes.
- Require dry-run previews before writes, `previewId` plus `idempotencyKey` for apply, and 10-minute preview expiration.
- Rebuild `ValueData` for the affected month after successful balance writes.
- Enforce conservative per-key and project-wide limits suitable for Vercel Hobby usage.
- Keep holding writes, bulk balance writes, and balance deletes deferred in `docs/feature-backlog.md`.
- Add DB-backed tests plus UI user-flow validation for the Settings experience.

Visual impact: medium.

Reusable component impact: reuse existing shadcn/ui and local settings/table/form/card primitives; extend only where needed for Agent Access panels and recent activity.

Validation impact: new validation through DB-backed tests, type/lint/build checks, and UI user-flow validation.

## Capabilities

### New Capabilities

- `agent-api-access`: Network-accessible Agent API, API-key management UI, read endpoints, guarded single-balance writes, audit logging, rate limits, and user-flow validation.

### Modified Capabilities

- None.

## Impact

- API routes: add `/api/agent/tools/*` handlers for tool-style external agent calls.
- Settings UI: add Agent Access management inside the existing authenticated Settings area.
- Prisma schema: add `AgentApiKey` and `AgentAuditLog` models, plus any supporting enum fields needed for presets, actions, statuses, previews, and audit metadata.
- Data workflows: reuse existing month helpers, Prisma access, and `rebuildValueDataForMonth()` after balance writes.
- Authentication: add API-key authentication that is separate from NextAuth browser sessions.
- Testing: add DB-backed tests with `npm run test`; add user-flow validation for Settings key creation, one-time token display, revoke flow, and recent activity.
- Vercel Hobby constraints: keep request payloads small, avoid bulk writes, and enforce conservative app-level rate limits far below platform limits.
