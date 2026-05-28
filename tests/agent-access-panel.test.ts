import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/agent-api-actions", () => ({
  createAgentApiKeyAction: vi.fn(),
  revokeAgentApiKeyAction: vi.fn(),
}));

vi.mock("@/lib/agent-api-actions", () => ({
  createAgentApiKeyAction: vi.fn(),
  revokeAgentApiKeyAction: vi.fn(),
}));

import AgentAccessPanel, { buildAgentMcpPrompt } from "../components/setting/agent-access-panel";

describe("AgentAccessPanel MCP setup guidance", () => {
  it("renders MCP setup instructions without replacing key-management content", () => {
    const html = renderToStaticMarkup(
      createElement(AgentAccessPanel, {
        initialKeys: [],
        initialActivity: [],
      }),
    );

    expect(html).toContain("MCP agent setup");
    expect(html).toContain("Create an Agent API key");
    expect(html).toContain("Copy prompt for agent");
    expect(html).toContain("Create key");
    expect(html).toContain("API keys");
    expect(html).toContain("Recent activity");
  });

  it("provides a prompt with endpoint, token, preset, and trusted-agent boundaries", () => {
    const prompt = buildAgentMcpPrompt({
      baseUrl: "https://family-ledger.vercel.app",
      token: "fl_agent_live_test_token",
    });

    expect(prompt).toContain("Base URL: https://family-ledger.vercel.app");
    expect(prompt).toContain("Authorization: Bearer fl_agent_live_test_token");
    expect(prompt).toContain("/api/agent/tools/*");
    expect(prompt).toContain("Read only");
    expect(prompt).toContain("Balance writer");
    expect(prompt).toContain("trusted");
  });
});
