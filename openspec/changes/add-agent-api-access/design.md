## Context

Family Ledger currently uses Next.js App Router, NextAuth browser sessions, Prisma, and broad server actions in `lib/actions.ts` for authenticated finance workflows. Balance creation and updates must keep `ValueData` synchronized for dashboard charts, and month handling must use month keys rather than raw timestamps.

The new Agent API will live inside the existing Next.js app to keep deployment simple on Vercel and avoid duplicating Family Ledger business logic in a separate service. External agents will authenticate with dedicated API keys, not browser sessions.

Relevant source docs read for this design:

- `docs/architecture-guide.md`
- `docs/data-model-guide.md`
- `docs/testing-strategy.md`
- `docs/design-system.md`
- `docs/feature-backlog.md`
- `docs/validation-harness.md`

## Goals / Non-Goals

**Goals:**

- Provide network-accessible tool-style endpoints under `/api/agent/tools/*`.
- Let agents read holdings and month-scoped balances.
- Let agents create and update exactly one balance per apply request.
- Require dry-run preview before every write.
- Require `previewId` plus `idempotencyKey` for apply.
- Store agent API keys as hashed tokens with fixed presets.
- Record structured audit logs in the database without showing agent markers on the normal Balance page.
- Rebuild `ValueData` only for the affected month after writes.
- Add Settings UI for key creation, one-time token display, revoke flow, and recent activity.
- Validate the user experience with a UI user-flow test or the closest available UI-flow harness approved during implementation.

**Non-Goals:**

- No separate Node service or standalone MCP transport in v1.
- No holding create/update endpoints in v1.
- No bulk balance writes in v1.
- No balance delete endpoint in v1.
- No custom scope checkbox matrix in v1.
- No display-currency conversion in Agent API v1 responses.
- No visible `Updated by agent` marker on the normal Balance page in v1.

## Decisions

### Keep Agent API inside Next.js

Implement the Agent API as Next.js API route handlers under `/api/agent/tools/*`.

Alternatives considered:

- Separate Node MCP service: rejected for v1 because it adds Vercel deployment and maintenance overhead and risks duplicated finance logic.
- Browser-session server actions: rejected because external agents need API-key authentication, not a normal interactive browser session.

### Use tool-style routes

Expose v1 operations as tool-style routes:

- `list_holdings`
- `get_holding`
- `list_balances`
- `get_balance`
- `create_balance_dry_run`
- `create_balance_apply`
- `update_balance_dry_run`
- `update_balance_apply`

Tool-style routes map cleanly to future MCP wrappers and make agent capabilities explicit. Resource-style REST routes can be added later only if needed.

### Dedicated API-key authentication

Add `AgentApiKey` records owned by a user. Store only a token hash. Show the raw token exactly once after creation. Use token prefixes:

- `fl_live_<random>` for production
- `fl_test_<random>` for non-production

Display saved keys as prefix plus last four characters, for example `fl_live_...7c91`.

V1 uses fixed presets:

- `Read only`: `holdings:read`, `balances:read`
- `Balance writer`: `holdings:read`, `balances:read`, `balances:write`

### Store structured audit logs only

Add `AgentAuditLog` for structured records, not full raw payloads. Store fields such as `action`, `status`, `targetType`, `targetId`, `monthKey`, `oldValues`, `newValues`, `errorCode`, `previewId`, `idempotencyKey`, `apiKeyId`, `userId`, `requestHash`, `expiresAt`, and timestamps.

This keeps traceability while limiting financial data duplication and payload growth.

### Use audit-log preview records for dry-run/apply

Dry-run requests validate the requested write, compute current/proposed values, report `ValueData` impact, and create a preview/audit record with a 10-minute `expiresAt`. Dry-run must not mutate balances or `ValueData`.

Apply requests must provide:

- `previewId`
- `idempotencyKey`

Apply rejects missing previews, expired previews, preview/API-key/user mismatches, and reused idempotency keys with different content.

### Treat `month=YYYY-MM` as a month key

Read and write endpoints that target balances require `month=YYYY-MM`. The API rejects raw timestamps for month filters. Route handlers should reuse existing month helpers and app-local timezone rules so `2026-05` maps to the Family Ledger May period regardless of UTC boundary effects.

### Return stored numeric values

Return stored `quantity`, `price`, and `value` as JSON numbers because the current Prisma schema uses `Float`. Include `currency`; do not convert to display currency in v1.

### Enforce conservative Vercel Hobby-aware limits

Vercel Hobby includes 1,000,000 function invocations, but the Agent API should protect financial data and database capacity far below that platform ceiling.

V1 limits:

- `100` read requests per hour per key
- `20` dry-run requests per hour per key
- `10` apply requests per day per key
- `1` balance per write request
- `500` total agent API requests per day across the project

Return a structured `rate_limit_exceeded` error with reset time.

### Settings UI and user-flow validation

Add Agent Access inside the existing Settings area. Use the reference prototype at `prototype/notes.md` and `docs/prototypes/agent-api-key-management.html` for structure.

The UI should support:

- viewing keys
- creating a key with fixed presets
- seeing the full token once
- revoking a key
- seeing small recent activity

Visual Validation:

- Review Settings at desktop and mobile widths.
- Confirm title/subtitle change by selected Settings section.
- Confirm Agent Access controls are inside Agent Access, not global Settings navigation.
- Confirm one-time token display is clear and not recoverable later.
- Confirm revoke flow is visually destructive and requires confirmation.
- Confirm recent activity is readable without becoming a full audit-log tool.

### TDD Design

Behavior tests should use public route handlers or HTTP-level route tests where practical, with DB-backed execution through `npm run test`.

Mocking:

- Mock clock/time for preview expiration and rate-limit windows.
- Mock token generation only at the boundary so token format and hash storage are deterministic.
- Do not mock Prisma internals for persistence behavior.

Interface design:

- Keep route handlers thin.
- Put reusable agent auth, rate-limit, preview/apply, and audit behavior behind server-only service modules.
- Reuse existing month helpers and `rebuildValueDataForMonth()` rather than duplicating balance aggregation rules.

Module depth:

- Small public route/tool interfaces.
- Deeper server-only modules for auth, validation, preview/apply, audit logging, and rate-limit logic.

Refactoring checkpoint:

- After GREEN behavior tests pass, extract shared agent service helpers only where duplication appears across read, dry-run, and apply handlers.

## Risks / Trade-offs

- API-key leakage could expose financial data -> Store only hashes, show tokens once, allow revoke, and use scoped presets.
- Agent retry loops could burn Vercel/DB capacity -> Enforce per-key and project-wide limits plus idempotency.
- Dry-run previews could become stale -> Expire previews after 10 minutes and reject mismatched apply calls.
- Month boundary bugs could write the wrong period -> Require `YYYY-MM` month keys and test timezone boundaries.
- Audit logs could grow too quickly -> Store structured summaries, not full raw payloads.
- UI tests may need tooling not currently installed -> During apply, inspect available tooling first and ask before adding dependencies; if a UI-flow harness is approved, add it as part of the implementation.
- Settings UI could become too dense -> Keep v1 to fixed presets, recent activity, and basic key lifecycle; defer full audit browsing.

## Migration Plan

1. Add Prisma models and generate a migration for `AgentApiKey` and `AgentAuditLog`.
2. Add server-only Agent API service modules and route handlers.
3. Add DB-backed tests for auth, reads, dry-run, apply, idempotency, expiration, rate limits, audit logs, and `ValueData` rebuild.
4. Add Settings UI for Agent Access.
5. Add UI user-flow validation for create/revoke/recent activity, using existing tooling or an approved minimal UI-flow test tool.
6. Run local validation.
7. Use agent-led deployment gates before commit/push, deployment verification, deployed smoke check, and archive.

Rollback:

- Disable Agent API routes or reject all API-key auth if a safety issue appears.
- Revoke affected keys.
- Keep audit logs for diagnosis.
- Roll back the migration only if no production Agent API data must be preserved.

## Open Questions

- Which UI-flow test tool should be used if the repo does not already have one active?
- Should rate-limit counters live only in Postgres for v1, or use another storage mechanism later if traffic grows?

## Visual Review

Prototype reference:

- `prototype/notes.md`
- `docs/prototypes/agent-api-key-management.html`

Smallest useful visual artifact:

```text
Settings
├─ Profile
├─ Display
├─ Refresh jobs
├─ Agent access
│  ├─ API keys
│  ├─ Create key
│  ├─ One-time token
│  ├─ Revoke key
│  └─ Recent activity
└─ Danger zone
```

Visual Validation:

- Desktop and mobile Settings layout reviewed.
- Agent Access is a Settings section, not a top-level app page.
- Fixed presets and one-time token state are understandable.
- Recent activity supports user trust without exposing a full audit browser.
- Destructive revoke styling follows the design system and is not color-only.
