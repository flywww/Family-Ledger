import { NextRequest, NextResponse } from "next/server";
import {
  AgentApiError,
  applyBalanceWrite,
  assertSupportedTool,
  authenticateAgentToken,
  dryRunBalanceWrite,
  enforceAgentRateLimit,
  getBalanceForAgent,
  getHoldingForAgent,
  listBalancesForAgent,
  listHoldingsForAgent,
  recordAgentAudit,
  type AgentToolAction,
} from "@/lib/agent-api";

const getBearerToken = (request: NextRequest) => {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
};

const success = (data: unknown) => NextResponse.json({ ok: true, data });

const failure = (error: unknown) => {
  if (error instanceof AgentApiError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...error.details,
        },
      },
      { status: error.status },
    );
  }

  console.error("Agent API unexpected error", error);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "internal_error",
        message: "Agent API request failed.",
      },
    },
    { status: 500 },
  );
};

async function handleRequest(
  request: NextRequest,
  action: AgentToolAction,
  body?: unknown,
) {
  const auth = await authenticateAgentToken(getBearerToken(request));
  await enforceAgentRateLimit({ auth, action });

  try {
    switch (action) {
      case "list_holdings":
        return success(await listHoldingsForAgent(auth));
      case "get_holding":
        return success(await getHoldingForAgent(auth, Number(request.nextUrl.searchParams.get("holdingId"))));
      case "list_balances":
        return success(await listBalancesForAgent(auth, request.nextUrl.searchParams.get("month")));
      case "get_balance":
        return success(
          await getBalanceForAgent(
            auth,
            Number(request.nextUrl.searchParams.get("balanceId")),
            request.nextUrl.searchParams.get("month"),
          ),
        );
      case "create_balance_dry_run":
      case "update_balance_dry_run":
        return success(await dryRunBalanceWrite({ auth, action, payload: body }));
      case "create_balance_apply":
      case "update_balance_apply":
        return success(await applyBalanceWrite({ auth, action, payload: body }));
      default:
        return failure(new AgentApiError("not_supported", "This Agent API tool is not supported in v1.", 404));
    }
  } catch (error) {
    if (error instanceof AgentApiError) {
      await recordAgentAudit({
        action,
        status: "rejected",
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        errorCode: error.code,
      });
    }
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> },
) {
  try {
    const { tool } = await params;
    assertSupportedTool(tool);
    return await handleRequest(request, tool);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> },
) {
  try {
    const { tool } = await params;
    assertSupportedTool(tool);
    return await handleRequest(request, tool, await request.json());
  } catch (error) {
    return failure(error);
  }
}
