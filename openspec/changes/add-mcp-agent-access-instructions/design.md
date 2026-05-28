## Context

The Settings > Agent access page already lets an authenticated user create and revoke dedicated Agent API keys, choose fixed presets, copy the one-time token after creation, and review recent agent activity. The existing `agent-api-access` spec also defines tool-style Agent API routes under `/api/agent/tools/*`.

The missing piece is operational guidance. A user who creates a key still needs a simple bridge from Family Ledger to an MCP-capable external agent. This change adds that bridge as instruction copy and a copyable prompt on the existing Agent access page.

## Goals / Non-Goals

**Goals:**

- Add a clear MCP setup section to Settings > Agent access.
- Make the instruction step-by-step and short enough to follow during key creation.
- Provide a copyable prompt that tells a trusted agent what Family Ledger API base URL, auth model, and allowed tool routes to use.
- Keep the UI consistent with the current settings cards and design-system rules.
- Preserve the current API behavior, database model, and key-management behavior.

**Non-Goals:**

- Do not build a native MCP server inside Family Ledger.
- Do not add dependencies, environment variables, Prisma models, migrations, or new API tools.
- Do not expand key scopes beyond the existing `Read only` and `Balance writer` presets.
- Do not provide provider-specific setup for every MCP client. The copy should be generic enough for MCP-capable agents.

## Decisions

### Add instructions inside the existing Agent access panel

The instructions will live in `components/setting/agent-access-panel.tsx` near the key creation/token copy workflow. This keeps the setup guidance next to the credential lifecycle instead of splitting it into a separate docs page.

Alternative considered: add a standalone help document. That would be easier to write but weaker for the user workflow, because the setup guidance is needed at the moment the one-time token is shown.

### Use compact ordered steps plus a copyable prompt

The UI should include:

1. Create an Agent API key.
2. Copy the token immediately.
3. Configure the external MCP-capable agent with the Family Ledger base URL and bearer token.
4. Ask the agent to use the allowed `/api/agent/tools/*` routes for reads or balance-write dry-run/apply flows.

The copyable prompt should be plain text and include placeholders for base URL and token. It must warn the user not to paste the prompt into untrusted agents.

Alternative considered: generate a full JSON MCP config. That is too client-specific and likely to become wrong. A prompt is flexible and matches the user's requested output.

### Keep validation focused on UI and docs drift

This is a user-facing UI/content change, not a data-flow or API behavior change. The implementation should run standard app validation plus design and architecture checks. Manual review must cover the containing Settings workflow because deterministic authenticated Playwright coverage is not established yet.

Automated validation path:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run design:check`
- `npm run architecture:check`
- `npm run docs:check`

Manual validation path:

- Open Settings > Agent access.
- Confirm the page still shows key creation, key list, and recent activity.
- Confirm the MCP instruction section is visible, readable on mobile widths, and does not hide or replace the one-time token copy flow.
- Confirm the copy button writes the full prompt text to the clipboard.

## Risks / Trade-offs

- Prompt wording may imply broader data access than the selected key preset allows. -> Mitigation: phrase the prompt around "allowed by this key's preset" and list supported v1 tools without promising write access for read-only keys.
- Users may paste tokens into untrusted agents. -> Mitigation: include direct warning copy in the instruction section and prompt.
- MCP clients differ in how they accept tools or API configs. -> Mitigation: keep the UI as generic agent instructions instead of client-specific config.
- Additional card content can make the settings page feel crowded. -> Mitigation: use compact copy, existing card primitives, ordered steps, and a single copy action.

## Visual Review

Visual impact: small.

Reference prototype: `prototype/index.html`.

Target UI tree:

```text
Settings
└── Agent access tab
    ├── Agent access card
    │   ├── create key form
    │   ├── one-time token alert, when a key is created
    │   └── preset summary
    ├── MCP setup card
    │   ├── short title and warning
    │   ├── ordered setup steps
    │   └── copy prompt button
    ├── API keys card
    └── Recent activity card
```

## Visual Validation Plan

Manual visual checks:

- Desktop and mobile widths keep the Agent access tab as one readable vertical flow.
- The MCP setup card does not nest cards inside cards.
- The copy prompt action uses an icon button or icon+text button with accessible text.
- The instruction copy stays short and does not become a documentation wall inside the app.
