## Why

Users can create Agent API keys, but the Agent access page does not explain how to connect an MCP-capable agent to Family Ledger data. This leaves the most important next step after key creation buried in external agent setup knowledge instead of the app workflow.

## What Changes

- Add a simple, step-by-step MCP setup instruction area to the Settings > Agent access page.
- Include a copyable prompt that a user can paste into an external agent to tell it how to access Family Ledger through MCP using the generated Agent API key.
- Keep the instruction copy short, operational, and scoped to trusted personal agents.
- Do not add new Agent API tools, presets, database models, environment variables, or dependencies.
- Visual impact: small addition to an existing settings panel; must preserve the current finance-dashboard style and mobile readability.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `agent-api-access`: Add user-facing MCP setup guidance and a copyable agent prompt to the existing Agent Access Settings experience.

## Impact

- Affected UI: `components/setting/agent-access-panel.tsx`.
- Affected route: `app/(auth)/setting/page.tsx` only if server-provided data or props need minor reshaping.
- Affected docs/specs: `openspec/specs/agent-api-access/spec.md` through this change's delta spec.
- API impact: none expected; uses existing Agent API key and tool route model.
- Dependency impact: none.
- Validation impact: typecheck, lint, build, design check, architecture check, docs check, plus manual containing-workflow review for Settings > Agent access.
