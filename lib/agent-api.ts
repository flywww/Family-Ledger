import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { monthKeyToDate, type MonthKey } from "@/lib/utils";
import { rebuildValueDataForMonth } from "@/lib/monthly-refresh";

export const AGENT_API_PRESETS = {
  read_only: ["holdings:read", "balances:read"],
  balance_writer: ["holdings:read", "balances:read", "balances:write"],
} as const;

export type AgentApiPreset = keyof typeof AGENT_API_PRESETS;
export type AgentToolAction =
  | "list_holdings"
  | "get_holding"
  | "list_balances"
  | "get_balance"
  | "create_balance_dry_run"
  | "create_balance_apply"
  | "update_balance_dry_run"
  | "update_balance_apply";

type Clock = () => Date;
type TokenGenerator = (environmentPrefix: "fl_live" | "fl_test") => string;

const DEFAULT_PREVIEW_TTL_MS = 10 * 60 * 1000;
const READ_ACTIONS = new Set<AgentToolAction>([
  "list_holdings",
  "get_holding",
  "list_balances",
  "get_balance",
]);
const DRY_RUN_ACTIONS = new Set<AgentToolAction>([
  "create_balance_dry_run",
  "update_balance_dry_run",
]);
const APPLY_ACTIONS = new Set<AgentToolAction>([
  "create_balance_apply",
  "update_balance_apply",
]);

export class AgentApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const hashAgentToken = (token: string) =>
  crypto.createHash("sha256").update(token, "utf8").digest("hex");

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

export const hashAgentRequest = (payload: unknown) =>
  crypto.createHash("sha256").update(stableStringify(payload), "utf8").digest("hex");

const defaultTokenGenerator: TokenGenerator = (environmentPrefix) =>
  `${environmentPrefix}_${crypto.randomBytes(24).toString("base64url")}`;

const getTokenPrefix = () => (process.env.NODE_ENV === "production" ? "fl_live" : "fl_test");

const hasWriteScope = (scopes: string[]) => scopes.includes("balances:write");

const assertKnownPreset = (preset: string): asserts preset is AgentApiPreset => {
  if (!(preset in AGENT_API_PRESETS)) {
    throw new AgentApiError("invalid_preset", "Agent API key preset is not supported.", 400);
  }
};

const assertWriteAllowed = (auth: AgentAuthContext, action: AgentToolAction) => {
  if ((DRY_RUN_ACTIONS.has(action) || APPLY_ACTIONS.has(action)) && !hasWriteScope(auth.scopes)) {
    throw new AgentApiError("insufficient_scope", "This key cannot write balances.", 403);
  }
};

export type AgentAuthContext = {
  apiKeyId: string;
  userId: string;
  keyName: string;
  scopes: string[];
};

export async function createAgentApiKey(params: {
  userId: string;
  name: string;
  preset: AgentApiPreset;
  tokenGenerator?: TokenGenerator;
}) {
  const token = (params.tokenGenerator ?? defaultTokenGenerator)(getTokenPrefix());
  const apiKey = await prisma.agentApiKey.create({
    data: {
      userId: params.userId,
      name: params.name.trim() || "Agent key",
      preset: params.preset,
      tokenHash: hashAgentToken(token),
      tokenPrefix: token.split("_").slice(0, 2).join("_"),
      tokenLastFour: token.slice(-4),
      scopes: [...AGENT_API_PRESETS[params.preset]],
    },
  });

  return {
    token,
    apiKey: maskAgentApiKey(apiKey),
  };
}

export async function revokeAgentApiKey(params: { userId: string; apiKeyId: string }) {
  return prisma.agentApiKey.update({
    where: {
      id: params.apiKeyId,
      userId: params.userId,
    },
    data: {
      status: "revoked",
      revokedAt: new Date(),
    },
  });
}

export async function authenticateAgentToken(token: string | null | undefined): Promise<AgentAuthContext> {
  if (!token) {
    throw new AgentApiError("missing_token", "Agent API token is required.", 401);
  }

  const apiKey = await prisma.agentApiKey.findUnique({
    where: {
      tokenHash: hashAgentToken(token),
    },
  });

  if (!apiKey) {
    throw new AgentApiError("invalid_token", "Agent API token is invalid.", 401);
  }

  if (apiKey.status !== "active") {
    await recordAgentAudit({
      action: "authenticate",
      status: "rejected",
      apiKeyId: apiKey.id,
      userId: apiKey.userId,
      errorCode: "revoked_key",
    });
    throw new AgentApiError("revoked_key", "Agent API key has been revoked.", 401);
  }

  await prisma.agentApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    apiKeyId: apiKey.id,
    userId: apiKey.userId,
    keyName: apiKey.name,
    scopes: apiKey.scopes,
  };
}

export function maskAgentApiKey(apiKey: {
  id: string;
  name: string;
  preset: string;
  status: string;
  tokenPrefix: string;
  tokenLastFour: string;
  scopes: string[];
  createdAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    preset: apiKey.preset,
    status: apiKey.status,
    tokenDisplay: `${apiKey.tokenPrefix}_...${apiKey.tokenLastFour}`,
    scopes: apiKey.scopes,
    createdAt: apiKey.createdAt,
    revokedAt: apiKey.revokedAt,
    lastUsedAt: apiKey.lastUsedAt,
  };
}

export async function listAgentApiKeys(userId: string) {
  const keys = await prisma.agentApiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return keys.map(maskAgentApiKey);
}

export async function listRecentAgentActivity(userId: string, take = 8) {
  return prisma.agentAuditLog.findMany({
    where: { userId },
    include: { apiKey: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function recordAgentAudit(params: {
  action: string;
  status: "preview" | "applied" | "rejected" | "failed" | "idempotent_replay";
  userId: string;
  apiKeyId?: string;
  targetType?: string;
  targetId?: string;
  monthKey?: string;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  errorCode?: string;
  previewId?: string;
  idempotencyKey?: string;
  requestHash?: string;
  result?: Prisma.InputJsonValue;
  expiresAt?: Date;
}) {
  return prisma.agentAuditLog.create({
    data: {
      action: params.action,
      status: params.status,
      userId: params.userId,
      apiKeyId: params.apiKeyId,
      targetType: params.targetType,
      targetId: params.targetId,
      monthKey: params.monthKey,
      oldValues: params.oldValues ?? Prisma.JsonNull,
      newValues: params.newValues ?? Prisma.JsonNull,
      errorCode: params.errorCode,
      previewId: params.previewId,
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      result: params.result ?? Prisma.JsonNull,
      expiresAt: params.expiresAt,
    },
  });
}

export async function listHoldingsForAgent(auth: AgentAuthContext) {
  return prisma.holding.findMany({
    where: { userId: auth.userId },
    include: { category: true, type: true },
    orderBy: { id: "asc" },
  });
}

export async function getHoldingForAgent(auth: AgentAuthContext, holdingId: number) {
  const holding = await prisma.holding.findFirst({
    where: { id: holdingId, userId: auth.userId },
    include: { category: true, type: true },
  });
  if (!holding) {
    throw new AgentApiError("not_found", "Holding was not found for this key owner.", 404);
  }
  return holding;
}

const requireMonthKey = (month: string | null | undefined): MonthKey => {
  if (!month) {
    throw new AgentApiError("missing_month", "Agent API balance reads require month=YYYY-MM.", 400);
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new AgentApiError("invalid_month", "Agent API month filters use YYYY-MM, not timestamps.", 400);
  }
  return month as MonthKey;
};

export async function listBalancesForAgent(auth: AgentAuthContext, month: string | null | undefined) {
  const monthKey = requireMonthKey(month);
  return prisma.balance.findMany({
    where: { userId: auth.userId, date: monthKeyToDate(monthKey) },
    include: { holding: { include: { category: true, type: true } } },
    orderBy: { id: "asc" },
  });
}

export async function getBalanceForAgent(
  auth: AgentAuthContext,
  balanceId: number,
  month?: string | null,
) {
  const monthKey = requireMonthKey(month);
  const balance = await prisma.balance.findFirst({
    where: { id: balanceId, userId: auth.userId, date: monthKeyToDate(monthKey) },
    include: { holding: { include: { category: true, type: true } } },
  });
  if (!balance) {
    throw new AgentApiError("not_found", "Balance was not found for this key owner.", 404);
  }
  return balance;
}

const previewId = () => crypto.randomUUID();

type BalanceWritePayload = {
  month: string;
  holdingId?: number;
  balanceId?: number;
  quantity: number;
  price: number;
  value?: number;
  currency: string;
  note?: string;
};

const normalizeBalancePayload = (payload: unknown): BalanceWritePayload => {
  const input = payload as Partial<BalanceWritePayload>;
  if (!input || typeof input !== "object") {
    throw new AgentApiError("invalid_payload", "Balance payload is required.", 400);
  }
  if (typeof input.quantity !== "number" || typeof input.price !== "number") {
    throw new AgentApiError("invalid_payload", "Balance quantity and price must be numbers.", 400);
  }
  if (typeof input.currency !== "string" || !input.currency) {
    throw new AgentApiError("invalid_payload", "Balance currency is required.", 400);
  }
  return {
    month: requireMonthKey(input.month),
    holdingId: input.holdingId,
    balanceId: input.balanceId,
    quantity: input.quantity,
    price: input.price,
    value: input.value ?? input.quantity * input.price,
    currency: input.currency,
    note: input.note ?? "",
  };
};

export async function dryRunBalanceWrite(params: {
  auth: AgentAuthContext;
  action: "create_balance_dry_run" | "update_balance_dry_run";
  payload: unknown;
  clock?: Clock;
}) {
  assertWriteAllowed(params.auth, params.action);
  const now = (params.clock ?? (() => new Date()))();
  const payload = normalizeBalancePayload(params.payload);
  const date = monthKeyToDate(payload.month as MonthKey);

  const holding = payload.holdingId
    ? await getHoldingForAgent(params.auth, payload.holdingId)
    : null;
  const existingBalance = payload.balanceId
    ? await getBalanceForAgent(params.auth, payload.balanceId, payload.month)
    : null;

  if (params.action === "create_balance_dry_run" && !holding) {
    throw new AgentApiError("missing_holding", "Create dry-run requires an existing holdingId.", 400);
  }
  if (params.action === "update_balance_dry_run" && !existingBalance) {
    throw new AgentApiError("missing_balance", "Update dry-run requires an existing balanceId.", 400);
  }

  const proposed = {
    holdingId: holding?.id ?? existingBalance?.holdingId,
    date: date.toISOString(),
    quantity: payload.quantity,
    price: payload.price,
    value: payload.value,
    currency: payload.currency,
    note: payload.note,
  };
  const preview = previewId();
  const expiresAt = new Date(now.getTime() + DEFAULT_PREVIEW_TTL_MS);
  const requestHash = hashAgentRequest({ action: params.action, payload: proposed });
  const audit = await recordAgentAudit({
    action: params.action,
    status: "preview",
    userId: params.auth.userId,
    apiKeyId: params.auth.apiKeyId,
    targetType: "balance",
    targetId: existingBalance ? String(existingBalance.id) : holding ? String(holding.id) : undefined,
    monthKey: payload.month,
    oldValues: existingBalance
      ? {
          balanceId: existingBalance.id,
          quantity: existingBalance.quantity,
          price: existingBalance.price,
          value: existingBalance.value,
          currency: existingBalance.currency,
          note: existingBalance.note ?? "",
        }
      : undefined,
    newValues: proposed,
    previewId: preview,
    requestHash,
    expiresAt,
  });

  return {
    previewId: preview,
    expiresAt,
    action: params.action,
    monthKey: payload.month,
    holding,
    current: existingBalance,
    proposed,
    valueDataImpact: { monthKey: payload.month, rebuild: true },
    confirmationStatus: "preview_created",
    auditId: audit.id,
  };
}

export async function applyBalanceWrite(params: {
  auth: AgentAuthContext;
  action: "create_balance_apply" | "update_balance_apply";
  payload: unknown;
  clock?: Clock;
}) {
  assertWriteAllowed(params.auth, params.action);
  const input = params.payload as { previewId?: string; idempotencyKey?: string };
  if (!input?.previewId) {
    throw new AgentApiError("missing_preview", "Apply requires previewId.", 400);
  }
  if (!input?.idempotencyKey) {
    throw new AgentApiError("missing_idempotency_key", "Apply requires idempotencyKey.", 400);
  }

  const requestHash = hashAgentRequest({
    action: params.action,
    previewId: input.previewId,
    idempotencyKey: input.idempotencyKey,
  });
  const previousApply = await prisma.agentAuditLog.findFirst({
    where: {
      apiKeyId: params.auth.apiKeyId,
      idempotencyKey: input.idempotencyKey,
      action: params.action,
    },
  });
  if (previousApply) {
    if (previousApply.requestHash !== requestHash) {
      throw new AgentApiError("idempotency_conflict", "Idempotency key was reused with different content.", 409);
    }
    return {
      idempotent: true,
      result: previousApply.result,
    };
  }

  const preview = await prisma.agentAuditLog.findUnique({
    where: { previewId: input.previewId },
  });
  if (!preview || preview.apiKeyId !== params.auth.apiKeyId || preview.userId !== params.auth.userId) {
    throw new AgentApiError("preview_mismatch", "Preview does not match this key or user.", 400);
  }

  const expectedPreviewAction = params.action === "create_balance_apply"
    ? "create_balance_dry_run"
    : "update_balance_dry_run";
  if (preview.action !== expectedPreviewAction) {
    throw new AgentApiError("preview_mismatch", "Preview action does not match apply action.", 400);
  }
  const now = (params.clock ?? (() => new Date()))();
  if (!preview.expiresAt || preview.expiresAt.getTime() <= now.getTime()) {
    throw new AgentApiError("preview_expired", "Preview has expired.", 400);
  }

  const proposed = preview.newValues as Prisma.JsonObject;
  const monthKey = preview.monthKey as MonthKey;
  const date = monthKeyToDate(monthKey);
  const holdingId = Number(proposed.holdingId);
  const result = await prisma.$transaction(async (tx) => {
    const balance = params.action === "create_balance_apply"
      ? await tx.balance.create({
          data: {
            userId: params.auth.userId,
            holdingId,
            date,
            quantity: Number(proposed.quantity),
            price: Number(proposed.price),
            value: Number(proposed.value),
            currency: String(proposed.currency),
            note: String(proposed.note ?? ""),
            priceStatus: "success",
          },
        })
      : await tx.balance.update({
          where: { id: Number(preview.targetId) },
          data: {
            quantity: Number(proposed.quantity),
            price: Number(proposed.price),
            value: Number(proposed.value),
            currency: String(proposed.currency),
            note: String(proposed.note ?? ""),
          },
        });
    return balance;
  });

  await rebuildValueDataForMonth(params.auth.userId, date);
  await recordAgentAudit({
    action: params.action,
    status: "applied",
    userId: params.auth.userId,
    apiKeyId: params.auth.apiKeyId,
    targetType: "balance",
    targetId: String(result.id),
    monthKey,
    oldValues: preview.oldValues === null ? undefined : (preview.oldValues as Prisma.InputJsonValue),
    newValues: proposed,
    idempotencyKey: input.idempotencyKey,
    requestHash,
    result: { balanceId: result.id },
  });

  return {
    idempotent: false,
    result,
  };
}

const startOfHour = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));

const startOfDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export async function enforceAgentRateLimit(params: {
  auth: AgentAuthContext;
  action: AgentToolAction;
  clock?: Clock;
}) {
  const now = (params.clock ?? (() => new Date()))();
  const checks = [];
  if (READ_ACTIONS.has(params.action)) {
    checks.push({ kind: "read_hour" as const, limit: 100, windowStart: startOfHour(now), resetAt: addHours(startOfHour(now), 1), apiKeyId: params.auth.apiKeyId });
  }
  if (DRY_RUN_ACTIONS.has(params.action)) {
    checks.push({ kind: "dry_run_hour" as const, limit: 20, windowStart: startOfHour(now), resetAt: addHours(startOfHour(now), 1), apiKeyId: params.auth.apiKeyId });
  }
  if (APPLY_ACTIONS.has(params.action)) {
    checks.push({ kind: "apply_day" as const, limit: 10, windowStart: startOfDay(now), resetAt: addDays(startOfDay(now), 1), apiKeyId: params.auth.apiKeyId });
  }
  checks.push({ kind: "project_day" as const, limit: 500, windowStart: startOfDay(now), resetAt: addDays(startOfDay(now), 1), apiKeyId: null });

  for (const check of checks) {
    const counter = await prisma.agentRateLimit.findFirst({
      where: {
        kind: check.kind,
        windowStart: check.windowStart,
        apiKeyId: check.apiKeyId,
      },
    });
    const nextCount = (counter?.count ?? 0) + 1;
    if (nextCount > check.limit) {
      throw new AgentApiError("rate_limit_exceeded", "Agent API rate limit exceeded.", 429, {
        resetAt: check.resetAt.toISOString(),
      });
    }

    if (counter) {
      await prisma.agentRateLimit.update({
        where: { id: counter.id },
        data: { count: nextCount },
      });
    } else {
      await prisma.agentRateLimit.create({
        data: {
          kind: check.kind,
          windowStart: check.windowStart,
          count: nextCount,
          apiKeyId: check.apiKeyId,
        },
      });
    }
  }
}

export function assertSupportedTool(action: string): asserts action is AgentToolAction {
  const supported = new Set<string>([
    ...READ_ACTIONS,
    ...DRY_RUN_ACTIONS,
    ...APPLY_ACTIONS,
  ]);
  if (!supported.has(action)) {
    throw new AgentApiError("not_supported", "This Agent API tool is not supported in v1.", 404);
  }
}

export function serializeAgentError(error: unknown) {
  if (error instanceof AgentApiError) {
    return {
      status: error.status,
      body: {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...error.details,
        },
      },
    };
  }

  console.error("Unexpected Agent API error", error);
  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: "internal_error",
        message: "Agent API request failed.",
      },
    },
  };
}

export async function rejectUnsupportedTool(action: string, auth?: AgentAuthContext) {
  if (auth) {
    await recordAgentAudit({
      action,
      status: "rejected",
      userId: auth.userId,
      apiKeyId: auth.apiKeyId,
      errorCode: "not_supported",
    });
  }

  throw new AgentApiError("not_supported", "This Agent API tool is not supported in v1.", 404);
}

export async function runAgentTool(
  action: AgentToolAction,
  auth: AgentAuthContext,
  input: Record<string, unknown>,
  options?: {
    now?: Clock;
  },
) {
  await enforceAgentRateLimit({
    auth,
    action,
    clock: options?.now,
  });

  assertWriteAllowed(auth, action);

  switch (action) {
    case "list_holdings":
      return { ok: true, holdings: await listHoldingsForAgent(auth) };
    case "get_holding":
      return { ok: true, holding: await getHoldingForAgent(auth, Number(input.holdingId ?? input.id)) };
    case "list_balances":
      return { ok: true, balances: await listBalancesForAgent(auth, input.month as string | undefined) };
    case "get_balance":
      return {
        ok: true,
        balance: await getBalanceForAgent(
          auth,
          Number(input.balanceId ?? input.id),
          input.month as string | undefined,
        ),
      };
    case "create_balance_dry_run":
    case "update_balance_dry_run":
      return {
        ok: true,
        preview: await dryRunBalanceWrite({
          auth,
          action,
          payload: input,
          clock: options?.now,
        }),
      };
    case "create_balance_apply":
    case "update_balance_apply":
      return {
        ok: true,
        applied: await applyBalanceWrite({
          auth,
          action,
          payload: input,
          clock: options?.now,
        }),
      };
  }
}

export const listAgentActivity = listRecentAgentActivity;
