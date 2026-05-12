## ADDED Requirements

### Requirement: Production functions run near the database
The system SHALL run production Vercel Functions in the Singapore region when the primary Neon database is hosted in AWS Asia Pacific Singapore.

#### Scenario: Production deployment uses Singapore function region
- **WHEN** the production deployment configuration is reviewed
- **THEN** the configured Vercel Function region is `sin1`

#### Scenario: Deployment metadata confirms runtime region
- **WHEN** the production deployment is verified after release
- **THEN** Vercel deployment metadata shows the function region as `sin1`

### Requirement: Runtime database traffic uses Neon pooling
The system SHALL use a Neon pooled connection string for production application runtime traffic.

#### Scenario: Production runtime uses pooled hostname
- **WHEN** the production `DATABASE_URL` value is reviewed in Vercel project settings
- **THEN** its database hostname includes the Neon `-pooler` endpoint

#### Scenario: Application build still generates Prisma client
- **WHEN** the production build command runs
- **THEN** Prisma client generation and Next.js build complete without requiring a direct runtime hostname

### Requirement: Direct database connection remains available for administrative workflows
The system SHALL preserve a direct Neon connection path for Prisma CLI, migrations, and administrative database workflows.

#### Scenario: Direct connection variable is documented
- **WHEN** database environment variables are reviewed
- **THEN** the direct connection variable and its intended use are documented for Prisma administrative workflows

#### Scenario: Runtime and administrative URLs are not confused
- **WHEN** implementation tasks are reviewed
- **THEN** application runtime traffic uses the pooled URL and administrative workflows use the direct URL

### Requirement: Critical database failures are visible
The system SHALL NOT silently render authenticated financial pages with partial or fallback data when critical Prisma database access fails.

#### Scenario: Balance page critical data fails
- **WHEN** a critical database query for `/balance` fails because Prisma cannot reach the database
- **THEN** the page path surfaces a visible failure state or throws to a server error boundary instead of treating missing data as successful empty data

#### Scenario: Dashboard page critical data fails
- **WHEN** a critical database query for `/dashboard` fails because Prisma cannot reach the database
- **THEN** the page path surfaces a visible failure state or throws to a server error boundary instead of treating missing data as successful empty data

#### Scenario: Settings read fails during page composition
- **WHEN** a settings read needed to determine display currency or categories fails
- **THEN** the failure is logged server-side and surfaced through the page error path rather than silently falling back to misleading defaults

### Requirement: Connectivity fix has validation coverage
The system SHALL map production database connectivity rules to automated checks or explicit manual release review.

#### Scenario: Static validation covers region configuration
- **WHEN** focused validation for this change runs
- **THEN** it verifies that the repository configuration sets Vercel Functions to `sin1`

#### Scenario: Release checklist covers production-only settings
- **WHEN** the change is prepared for deployment
- **THEN** tasks include manual review of Vercel production environment variables and post-deploy Vercel deployment metadata

#### Scenario: Failure behavior is validated
- **WHEN** implementation validation runs
- **THEN** focused tests or documented manual review cover the behavior for critical Prisma connectivity failures on `/balance` and `/dashboard`

## Source Rule To Validation Mapping

| Rule | Validation |
| --- | --- |
| Production Vercel Functions run in `sin1` while Neon is in Singapore. | Static config check or `docs:check` extension plus post-deploy Vercel metadata review. |
| Production runtime `DATABASE_URL` uses Neon pooling. | Manual Vercel environment review because secret values are not stored in git. |
| Direct Neon connection remains available for admin workflows. | Documentation/task review plus successful Prisma client generation/build. |
| Critical DB failures are not silently swallowed on finance pages. | Focused tests for changed error handling or documented manual failure-path review. |
