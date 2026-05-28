CREATE TYPE "AgentApiKeyPreset" AS ENUM ('read_only', 'balance_writer');

CREATE TYPE "AgentApiKeyStatus" AS ENUM ('active', 'revoked');

CREATE TYPE "AgentAuditStatus" AS ENUM ('preview', 'applied', 'rejected', 'failed', 'idempotent_replay');

CREATE TYPE "AgentRateLimitKind" AS ENUM ('read_hour', 'dry_run_hour', 'apply_day', 'project_day');

CREATE TABLE "AgentApiKey" (
    "id" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "preset" "AgentApiKeyPreset" NOT NULL,
    "status" "AgentApiKeyStatus" NOT NULL DEFAULT 'active',
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "tokenLastFour" TEXT NOT NULL,
    "scopes" TEXT[],
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "userId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentAuditLog" (
    "id" VARCHAR(30) NOT NULL,
    "action" TEXT NOT NULL,
    "status" "AgentAuditStatus" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "monthKey" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "errorCode" TEXT,
    "previewId" TEXT,
    "idempotencyKey" TEXT,
    "requestHash" TEXT,
    "result" JSONB,
    "expiresAt" TIMESTAMP(3),
    "apiKeyId" VARCHAR(30),
    "userId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentRateLimit" (
    "id" VARCHAR(30) NOT NULL,
    "kind" "AgentRateLimitKind" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "apiKeyId" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentApiKey_tokenHash_key" ON "AgentApiKey"("tokenHash");
CREATE INDEX "AgentApiKey_userId_status_idx" ON "AgentApiKey"("userId", "status");
CREATE UNIQUE INDEX "AgentAuditLog_previewId_key" ON "AgentAuditLog"("previewId");
CREATE UNIQUE INDEX "AgentAuditLog_apiKeyId_idempotencyKey_key" ON "AgentAuditLog"("apiKeyId", "idempotencyKey");
CREATE INDEX "AgentAuditLog_userId_createdAt_idx" ON "AgentAuditLog"("userId", "createdAt");
CREATE INDEX "AgentAuditLog_apiKeyId_action_createdAt_idx" ON "AgentAuditLog"("apiKeyId", "action", "createdAt");
CREATE UNIQUE INDEX "AgentRateLimit_kind_windowStart_apiKeyId_key" ON "AgentRateLimit"("kind", "windowStart", "apiKeyId");
CREATE INDEX "AgentRateLimit_kind_windowStart_idx" ON "AgentRateLimit"("kind", "windowStart");

ALTER TABLE "AgentApiKey" ADD CONSTRAINT "AgentApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentAuditLog" ADD CONSTRAINT "AgentAuditLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "AgentApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentAuditLog" ADD CONSTRAINT "AgentAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRateLimit" ADD CONSTRAINT "AgentRateLimit_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "AgentApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
