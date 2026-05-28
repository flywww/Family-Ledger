## ADDED Requirements

### Requirement: Agent API keys
The system SHALL allow authenticated users to create, view, and revoke dedicated agent API keys without exposing stored token secrets.

#### Scenario: Create key shows token once
- **WHEN** an authenticated user creates an agent API key with a fixed preset
- **THEN** the system returns the full token exactly once and stores only a hash plus token prefix and last-four display metadata

#### Scenario: Revoked key cannot authenticate
- **WHEN** an external agent calls an Agent API route with a revoked key
- **THEN** the system rejects the request with an authentication error and records the rejected attempt when a key match can be identified

### Requirement: Fixed access presets
The system SHALL support fixed Agent API access presets for v1 instead of custom scope checkboxes.

#### Scenario: Read-only preset
- **WHEN** a user creates a `Read only` key
- **THEN** the key can read holdings and balances but cannot dry-run or apply balance writes

#### Scenario: Balance writer preset
- **WHEN** a user creates a `Balance writer` key
- **THEN** the key can read holdings, read balances, dry-run single-balance create/update operations, and apply previewed single-balance create/update operations

### Requirement: Tool-style Agent API routes
The system SHALL expose v1 Agent API operations as tool-style routes under `/api/agent/tools/*`.

#### Scenario: Supported tools are explicit
- **WHEN** an external agent integrates with v1
- **THEN** the available operations are `list_holdings`, `get_holding`, `list_balances`, `get_balance`, `create_balance_dry_run`, `create_balance_apply`, `update_balance_dry_run`, and `update_balance_apply`

#### Scenario: Deferred tools are unavailable
- **WHEN** an external agent requests holding writes, bulk balance writes, or balance deletes
- **THEN** the system returns a not-supported response instead of mutating data

### Requirement: Month-key balance reads
The system SHALL require `month=YYYY-MM` as a month key for balance read endpoints.

#### Scenario: List balances requires month key
- **WHEN** an external agent calls `list_balances` without `month=YYYY-MM`
- **THEN** the system rejects the request with a validation error

#### Scenario: Timestamp month filters are rejected
- **WHEN** an external agent passes a timestamp such as `2026-05-01T00:00:00Z` as the month filter
- **THEN** the system rejects the request and explains that Agent API month filters use `YYYY-MM`

#### Scenario: App-local month is stable
- **WHEN** an external agent requests `month=2026-05`
- **THEN** the system reads balances for the app-local May 2026 period using the existing month helper semantics

### Requirement: Read endpoints
The system SHALL provide read endpoints that return scoped holding and balance data for the API-key owner.

#### Scenario: List holdings
- **WHEN** an external agent calls `list_holdings` with a valid key
- **THEN** the system returns only holdings owned by the key's user

#### Scenario: List month balances
- **WHEN** an external agent calls `list_balances` with a valid key and `month=YYYY-MM`
- **THEN** the system returns only balances owned by the key's user for that month

#### Scenario: Balance values use stored numbers
- **WHEN** an external agent reads a balance
- **THEN** the system returns stored `quantity`, `price`, and `value` as JSON numbers plus `currency` without display-currency conversion

### Requirement: Dry-run before writes
The system SHALL require a dry-run preview before every Agent API balance write.

#### Scenario: Dry-run create balance
- **WHEN** an external agent dry-runs a single-balance create request with a valid existing `holdingId`
- **THEN** the system returns a preview with operation, target month, holding, current balance state, proposed balance, value-data impact, confirmation status, preview ID, and expiration time without creating a balance

#### Scenario: Dry-run update balance
- **WHEN** an external agent dry-runs a single-balance update request
- **THEN** the system returns a preview with old values, proposed values, target month, value-data impact, confirmation status, preview ID, and expiration time without updating the balance

#### Scenario: Missing holding is rejected
- **WHEN** an external agent dry-runs a balance create request for a missing `holdingId`
- **THEN** the system rejects the request instead of automatically creating a holding

### Requirement: Apply previewed writes
The system SHALL apply Agent API balance writes only when the request references a valid dry-run preview and idempotency key.

#### Scenario: Apply requires preview ID
- **WHEN** an external agent calls an apply endpoint without a `previewId`
- **THEN** the system rejects the request without mutating balances or `ValueData`

#### Scenario: Apply rejects expired preview
- **WHEN** an external agent calls an apply endpoint more than 10 minutes after the referenced preview was created
- **THEN** the system rejects the request without mutating balances or `ValueData`

#### Scenario: Apply rejects mismatched preview
- **WHEN** an external agent calls an apply endpoint with a preview created by another key, user, action, or payload
- **THEN** the system rejects the request without mutating balances or `ValueData`

#### Scenario: Apply rebuilds value data
- **WHEN** an external agent successfully applies a single-balance create or update
- **THEN** the system writes the balance mutation, rebuilds `ValueData` for the affected month only, and records an applied audit entry

### Requirement: Idempotency safeguards
The system SHALL enforce idempotency for Agent API apply endpoints.

#### Scenario: Repeated apply with same content
- **WHEN** an external agent retries the same apply request with the same `idempotencyKey`
- **THEN** the system returns the original result without applying the mutation twice

#### Scenario: Reused key with different content
- **WHEN** an external agent reuses an `idempotencyKey` with different request content
- **THEN** the system rejects the request with an idempotency conflict

### Requirement: Agent audit logs
The system SHALL store structured audit logs for Agent API requests without storing full raw request or response payloads.

#### Scenario: Dry-run audit log
- **WHEN** an external agent requests a dry-run preview
- **THEN** the system records a structured audit entry with action, status, target metadata, month key, preview ID, expiration time, API key ID, user ID, and request hash

#### Scenario: Apply audit log
- **WHEN** an external agent applies a previewed balance write
- **THEN** the system records old values, new values, target balance or holding metadata, month key, idempotency key, API key ID, user ID, and result status

### Requirement: Agent API rate limits
The system SHALL enforce conservative Agent API limits suitable for a personal Vercel Hobby deployment.

#### Scenario: Per-key limits
- **WHEN** an API key exceeds 100 read requests per hour, 20 dry-run requests per hour, or 10 apply requests per day
- **THEN** the system rejects further matching requests with `rate_limit_exceeded` and a reset time

#### Scenario: Project-wide limit
- **WHEN** total Agent API traffic exceeds 500 requests per day across the project
- **THEN** the system rejects further Agent API requests with `rate_limit_exceeded` and a reset time

### Requirement: Settings Agent Access UI
The system SHALL provide an Agent Access Settings experience for managing agent keys and reviewing recent activity.

#### Scenario: Create key user flow
- **WHEN** a user opens Settings, selects Agent Access, creates a key with a fixed preset, and submits the form
- **THEN** the UI shows the full token once, explains that it cannot be recovered later, and then returns to a key list that only displays masked token metadata

#### Scenario: Revoke key user flow
- **WHEN** a user revokes an existing agent key through Settings
- **THEN** the UI requires a clear confirmation step, applies destructive styling with text, and updates the key list so the revoked key is no longer active

#### Scenario: Recent activity panel
- **WHEN** a user views Agent Access Settings
- **THEN** the UI shows a small recent activity panel with recent agent request action, target, result, key name, and time

### Requirement: Source-rule validation mapping
The system SHALL map Agent API durable rules to validation paths before implementation is considered complete.

#### Scenario: DB-backed validation
- **WHEN** Agent API persistence, API-key auth, dry-run/apply, audit logging, rate limits, idempotency, month semantics, or `ValueData` rebuild behavior changes
- **THEN** implementation evidence includes DB-backed tests through `npm run test`

#### Scenario: UI user-flow validation
- **WHEN** Agent Access Settings UI is implemented
- **THEN** implementation evidence includes a UI user-flow test or an approved closest available UI-flow validation path covering create key, one-time token display, revoke key, and recent activity

#### Scenario: Standard app validation
- **WHEN** the Agent API v1 implementation is ready for handoff
- **THEN** validation evidence includes `npm run typecheck`, `npm run lint`, `npm run build`, and relevant focused tests
