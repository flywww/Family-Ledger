## 1. Prototype Review

- [x] 1.1 prototype-only reference-only: Review `prototype/index.html` and confirm the MCP setup card placement, step copy, warning copy, and copyable prompt before editing app code.

## 2. UI Implementation

- [x] 2.1 TDD behavior: Agent Access Settings exposes MCP setup instructions and a copyable prompt without removing existing key-management content.
  Public interface: `AgentAccessPanel` rendered UI.
  Test command: `pnpm exec vitest run tests/agent-access-panel.test.ts`.
  Mocking: browser clipboard boundary only.
  Module depth: existing.
  - [x] RED: Add a failing focused UI test or documented manual pre-check proving the MCP instruction and copy prompt are absent before implementation.
  - [x] GREEN: Add the MCP setup section to `components/setting/agent-access-panel.tsx`, write short step-by-step copy, add a copyable plain-text prompt, and keep the existing one-time token copy flow working.
  - [x] REFACTOR: Clean up prompt constants or component structure only after the focused check passes.
  - [x] VALIDATE: Run final checks and record skipped/manual checks.

## 3. Validation

- [x] 3.1 process-only reference-only: Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm run design:check`, `npm run architecture:check`, and `npm run docs:check`; complete visual review at desktop and mobile widths; record validation evidence, skipped checks, and manual-only review results before requesting commit/push or deployment verification.

## Implementation Evidence

- Prototype review: `prototype/index.html` reviewed before app code edits.
- RED: `pnpm exec vitest run tests/agent-access-panel.test.ts` failed because `MCP agent setup` and `AGENT_MCP_PROMPT` were missing.
- GREEN: `pnpm exec vitest run tests/agent-access-panel.test.ts` passed after implementation.
- Final automated checks: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run design:check`, `npm run architecture:check`, `npm run docs:check`, and `npm run test:unit` passed.
- Manual visual review: attempted with local Chrome/Computer Use and macOS screenshot capture. Computer Use timed out and `screencapture` could not create an image in this environment. Fallback evidence is the static prototype review, `AgentAccessPanel` server-render test, and responsive class/code review. Full desktop/mobile browser visual review remains manual-only before deployment/archive.
