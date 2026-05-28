# MCP Agent Access Instructions Prototype

Status: reference only

Implementation starts after the maintainer reviews this prototype and confirms the Agent access page should use this content structure.

## Files

- `prototype/index.html`: static HTML reference for the Settings > Agent access tab with an added MCP setup card.

## Review Focus

- Confirm the MCP setup card belongs between key creation and the API keys list.
- Confirm the steps are simple enough for a user who just created an Agent API key.
- Confirm the copyable prompt is useful for an MCP-capable agent without implying new backend behavior.
- Confirm the warning about trusted agents and bearer tokens is visible but not noisy.

## Implementation Notes

- Keep the app implementation inside `components/setting/agent-access-panel.tsx`.
- Use existing shadcn card/button/input patterns and Lucide icons.
- Do not add a native MCP server, dependencies, API routes, environment variables, Prisma models, or migrations.
- Preserve the existing one-time token copy behavior.
