'use server'

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createAgentApiKey,
  listAgentApiKeys,
  listRecentAgentActivity,
  recordAgentAudit,
  revokeAgentApiKey,
  type AgentApiPreset,
} from "@/lib/agent-api";

const SETTINGS_PATH = "/setting";

function requireUserId() {
  return auth().then((session) => {
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    return session.user.id;
  });
}

function serializeKey(key: Awaited<ReturnType<typeof listAgentApiKeys>>[number]) {
  return {
    ...key,
    createdAt: key.createdAt.toISOString(),
    revokedAt: key.revokedAt?.toISOString() ?? null,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
  };
}

function serializeActivity(activity: Awaited<ReturnType<typeof listRecentAgentActivity>>[number]) {
  return {
    id: activity.id,
    action: activity.action,
    status: activity.status,
    targetType: activity.targetType,
    targetId: activity.targetId,
    monthKey: activity.monthKey,
    errorCode: activity.errorCode,
    keyName: activity.apiKey?.name ?? "Unknown key",
    createdAt: activity.createdAt.toISOString(),
  };
}

async function fetchSerializedActivity(userId: string) {
  const activity = await listRecentAgentActivity(userId);
  return activity.map(serializeActivity);
}

export async function fetchAgentAccessState() {
  const userId = await requireUserId();
  const [keys, activity] = await Promise.all([
    listAgentApiKeys(userId),
    listRecentAgentActivity(userId),
  ]);

  return {
    keys: keys.map(serializeKey),
    activity: activity.map(serializeActivity),
  };
}

export async function createAgentApiKeyAction(input: {
  name: string;
  preset: AgentApiPreset;
}) {
  try {
    const userId = await requireUserId();
    const result = await createAgentApiKey({
      userId,
      name: input.name,
      preset: input.preset,
    });
    const key = serializeKey(result.apiKey);

    await recordAgentAudit({
      userId,
      apiKeyId: result.apiKey.id,
      action: "create_agent_key",
      status: "applied",
      targetType: "agent_api_key",
      targetId: result.apiKey.id,
      result: {
        name: result.apiKey.name,
        preset: result.apiKey.preset,
      },
    });
    const activity = await fetchSerializedActivity(userId);

    revalidatePath(SETTINGS_PATH);

    return {
      ok: true as const,
      token: result.token,
      key,
      activity,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Agent API key could not be created.",
    };
  }
}

export async function revokeAgentApiKeyAction(apiKeyId: string) {
  try {
    const userId = await requireUserId();
    const revoked = await revokeAgentApiKey({
      userId,
      apiKeyId,
    });
    const key = serializeKey({
      ...revoked,
      tokenDisplay: `${revoked.tokenPrefix}_...${revoked.tokenLastFour}`,
    });

    await recordAgentAudit({
      userId,
      apiKeyId: revoked.id,
      action: "revoke_agent_key",
      status: "applied",
      targetType: "agent_api_key",
      targetId: revoked.id,
      result: {
        name: revoked.name,
        preset: revoked.preset,
      },
    });
    const activity = await fetchSerializedActivity(userId);

    revalidatePath(SETTINGS_PATH);

    return {
      ok: true as const,
      key,
      activity,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Agent API key could not be revoked.",
    };
  }
}
