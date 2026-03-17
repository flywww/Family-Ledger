import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .reduce((acc, line) => {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

const rootDir = process.cwd();
const env = {
  ...loadEnvFile(path.join(rootDir, ".env")),
  ...loadEnvFile(path.join(rootDir, ".env.local")),
  ...loadEnvFile(path.join(rootDir, ".env.development.local")),
  ...process.env,
};

const baseDatabaseUrl =
  env.POSTGRES_URL_NON_POOLING || env.POSTGRES_PRISMA_URL || env.DATABASE_URL;

if (!baseDatabaseUrl) {
  throw new Error("A Prisma-compatible database URL is required to run tests.");
}

const schemaName = `family_ledger_test_${Date.now()}`;
const databaseUrl = new URL(baseDatabaseUrl);
databaseUrl.searchParams.set("schema", schemaName);

const testEnv = {
  ...env,
  DATABASE_URL: databaseUrl.toString(),
  TEST_DATABASE_URL: databaseUrl.toString(),
  POSTGRES_URL_NON_POOLING: databaseUrl.toString(),
  NODE_ENV: "test",
  CI: "true",
  PRISMA_HIDE_UPDATE_MESSAGE: "1",
};

execFileSync("pnpm", ["exec", "prisma", "db", "push", "--skip-generate"], {
  cwd: rootDir,
  env: testEnv,
  stdio: "inherit",
});

execFileSync("pnpm", ["exec", "vitest", "run"], {
  cwd: rootDir,
  env: testEnv,
  stdio: "inherit",
});
