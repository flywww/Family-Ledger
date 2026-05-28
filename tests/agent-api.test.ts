import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import prisma from "../lib/prisma";
import {
  AgentApiError,
  applyBalanceWrite,
  authenticateAgentToken,
  createAgentApiKey,
  dryRunBalanceWrite,
  enforceAgentRateLimit,
  hashAgentToken,
  listBalancesForAgent,
  getBalanceForAgent,
  listHoldingsForAgent,
  listRecentAgentActivity,
  recordAgentAudit,
  revokeAgentApiKey,
} from "../lib/agent-api";
import { GET } from "../app/api/agent/tools/[tool]/route";
import { monthKeyToDate } from "../lib/utils";

const TEST_SCHEMA_PREFIX = "family_ledger_test_";

function assertIsolatedTestDatabase() {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Refusing to run database-backed tests without DATABASE_URL.");
  }
  const schemaName = new URL(databaseUrl).searchParams.get("schema");
  if (!schemaName?.startsWith(TEST_SCHEMA_PREFIX)) {
    throw new Error(`Refusing to reset database outside ${TEST_SCHEMA_PREFIX}.`);
  }
}

async function resetDatabase() {
  assertIsolatedTestDatabase();
  await prisma.agentRateLimit.deleteMany();
  await prisma.agentAuditLog.deleteMany();
  await prisma.agentApiKey.deleteMany();
  await prisma.cronRunLog.deleteMany();
  await prisma.assetPriceSnapshot.deleteMany();
  await prisma.monthlyRefreshJob.deleteMany();
  await prisma.valueData.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.category.deleteMany();
  await prisma.type.deleteMany();
  await prisma.user.deleteMany();
}

async function seedLedger() {
  const user = await prisma.user.create({
    data: { account: "agent-user", password: "password" },
  });
  const otherUser = await prisma.user.create({
    data: { account: "other-user", password: "password" },
  });
  const type = await prisma.type.create({ data: { name: "Assets" } });
  const category = await prisma.category.create({ data: { name: "Cash" } });
  const holding = await prisma.holding.create({
    data: {
      name: "Cash",
      symbol: "CASH",
      typeId: type.id,
      categoryId: category.id,
      userId: user.id,
    },
  });
  const otherHolding = await prisma.holding.create({
    data: {
      name: "Other Cash",
      symbol: "OCASH",
      typeId: type.id,
      categoryId: category.id,
      userId: otherUser.id,
    },
  });
  const balance = await prisma.balance.create({
    data: {
      userId: user.id,
      holdingId: holding.id,
      date: monthKeyToDate("2026-05"),
      quantity: 10,
      price: 2,
      value: 20,
      currency: "USD",
      note: "seed",
    },
  });
  await prisma.balance.create({
    data: {
      userId: otherUser.id,
      holdingId: otherHolding.id,
      date: monthKeyToDate("2026-05"),
      quantity: 99,
      price: 1,
      value: 99,
      currency: "USD",
      note: "other",
    },
  });

  return { user, otherUser, type, category, holding, balance };
}

beforeEach(async () => {
  await resetDatabase();
});

describe("Agent API key persistence and authentication", () => {
  it("stores only a hash and masked token metadata while returning the token once", async () => {
    const { user } = await seedLedger();
    const result = await createAgentApiKey({
      userId: user.id,
      name: "Test agent",
      preset: "balance_writer",
      tokenGenerator: () => "fl_test_fixedtoken1234",
    });

    expect(result.token).toBe("fl_test_fixedtoken1234");
    expect(result.apiKey.tokenDisplay).toBe("fl_test_...1234");

    const stored = await prisma.agentApiKey.findUniqueOrThrow({
      where: { id: result.apiKey.id },
    });
    expect(stored.tokenHash).toBe(hashAgentToken("fl_test_fixedtoken1234"));
    expect(JSON.stringify(stored)).not.toContain("fixedtoken1234");
    expect(stored.scopes).toEqual(["holdings:read", "balances:read", "balances:write"]);
  });

  it("authenticates valid keys, rejects revoked keys, and enforces fixed presets", async () => {
    const { user } = await seedLedger();
    const readOnly = await createAgentApiKey({
      userId: user.id,
      name: "Read",
      preset: "read_only",
      tokenGenerator: () => "fl_test_read1234",
    });
    const writer = await createAgentApiKey({
      userId: user.id,
      name: "Writer",
      preset: "balance_writer",
      tokenGenerator: () => "fl_test_write1234",
    });

    const readAuth = await authenticateAgentToken(readOnly.token);
    const writerAuth = await authenticateAgentToken(writer.token);
    expect(readAuth.scopes).toEqual(["holdings:read", "balances:read"]);
    expect(writerAuth.scopes).toContain("balances:write");

    await expect(
      dryRunBalanceWrite({
        auth: readAuth,
        action: "create_balance_dry_run",
        payload: { month: "2026-05", holdingId: 1, quantity: 1, price: 1, currency: "USD" },
      }),
    ).rejects.toMatchObject({ code: "insufficient_scope" });

    await revokeAgentApiKey({ userId: user.id, apiKeyId: writer.apiKey.id });
    await expect(authenticateAgentToken(writer.token)).rejects.toMatchObject({ code: "revoked_key" });
  });
});

describe("Agent API reads, writes, audits, and limits", () => {
  it("returns owner-scoped holdings and month-key balances", async () => {
    const { user, balance } = await seedLedger();
    const key = await createAgentApiKey({
      userId: user.id,
      name: "Read",
      preset: "read_only",
      tokenGenerator: () => "fl_test_readscope",
    });
    const auth = await authenticateAgentToken(key.token);

    const holdings = await listHoldingsForAgent(auth);
    const balances = await listBalancesForAgent(auth, "2026-05");

    expect(holdings).toHaveLength(1);
    expect(holdings[0].name).toBe("Cash");
    expect(balances).toHaveLength(1);
    expect(balances[0].value).toBe(20);
    await expect(getBalanceForAgent(auth, balance.id, undefined)).rejects.toMatchObject({
      code: "missing_month",
    });
    await expect(getBalanceForAgent(auth, balance.id, "2026-05")).resolves.toMatchObject({
      id: balance.id,
      value: 20,
    });
    await expect(listBalancesForAgent(auth, undefined)).rejects.toMatchObject({ code: "missing_month" });
    await expect(listBalancesForAgent(auth, "2026-05-01T00:00:00Z")).rejects.toMatchObject({
      code: "invalid_month",
    });
  });

  it("creates dry-run previews without mutating balances or value data, then applies once with idempotency", async () => {
    const { user, holding } = await seedLedger();
    const key = await createAgentApiKey({
      userId: user.id,
      name: "Writer",
      preset: "balance_writer",
      tokenGenerator: () => "fl_test_applyscope",
    });
    const auth = await authenticateAgentToken(key.token);

    const preview = await dryRunBalanceWrite({
      auth,
      action: "create_balance_dry_run",
      clock: () => new Date("2026-05-01T00:00:00Z"),
      payload: {
        month: "2026-06",
        holdingId: holding.id,
        quantity: 3,
        price: 4,
        currency: "USD",
      },
    });

    expect(preview.previewId).toBeTypeOf("string");
    expect(preview.expiresAt.toISOString()).toBe("2026-05-01T00:10:00.000Z");
    await expect(
      prisma.balance.findMany({ where: { userId: user.id, date: monthKeyToDate("2026-06") } }),
    ).resolves.toHaveLength(0);
    await expect(prisma.valueData.findMany({ where: { userId: user.id } })).resolves.toHaveLength(0);

    const applied = await applyBalanceWrite({
      auth,
      action: "create_balance_apply",
      clock: () => new Date("2026-05-01T00:05:00Z"),
      payload: { previewId: preview.previewId, idempotencyKey: "retry-1" },
    });
    expect(applied.idempotent).toBe(false);

    const replay = await applyBalanceWrite({
      auth,
      action: "create_balance_apply",
      clock: () => new Date("2026-05-01T00:06:00Z"),
      payload: { previewId: preview.previewId, idempotencyKey: "retry-1" },
    });
    expect(replay.idempotent).toBe(true);

    const balances = await prisma.balance.findMany({
      where: { userId: user.id, date: monthKeyToDate("2026-06") },
    });
    const valueData = await prisma.valueData.findMany({
      where: { userId: user.id, date: monthKeyToDate("2026-06") },
    });
    expect(balances).toHaveLength(1);
    expect(balances[0].value).toBe(12);
    expect(valueData).toHaveLength(1);
    await expect(
      applyBalanceWrite({
        auth,
        action: "create_balance_apply",
        clock: () => new Date("2026-05-01T00:06:00Z"),
        payload: { previewId: "different", idempotencyKey: "retry-1" },
      }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" });
  });

  it("rejects expired previews and missing holdings", async () => {
    const { user, holding } = await seedLedger();
    const key = await createAgentApiKey({
      userId: user.id,
      name: "Writer",
      preset: "balance_writer",
      tokenGenerator: () => "fl_test_expired",
    });
    const auth = await authenticateAgentToken(key.token);

    await expect(
      dryRunBalanceWrite({
        auth,
        action: "create_balance_dry_run",
        payload: { month: "2026-06", holdingId: holding.id + 1000, quantity: 1, price: 1, currency: "USD" },
      }),
    ).rejects.toMatchObject({ code: "not_found" });

    const preview = await dryRunBalanceWrite({
      auth,
      action: "create_balance_dry_run",
      clock: () => new Date("2026-05-01T00:00:00Z"),
      payload: { month: "2026-06", holdingId: holding.id, quantity: 1, price: 1, currency: "USD" },
    });

    await expect(
      applyBalanceWrite({
        auth,
        action: "create_balance_apply",
        clock: () => new Date("2026-05-01T00:11:00Z"),
        payload: { previewId: preview.previewId, idempotencyKey: "expired-1" },
      }),
    ).rejects.toMatchObject({ code: "preview_expired" });
  });

  it("enforces per-key and project limits and rejects unsupported tool routes", async () => {
    const { user } = await seedLedger();
    const key = await createAgentApiKey({
      userId: user.id,
      name: "Read",
      preset: "read_only",
      tokenGenerator: () => "fl_test_limits",
    });
    const auth = await authenticateAgentToken(key.token);

    await prisma.agentRateLimit.create({
      data: {
        kind: "read_hour",
        apiKeyId: auth.apiKeyId,
        windowStart: new Date("2026-05-01T01:00:00.000Z"),
        count: 100,
      },
    });
    await expect(
      enforceAgentRateLimit({
        auth,
        action: "list_holdings",
        clock: () => new Date("2026-05-01T01:45:00Z"),
      }),
    ).rejects.toMatchObject({ code: "rate_limit_exceeded" });

    await prisma.agentRateLimit.deleteMany();
    await prisma.agentRateLimit.create({
      data: {
        kind: "project_day",
        windowStart: new Date("2026-05-01T00:00:00.000Z"),
        count: 500,
      },
    });
    await expect(
      enforceAgentRateLimit({
        auth,
        action: "list_holdings",
        clock: () => new Date("2026-05-01T01:45:00Z"),
      }),
    ).rejects.toMatchObject({
      code: "rate_limit_exceeded",
      details: { resetAt: "2026-05-02T00:00:00.000Z" },
    });

    const response = await GET(
      new NextRequest("https://example.com/api/agent/tools/delete_balance", {
        headers: { authorization: `Bearer ${key.token}` },
      }),
      { params: Promise.resolve({ tool: "delete_balance" }) },
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "not_supported" },
    });
  });

  it("stores structured audit records and recent activity without raw payload recovery", async () => {
    const { user } = await seedLedger();
    const key = await createAgentApiKey({
      userId: user.id,
      name: "Auditor",
      preset: "read_only",
      tokenGenerator: () => "fl_test_audits",
    });
    const auth = await authenticateAgentToken(key.token);
    await recordAgentAudit({
      userId: auth.userId,
      apiKeyId: auth.apiKeyId,
      action: "list_holdings",
      status: "applied",
      targetType: "holding",
      result: { count: 1 },
    });

    const activity = await listRecentAgentActivity(user.id);
    expect(activity).toHaveLength(1);
    expect(activity[0].apiKey?.name).toBe("Auditor");
    expect(activity[0].result).toEqual({ count: 1 });
  });
});
