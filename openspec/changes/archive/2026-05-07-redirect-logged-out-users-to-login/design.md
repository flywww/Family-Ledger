## Context

Family Ledger uses NextAuth v5 with a `proxy.ts` wrapper and an `authorized` callback in `auth.config.ts`. The current callback protects selected route prefixes (`/dashboard`, `/balance`, and `/setting`) and redirects logged-out root requests to `/login`, but protection is not expressed as a default policy for every authenticated page.

Protected UI routes currently live under the `app/(auth)/` route group, but route groups are not visible in the browser URL. The implementation needs to protect URL paths that correspond to private pages without affecting `/login`, NextAuth API routes, static assets, or other infrastructure routes.

## Goals / Non-Goals

**Goals:**

- Redirect logged-out users and expired-session users to `/login` for every protected app page.
- Keep authenticated users from seeing `/login`; redirect them to `/dashboard`.
- Make protected-route behavior easier to extend when new authenticated pages are added.
- Validate the behavior with focused tests plus the existing TypeScript, lint, and build checks.

**Non-Goals:**

- Change credential login, password handling, JWT/session payload shape, or session duration.
- Add new auth providers or dependencies.
- Add Playwright or a new browser-test framework in this change.
- Change API authorization responses for existing API routes.
- Change visual design or reusable UI components.

## Decisions

### Decision: Centralize private page path policy in auth routing

Use a single protected-page path policy from the NextAuth `authorized` callback instead of continuing to scatter route checks as independent `isOnDashboard`, `isOnBalance`, and `isOnSetting` booleans.

Rationale: the bug is a route policy gap. A centralized helper or constant makes the intended public/private boundary visible and gives future protected pages one place to update.

Alternative considered: add checks only for currently missing pages. That would fix the immediate symptom but preserve the same drift risk for the next protected page.

### Decision: Preserve public login and infrastructure routes

Keep `/login` public for logged-out users, redirect authenticated `/login` requests to `/dashboard`, and leave NextAuth API routes and static assets outside the protected-page policy through the existing proxy matcher and callback checks.

Rationale: unauthenticated users need to reach the login page, and auth API/static requests must not be redirected as page navigations.

Alternative considered: protect every non-login route by default. That is stricter, but risks changing unrelated public utility routes such as `sitemap.ts` output or future intentionally public pages.

### Decision: Treat expired sessions as unauthenticated at the routing boundary

Use the existing `!!auth?.user` session presence check as the source of truth for route access. When NextAuth no longer provides a valid user because the session expired, the protected route follows the same redirect behavior as logout.

Rationale: this keeps behavior aligned with NextAuth's session lifecycle and avoids custom token-expiry parsing.

Alternative considered: inspect JWT expiration directly. That adds complexity and couples route behavior to token internals without improving the user-facing outcome.

### Decision: Add focused unit-level coverage for the route policy

Extract or structure the protected-route decision so it can be tested without launching a browser or database. Cover representative protected routes, `/login`, root, and public/infrastructure exclusions.

Rationale: Playwright is not active in this repo, and the testing strategy recommends focused tests for authentication/protected-route behavior. A small test can catch future route-policy drift without requiring deterministic browser auth setup.

Alternative considered: manual-only validation. That is too weak for a durable authentication rule.

## Validation Strategy

- Add focused Vitest coverage for protected-route authorization and redirect decisions.
- Run `npm run test:unit` so the new route-policy tests and existing unit tests pass.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` for app-level validation.
- Run `npm run architecture:check` if implementation extracts helpers or changes imports across auth/app boundaries.
- Manual review: confirm no API route authorization response is changed and no public/static route is newly redirected as a page.

## Visual Review

Visual impact: none. This change does not add, remove, or restyle visible UI components. The login page remains the same destination and existing protected pages keep their current layout after successful authentication.

Visual Validation Plan:

- Manually confirm that unauthenticated protected-page navigation lands on the existing `/login` page without visual changes to that page.
- Manually confirm that authenticated protected pages still render their existing surfaces after the route-policy change.
- No prototype is needed because the change is behavior-only and has no visual design surface.

## Risks / Trade-offs

- [Risk] A route intended to stay public could be included in the protected-page policy. -> Mitigation: keep public route exclusions explicit and test representative public paths.
- [Risk] A future authenticated page could be added without updating protected path policy. -> Mitigation: name the policy clearly and include task guidance to update tests when adding protected pages.
- [Risk] NextAuth callback return types can be easy to break when returning `Response.redirect` versus booleans. -> Mitigation: validate with TypeScript and focused route-policy tests.
