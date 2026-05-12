## 1. Context And Existing Checks

- [x] 1.1 Read `docs/architecture-guide.md` and confirm the auth/proxy routing boundary for protected pages.
- [x] 1.2 Read `docs/testing-strategy.md` and confirm the expected validation path for authentication or protected-route behavior.
- [x] 1.3 Inspect `auth.config.ts`, `proxy.ts`, `app/(auth)/*`, and existing Vitest tests before changing route policy.

## 2. Route Policy Implementation

- [x] 2.1 Replace enumerated protected-page prefix checks with a centralized protected-route policy that covers every authenticated app page.
- [x] 2.2 Preserve public access to `/login` for logged-out users and redirect authenticated `/login` requests to `/dashboard`.
- [x] 2.3 Preserve public/infrastructure exclusions for NextAuth API routes, Next static assets, image optimization assets, and routes excluded by the proxy matcher.
- [x] 2.4 Treat absent or expired sessions as unauthenticated for protected-page route decisions.

## 3. Validation Coverage

- [x] 3.1 Add focused Vitest coverage for logged-out protected-page redirects to `/login`.
- [x] 3.2 Add focused Vitest coverage for expired-session-equivalent protected-page behavior.
- [x] 3.3 Add focused Vitest coverage for logged-out `/login` access and authenticated `/login` redirect to `/dashboard`.
- [x] 3.4 Add focused validation for public/infrastructure route exclusions, or document any matcher-level behavior that remains manual-only.

## 4. Verification

- [x] 4.1 Run `npm run test:unit`.
- [x] 4.2 Run `npm run typecheck`.
- [x] 4.3 Run `npm run lint`.
- [x] 4.4 Run `npm run build`.
- [x] 4.5 Run `npm run architecture:check` if implementation changes auth helper exports or import boundaries.
- [x] 4.6 Perform a no-visual-impact visual review: confirm protected-route redirects land on the existing `/login` page and authenticated pages keep their current layout.
- [x] 4.7 Run `npm run harness:check` when final full-harness validation is appropriate, or record why a narrower command set was used.
- [x] 4.8 Report skipped checks, failing checks, and any manual-only route-policy review notes in the implementation handoff.
