## 1. Data Model

- [x] 1.1 Add Agent API Prisma models and migration.
  TDD behavior: API keys and audit logs persist with user ownership, hashed token storage, masked display metadata, preview IDs, expiration, idempotency metadata, and structured old/new values.
  Public interface: Prisma-backed Agent API service functions for key creation, key lookup, preview audit creation, and apply audit creation.
  Test command: npm run test
  Mocking: mock clock and token generator boundary only; do not mock Prisma persistence.
  Module depth: small service interface over deeper Prisma mapping helpers.
  Manual-only: migration review for production safety and rollback expectations.
  - [x] RED: Add failing DB-backed tests for key persistence, hash-only storage, preview audit records, and apply audit records.
  - [x] GREEN: Add Prisma models, migration, and minimal service code until tests pass.
  - [x] REFACTOR: Extract Prisma mapping helpers only after GREEN; rerun `npm run test`.
  - [x] VALIDATE: Record migration path, rollback notes, and DB-backed test evidence. Evidence: `npm run test` passed 48 tests with isolated schema `family_ledger_test_1779900499864`; migration path is `prisma/migrations/20260528090000_add_agent_api_access/migration.sql`; rollback requires preserving or exporting `AgentApiKey`, `AgentAuditLog`, and `AgentRateLimit` rows if production agent data exists.

## 2. Agent API Services And Routes

- [x] 2.1 Implement API-key authentication and fixed presets.
  TDD behavior: valid keys authenticate to the owning user, revoked keys fail, `Read only` keys cannot write, and `Balance writer` keys can access write dry-run/apply paths.
  Public interface: `/api/agent/tools/*` route auth boundary plus server-only agent auth service.
  Test command: npm run test
  Mocking: mock token generation and clock only; do not mock API-key lookup persistence.
  Module depth: route handlers stay thin; auth service owns hash, prefix, scope, revoke, and preset checks.
  Manual-only: security review for token logging and one-time token display behavior.
  - [x] RED: Add failing tests for valid, revoked, read-only, and balance-writer authentication.
  - [x] GREEN: Implement token hash verification, preset checks, and route auth helpers.
  - [x] REFACTOR: Consolidate auth error response helpers while tests stay GREEN.
  - [x] VALIDATE: Rerun focused DB-backed auth tests and record evidence. Evidence: `npm run test` passed 48 tests with isolated schema `family_ledger_test_1779900499864`.

- [x] 2.2 Implement read-only holding and balance tools.
  TDD behavior: `list_holdings`, `get_holding`, `list_balances`, and `get_balance` return only the API-key owner data; balance reads require `month=YYYY-MM`.
  Public interface: `/api/agent/tools/list_holdings`, `/api/agent/tools/get_holding`, `/api/agent/tools/list_balances`, `/api/agent/tools/get_balance`.
  Test command: npm run test
  Mocking: mock clock/timezone only when needed for month-boundary tests; do not mock Prisma reads.
  Module depth: thin route handlers over query services that reuse existing month helpers.
  Manual-only: response-shape review to avoid leaking unrelated user data.
  - [x] RED: Add failing tests for owner scoping, missing month rejection, timestamp rejection, and app-local month-key behavior.
  - [x] GREEN: Implement read tools and validation.
  - [x] REFACTOR: Extract shared response shaping only after tests pass.
  - [x] VALIDATE: Rerun focused read and month-key tests. Evidence: `npm run test` passed 48 tests with isolated schema `family_ledger_test_1779900499864`.

- [x] 2.3 Implement single-balance dry-run tools.
  TDD behavior: create/update dry-run validates one balance request, requires existing holdings, returns current/proposed/value-data impact, creates a 10-minute preview audit record, and does not mutate balances or `ValueData`.
  Public interface: `/api/agent/tools/create_balance_dry_run`, `/api/agent/tools/update_balance_dry_run`.
  Test command: npm run test
  Mocking: mock clock for preview expiration; do not mock Prisma balance reads or audit writes.
  Module depth: dry-run service owns validation, preview construction, impact calculation, and audit record creation.
  Manual-only: review preview response clarity for external agent usability.
  - [x] RED: Add failing tests for no-mutation dry-run, missing holding rejection, preview fields, and 10-minute expiration metadata.
  - [x] GREEN: Implement dry-run services and route handlers.
  - [x] REFACTOR: Share create/update preview helpers after GREEN.
  - [x] VALIDATE: Rerun focused dry-run tests and record evidence. Evidence: `npm run test` passed 48 tests with isolated schema `family_ledger_test_1779900499864`.

- [x] 2.4 Implement single-balance apply tools.
  TDD behavior: apply requires a valid non-expired preview ID plus idempotency key, rejects mismatches and conflicts, writes exactly one balance create/update, rebuilds `ValueData` for the affected month only, and records structured audit logs.
  Public interface: `/api/agent/tools/create_balance_apply`, `/api/agent/tools/update_balance_apply`.
  Test command: npm run test
  Mocking: mock clock for expiration and idempotency windows; do not mock Prisma mutations or `ValueData` persistence.
  Module depth: apply service owns preview validation, idempotency, mutation, value-data rebuild, and audit status.
  Manual-only: review failure messages for recoverable agent behavior.
  - [x] RED: Add failing tests for missing preview, expired preview, mismatched preview, idempotent retry, idempotency conflict, and `ValueData` rebuild.
  - [x] GREEN: Implement apply services and route handlers.
  - [x] REFACTOR: Extract shared apply transaction helpers after GREEN.
  - [x] VALIDATE: Rerun focused apply tests and record evidence. Evidence: `npm run test` passed 48 tests with isolated schema `family_ledger_test_1779900499864`.

- [x] 2.5 Implement Agent API limits and unsupported-tool behavior.
  TDD behavior: per-key limits reject more than 100 reads/hour, 20 dry-runs/hour, or 10 applies/day; project-wide limits reject more than 500 agent API requests/day; unsupported holding writes, bulk writes, and deletes do not mutate data.
  Public interface: Agent API route middleware and unsupported `/api/agent/tools/*` handlers.
  Test command: npm run test
  Mocking: mock clock for rate-limit windows; do not mock persistent counter storage if counters are DB-backed.
  Module depth: route middleware calls a server-only rate-limit service.
  Manual-only: review Vercel Hobby usage assumptions before deployment.
  - [x] RED: Add failing tests for per-key limits, project-wide limit, reset time response, and unsupported tool rejection.
  - [x] GREEN: Implement counters, limit checks, and unsupported-tool responses.
  - [x] REFACTOR: Consolidate rate-limit error shaping after GREEN.
  - [x] VALIDATE: Rerun focused rate-limit and unsupported-tool tests. Evidence: `npm run test` passed 48 tests with isolated schema `family_ledger_test_1779900499864`.

## 3. Settings UI And User Experience

- [x] 3.1 Implement Agent Access Settings UI from the prototype.
  TDD behavior: Settings lets a signed-in user view keys, create a key using fixed presets, see the token once, revoke a key, and view a small recent activity panel.
  Public interface: authenticated Settings route/components and key management server actions or route handlers.
  Test command: npm run test
  Mocking: mock token generation and clock only; do not mock persistence for create/revoke behavior.
  Module depth: UI components stay shallow; server-only services own key creation, revoke, and activity queries.
  Manual-only: visual review at desktop and mobile widths.
  - [x] RED: Add failing DB-backed tests for create/revoke/recent-activity backing behavior.
  - [x] GREEN: Implement Settings UI and backing actions/routes.
  - [x] REFACTOR: Extract reusable Settings panel pieces only if duplication appears.
  - [x] VALIDATE: Complete visual review against `prototype/notes.md` and `docs/prototypes/agent-api-key-management.html`. Evidence: reviewed `/setting` in Chrome against `http://localhost:3004/setting` on the production Next server using a temporary isolated Postgres schema; desktop view showed Agent Access inside Settings, fixed presets, one-time token state, masked key list, destructive revoke confirmation, revoked key status, and recent activity; narrow-window review showed Settings navigation stacking above the Agent Access panel with readable controls, key cards, and recent activity.

- [x] 3.2 Add UI user-flow validation for Agent Access.
  TDD behavior: user can navigate to Settings > Agent Access, create a key, understand one-time token display, return to masked key list, revoke a key, and see recent activity update.
  Public interface: browser-visible Settings user flow.
  Test command: npm run test
  Mocking: use deterministic test user, token generator, and clock; do not mock the user-facing key lifecycle.
  Module depth: keep user-flow test at route/page level; avoid testing private component internals.
  Manual-only: if current repo tooling cannot run browser-style UI tests, ask before adding a dependency and record the approved closest available UI-flow validation path.
  - [x] RED: Add a failing UI user-flow test or approved closest available user-flow test for create-visible and revoke-visible behavior. Evidence: manual browser flow initially exposed missing recent-activity refresh after key create/revoke.
  - [x] GREEN: Implement the minimum UI wiring until the flow passes. Evidence: key creation and revoke server actions now record `create_agent_key` and `revoke_agent_key` audit entries and return refreshed activity to the client.
  - [x] REFACTOR: Improve labels, loading states, and confirmation copy while the flow remains GREEN. Evidence: retained existing Settings panel structure; added no new broad abstractions.
  - [x] VALIDATE: Run the UI flow, record viewport coverage, and include visual review evidence. Evidence: Chrome flow created an Agent API key, showed the full one-time `fl_live_...` token with recovery warning, showed only masked metadata after refresh, required a destructive confirmation modal for revoke, changed active key count to zero after revoke, and showed recent `create_agent_key` plus `revoke_agent_key` activity. Viewport coverage: desktop Chrome and a narrowed Chrome window approximating mobile width; Browser `iab` was unavailable and Playwright is not installed, so no automated screenshot test was added.

## 4. Final Validation And Deployment Gates

- [x] 4.1 Run final local validation and prepare deployment evidence.
  TDD behavior: all Agent API v1 behaviors remain covered after integration, and deployable change evidence is ready before repository or deployment state changes.
  Public interface: Agent API routes, Settings UI flow, OpenSpec artifacts, and validation commands.
  Test command: npm run test
  Mocking: no new mocks beyond the focused tests already justified above.
  Module depth: no new implementation modules in this task; this is integration validation.
  Manual-only: agent-led deployment checkpoints require maintainer confirmation before commit/push, deployment inspection, protected smoke checks, or archive.
  - [x] RED: Confirm no required validation evidence is missing from task notes. Evidence: browser-visible Settings user-flow validation and visual viewport review were completed through Chrome manual flow after Browser `iab` remained unavailable.
  - [x] GREEN: Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, and the approved UI user-flow validation command. Evidence: `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test` passed; DB-backed test suite passed 8 files and 48 tests with isolated schema `family_ledger_test_1779930509350`; approved closest UI-flow validation was manual Chrome validation because Browser `iab` was unavailable and Playwright is not installed.
  - [x] REFACTOR: Fix only validation failures directly caused by this change; rerun failed checks. Evidence: fixed recent-activity refresh discovered during browser validation, then reran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test`.
  - [x] VALIDATE: Record skipped checks, manual-only checks, Vercel Preview/Production plan, and smoke-check expectations before archive. Evidence: `npm run design:check`, `npm run architecture:check`, `npm run docs:check`, `openspec validate add-agent-api-access --no-interactive`, and `git diff --check` passed. Manual-only checks: desktop and narrowed-window Chrome review of Settings Agent Access. Skipped automated UI screenshot test: no repo browser test harness and no approved new dependency. Deployment gate remains: local validation complete -> ask before commit/push -> Vercel deployment inspection -> deployed smoke check -> archive only after deployment evidence is recorded.
