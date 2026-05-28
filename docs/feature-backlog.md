# Feature Backlog

## Purpose

This document tracks accepted product requirements that are intentionally deferred from the current implementation stage. Use it when a feature is split into stages so future work is not lost during a narrow v1 implementation.

Backlog entries are not approval to implement immediately. Each entry still needs its own OpenSpec change, validation plan, and user confirmation before implementation.

## Backlog Rule

When a requirement is split across stages, add the deferred parts to this backlog before finishing the current planning or implementation turn.

Each entry should include:

- Feature area
- Deferred requirement
- Why it is deferred
- Suggested future stage
- Dependencies or safeguards
- Validation notes

## Entries

### Agent API - Holding Write Operations

- Feature area: Agent access / network-accessible API
- Deferred requirement: Allow trusted external agents to create and edit holdings through agent API calls.
- Why it is deferred: Agent write access to holdings can create duplicate or incorrect assets if it is shipped before the balance workflow, API-key scopes, dry-run previews, confirmation tokens, and audit logging are proven.
- Suggested future stage: Agent API v2, after v1 supports scoped API keys, balance write operations, read-only holding lookup, dry-run/apply safeguards, and agent audit logs.
- Dependencies or safeguards:
  - Dedicated `AgentApiKey` and `AgentAuditLog` tables exist.
  - Holding writes require scoped keys such as `holdings:write`.
  - Create and edit requests support dry-run previews before apply.
  - High-risk holding changes require confirmation tokens.
  - Duplicate detection covers name, symbol, category, type, and provider/source metadata.
  - Audit logs record old values, new values, target holding, request ID, key ID, and actor user.
- Validation notes:
  - Use DB-backed tests with `npm run test`.
  - Prove create/edit paths do not create duplicate holdings for the same user intent.
  - Prove balance creation still requires an existing `holdingId` unless the future change explicitly changes that rule.

### Agent API - Bulk Balance Writes

- Feature area: Agent access / network-accessible API
- Deferred requirement: Allow trusted external agents to create or update multiple balances in one request.
- Why it is deferred: Bulk writes can change many months or holdings at once, increasing the blast radius of agent mistakes. V1 should prove single-balance dry-run/apply, idempotency, audit logging, and value-data rebuild behavior first.
- Suggested future stage: Agent API v2 or later, after single-balance writes are stable.
- Dependencies or safeguards:
  - Single-balance `dry-run` and `apply` endpoints are implemented and audited.
  - Bulk dry-run returns per-row validation, per-row value-data impact, and a total impact summary.
  - Apply requires a preview ID, idempotency key, and confirmation token.
  - Request size limits and per-key daily write limits are enforced.
  - Partial failure behavior is explicitly designed before implementation.
- Validation notes:
  - Use DB-backed tests with `npm run test`.
  - Prove bulk apply cannot run without a matching non-expired preview.
  - Prove failed rows do not silently mutate data.

### Agent API - Balance Deletes

- Feature area: Agent access / network-accessible API
- Deferred requirement: Allow trusted external agents to delete balances.
- Why it is deferred: Delete operations are harder to recover from and easier for agents to misuse. V1 should support create and update only while deletes remain a manual UI workflow.
- Suggested future stage: Agent API v2 or later, after audit logs, preview/apply, confirmation tokens, and recovery expectations are proven.
- Dependencies or safeguards:
  - Delete dry-run shows the exact balance, holding, month, current value, and value-data impact.
  - Apply requires a preview ID, idempotency key, and confirmation token.
  - Audit logs record deleted balance fields before deletion.
  - Recovery or undo expectations are documented before implementation.
  - Deletes remain scoped to one balance per request unless bulk deletes are separately designed.
- Validation notes:
  - Use DB-backed tests with `npm run test`.
  - Prove delete apply cannot run without a matching non-expired preview and confirmation token.
  - Prove value data is rebuilt for the affected month after deletion.
