# Family Ledger Architecture Guide

## Purpose

This is the source of truth for Family Ledger architecture rules, module boundaries, and runtime flows. Use it when changing routing, server actions, data access, authentication, refresh workflows, imports, or shared abstractions.

## System Overview

Family Ledger is a monolithic Next.js application using:

- Next.js App Router for pages and API routes.
- React Server Components for server-rendered route composition.
- Client components for interactive forms, tables, filters, and navigation.
- NextAuth for credentials-based authentication.
- Prisma with PostgreSQL for persistence.
- Server actions in `lib/actions.ts` as the current application service layer.
- `lib/monthly-refresh.ts` as the dedicated monthly refresh workflow engine.
- External quote and FX providers through `lib/pricing.ts` and `lib/fx.ts`.

```mermaid
flowchart TB
    Browser["Browser UI"]

    subgraph NextApp["Next.js Application"]
        Pages["App Router Pages<br/>app/*"]
        Components["UI Components<br/>components/*"]
        Actions["Server Actions<br/>lib/actions.ts"]
        Refresh["Monthly Refresh Engine<br/>lib/monthly-refresh.ts"]
        Utils["Shared Utilities<br/>lib/utils.ts, lib/balance-analysis.ts"]
        Integrations["Integrations<br/>lib/pricing.ts, lib/fx.ts"]
        Auth["Auth<br/>auth.ts, proxy.ts"]
        Api["API Routes<br/>app/api/*"]
    end

    DB["PostgreSQL via Prisma"]
    QuoteAPIs["Quote Providers"]
    FXAPI["Currency API"]
    Cron["Vercel Cron"]

    Browser --> Pages
    Pages --> Components
    Pages --> Actions
    Components --> Actions
    Api --> Refresh
    Api --> Actions
    Actions --> Refresh
    Actions --> Utils
    Actions --> DB
    Refresh --> DB
    Refresh --> Integrations
    Integrations --> QuoteAPIs
    Integrations --> FXAPI
    Cron --> Api
```

## Layer Responsibilities

### Presentation layer

Location: `app/*`, `components/*`

Responsibilities:

- Render route pages and UI components.
- Assemble server-loaded data into visible screens.
- Hold client-only interaction state where needed.
- Call server actions or API routes for mutations and server workflows.

Rules:

- UI must not import Prisma directly.
- Client components must not import server-only modules such as Prisma, quote providers, FX provider internals, API route internals, filesystem APIs, or auth internals.
- Components should prefer typed props and shared UI primitives over direct data-layer coupling.

### Application service layer

Location: currently `lib/actions.ts`

Responsibilities:

- Authenticated reads and mutations.
- Server action entrypoints for UI workflows.
- Revalidation and redirect behavior.
- Coordination with monthly refresh and value-data services.

Current constraint:

- `lib/actions.ts` is broad and should be split over time by business capability, not HTTP verb.

Target direction:

- `lib/balance/queries.ts`
- `lib/balance/commands.ts`
- `lib/dashboard/queries.ts`
- `lib/settings/queries.ts`
- `lib/settings/commands.ts`
- `lib/value-data/service.ts`

### Domain workflow layer

Location: `lib/monthly-refresh.ts`, `lib/balance-analysis.ts`

Responsibilities:

- Monthly refresh job lifecycle.
- Quote deduplication and provider batching.
- Retry and failure state.
- Balance analysis view filtering and percentages.

Rules:

- Keep the monthly refresh engine server-only.
- Do not move provider-specific rate limits or batch logic into UI components.
- Keep workflow state explicit in database-backed job/snapshot/log models.

### Integration layer

Location: `lib/pricing.ts`, `lib/fx.ts`, `auth.ts`

Responsibilities:

- External quote provider adapters.
- Currency conversion and rate caching.
- Credentials auth integration.

Rules:

- Provider secrets and provider calls stay server-side.
- Client UI should receive computed values or call narrow server actions.

### Persistence layer

Location: `prisma/schema.prisma`, `prisma/migrations/*`, `lib/prisma.ts`

Responsibilities:

- Database schema.
- Prisma client.
- Migrations and seed behavior.

Rules:

- Database safety rules are owned by `docs/data-model-guide.md` and `docs/testing-strategy.md`.
- Data semantics belong in `docs/data-model-guide.md`.

## Key Runtime Flows

### Balance page

```mermaid
flowchart TD
    A["Request /balance?month=YYYY-MM"] --> B["resolveMonthKey()"]
    B --> C["app/(auth)/balance/page.tsx"]
    C --> D["fetchMonthlyBalance()"]
    D --> E["Prisma loads balances"]
    C --> F["fetchMonthlyRefreshState()"]
    C --> G["getConvertedCurrency()"]
    C --> H["applyBalanceAnalysisView()"]
    H --> I["Balance table and toolbar"]
```

Architecture note:

- The Balance page currently performs significant view-model assembly in the route file. Future refactors should extract read-model builders before adding more page-level shaping.

### Dashboard page

```mermaid
flowchart TD
    A["Request /dashboard?month=YYYY-MM"] --> B["resolveMonthKey()"]
    B --> C["fetchValueData()"]
    C --> D["Filter selected categories"]
    D --> E["Convert display currency"]
    E --> F["SummarySection + ChartSection"]
```

Architecture note:

- Dashboard reads should prefer `ValueData` instead of rebuilding chart totals from raw balances on every request.

### Monthly refresh

```mermaid
flowchart TD
    A["Vercel Cron or manual trigger"] --> B["Authorize CRON_SECRET"]
    B --> C["autoCreateMonthlyRefreshJobs()"]
    C --> D["Copy previous month balances"]
    D --> E["Create job and snapshots"]
    E --> F["processMonthlyRefreshBatch()"]
    F --> G["Fetch provider quotes"]
    G --> H["Update balances and snapshots"]
    H --> I["Rebuild ValueData"]
    I --> J["Write CronRunLog"]
```

Rules:

- Cron route tests should exercise authorization and structured result behavior.
- Test harnesses for cron should use isolated test data or test-tagged rows.
- The real cron path should remain the source of truth for refresh behavior.

## Dependency And Abstraction Rules

- New dependencies require justification in the proposal or design.
- Shared abstractions require proven reuse or a clear local pattern.
- Avoid adding framework layers around small workflows until duplication or risk justifies them.
- Prefer custom scripts for small local boundary checks; adopt dependency-cruiser when import rules become broad enough to need graph tooling.

## Validation

Architecture rules are validated by:

- `npm run architecture:check`
- `npm run typecheck`
- `npm run lint`
- focused Vitest tests for changed behavior
- manual review for dependency and abstraction decisions

Any durable architecture rule added here must also be mapped in `docs/validation-harness.md`.
