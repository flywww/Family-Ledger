## Why

Logged-out users and users with expired sessions can reach protected app routes inconsistently because route protection is enumerated by page prefix. Family Ledger should enforce the same login redirect behavior for every protected page so private finance screens never render without an active session.

## What Changes

- Require every protected application page to redirect unauthenticated requests to `/login`.
- Treat expired sessions the same as logged-out sessions.
- Keep `/login` available to logged-out users and continue redirecting already-authenticated users away from `/login` to the app.
- Keep public and infrastructure routes, such as NextAuth API routes and Next static assets, outside the protected-page redirect rule.
- No breaking changes to credentials login, session shape, database schema, or finance data workflows.

## Capabilities

### New Capabilities
- `protected-route-auth-redirect`: Defines route-level authentication behavior for protected pages, including logged-out and expired-session redirects to `/login`.

### Modified Capabilities
- None.

## Impact

- Affected areas: authentication routing, `auth.config.ts`, `proxy.ts`, App Router protected pages, and validation tests for protected-route behavior.
- Source-of-truth docs to read before implementation: `docs/architecture-guide.md` and `docs/testing-strategy.md`.
- Visual impact: none.
- Reusable component impact: none; this is route/session behavior, not UI component work.
- Validation impact: existing `npm run typecheck`, `npm run lint`, and `npm run build` remain required; add or update focused tests for protected-route authorization behavior because authentication route behavior is changing.
- New validation needed: yes, focused tests or equivalent route-auth checks should cover logged-out access to representative protected pages and authenticated access to `/login`.
