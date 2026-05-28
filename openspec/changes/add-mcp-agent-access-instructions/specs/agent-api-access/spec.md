## ADDED Requirements

### Requirement: MCP setup instructions
The system SHALL provide simple MCP setup instructions inside the Agent Access Settings experience without requiring new Agent API tools or database changes.

#### Scenario: Step-by-step instructions are shown
- **WHEN** an authenticated user opens Settings and selects Agent Access
- **THEN** the UI shows a concise step-by-step instruction area for connecting a trusted MCP-capable agent to Family Ledger data

#### Scenario: Instructions stay near key setup
- **WHEN** the user creates or reviews Agent API keys
- **THEN** the MCP setup instructions are presented in the same Agent Access Settings experience without replacing key creation, key revocation, one-time token display, or recent activity

#### Scenario: Instructions describe existing access boundaries
- **WHEN** the user reads the MCP setup instructions
- **THEN** the instructions explain that access is limited by the selected Agent API key preset and the existing `/api/agent/tools/*` routes

### Requirement: Copyable agent prompt
The system SHALL provide a copyable prompt that helps the user configure or instruct a trusted external agent to access Family Ledger through the existing Agent API.

#### Scenario: Prompt can be copied
- **WHEN** an authenticated user clicks the copy action for the agent prompt
- **THEN** the UI copies a plain-text prompt suitable for pasting into an MCP-capable agent

#### Scenario: Prompt includes required setup details
- **WHEN** the user reviews the copyable prompt
- **THEN** the prompt includes placeholders or text for the Family Ledger base URL, bearer token, selected key preset boundaries, and supported v1 tool-style routes

#### Scenario: Prompt warns about trusted-agent use
- **WHEN** the user reviews or copies the prompt
- **THEN** the prompt warns the user to paste the token only into a trusted agent environment

### Requirement: MCP instruction validation mapping
The system SHALL map the MCP instruction UI rules to automated and manual validation before implementation is considered complete.

#### Scenario: Standard app validation
- **WHEN** the MCP instruction UI implementation is ready for handoff
- **THEN** validation evidence includes `npm run typecheck`, `npm run lint`, `npm run build`, `npm run design:check`, `npm run architecture:check`, and `npm run docs:check`

#### Scenario: Containing workflow review
- **WHEN** the MCP instruction UI implementation is reviewed
- **THEN** manual review confirms Settings > Agent access still shows key creation, key list, one-time token copy, revocation, recent activity, and the new MCP instructions without layout overlap on desktop or mobile widths
