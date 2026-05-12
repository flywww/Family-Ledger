## ADDED Requirements

### Requirement: Protected pages redirect unauthenticated users to login
The system SHALL redirect requests for protected application pages to `/login` when the requester has no active authenticated session.

#### Scenario: Logged-out user opens dashboard
- **WHEN** a logged-out user requests `/dashboard`
- **THEN** the system redirects the request to `/login`

#### Scenario: Logged-out user opens balance page
- **WHEN** a logged-out user requests `/balance`
- **THEN** the system redirects the request to `/login`

#### Scenario: Logged-out user opens settings page
- **WHEN** a logged-out user requests `/setting`
- **THEN** the system redirects the request to `/login`

#### Scenario: Logged-out user opens a future protected page
- **WHEN** a logged-out user requests a route classified as a protected application page
- **THEN** the system redirects the request to `/login`

### Requirement: Expired sessions behave like logged-out sessions
The system SHALL treat expired sessions as unauthenticated for protected-page route access.

#### Scenario: Expired session opens protected page
- **WHEN** a user with an expired session requests a protected application page
- **THEN** the system redirects the request to `/login`

### Requirement: Login remains the public entry point
The system SHALL keep `/login` reachable to unauthenticated users and SHALL redirect authenticated users away from `/login` to the authenticated landing page.

#### Scenario: Logged-out user opens login
- **WHEN** a logged-out user requests `/login`
- **THEN** the system allows the request

#### Scenario: Logged-in user opens login
- **WHEN** an authenticated user requests `/login`
- **THEN** the system redirects the request to `/dashboard`

### Requirement: Non-page infrastructure routes are not login-redirected
The system MUST NOT apply protected-page login redirects to NextAuth API routes, Next static assets, image optimization assets, or other infrastructure routes excluded by the proxy matcher.

#### Scenario: Auth API route is requested without a session
- **WHEN** an unauthenticated request targets a NextAuth API route
- **THEN** the request is not redirected to `/login` by the protected-page route policy

#### Scenario: Static asset route is requested without a session
- **WHEN** an unauthenticated request targets a Next static or image asset route
- **THEN** the request is not redirected to `/login` by the protected-page route policy

### Requirement: Protected-route behavior has validation coverage
The system SHALL include focused validation coverage for protected-route redirects and login-route behavior.

#### Scenario: Route policy tests run
- **WHEN** the focused unit validation command runs
- **THEN** it verifies logged-out protected-page redirects, expired-session behavior, logged-in `/login` redirect behavior, and public/infrastructure exclusions

#### Scenario: Source rule maps to validation
- **WHEN** the protected-route redirect rule is reviewed
- **THEN** the OpenSpec tasks identify `docs/architecture-guide.md`, `docs/testing-strategy.md`, and focused route-policy tests as the validation path

## Source Rule To Validation Mapping

| Rule | Validation |
| --- | --- |
| Protected pages require an active session. | Focused route-policy Vitest coverage plus `npm run typecheck`. |
| Logged-out and expired sessions redirect to `/login`. | Focused route-policy Vitest scenarios for absent session and expired-session-equivalent auth state. |
| `/login` remains public for logged-out users and redirects authenticated users to `/dashboard`. | Focused route-policy Vitest scenarios. |
| Auth API/static infrastructure routes are not page-redirected. | Proxy matcher review plus focused route-policy tests or documented manual review if matcher-level behavior is not unit-testable. |
