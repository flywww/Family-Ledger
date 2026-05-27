import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = process.cwd();

const envFiles = [".env", ".env.local", ".env.development.local"];
const runtimeEnvKeys = [
  "DATABASE_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
  "CRON_SECRET",
  "APP_TIME_ZONE",
  "CMC_API_KEY",
  "FMP_STOCK_API_KEY",
  "CURRENCYAPI_API_KEY",
  "MONTHLY_REFRESH_DAILY_LIMIT",
];

const validationScripts = [
  "typecheck",
  "lint",
  "build",
  "design:check",
  "architecture:check",
  "docs:check",
  "harness:check",
  "test:unit",
  "test",
];

function command(args, options = {}) {
  try {
    return execFileSync(args[0], args.slice(1), {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();
    return stderr || stdout || "unavailable";
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function collectEnvKeys() {
  const keys = new Map();

  for (const [key, value] of Object.entries(process.env)) {
    if (value) {
      keys.set(key, "process");
    }
  }

  for (const file of envFiles) {
    const absolute = path.join(root, file);
    if (!existsSync(absolute)) {
      continue;
    }

    for (const rawLine of readFileSync(absolute, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }

      const key = line.slice(0, line.indexOf("=")).trim();
      if (key && !keys.has(key)) {
        keys.set(key, file);
      }
    }
  }

  return keys;
}

function hasGeneratedPrismaClient() {
  if (existsSync(path.join(root, "node_modules/.prisma/client"))) {
    return true;
  }

  const pnpmStore = path.join(root, "node_modules/.pnpm");
  if (!existsSync(pnpmStore)) {
    return false;
  }

  return readdirSync(pnpmStore).some((entry) =>
    existsSync(path.join(pnpmStore, entry, "node_modules/.prisma/client")),
  );
}

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const done = (status) => {
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(500);
    socket.once("connect", () => done("in use"));
    socket.once("timeout", () => done("available"));
    socket.once("error", () => done("available"));
  });
}

function printSection(title, rows) {
  console.log(`\n## ${title}`);
  for (const row of rows) {
    console.log(`- ${row}`);
  }
}

const packageJson = readJson("package.json");
const envKeys = collectEnvKeys();
const gitStatus = command(["git", "status", "--short"]);
const openspecList = command(["openspec", "list", "--json"]);
let activeChanges = "unavailable";

try {
  const parsed = JSON.parse(openspecList || "{}");
  activeChanges = Array.isArray(parsed.changes)
    ? parsed.changes.map((change) => `${change.name} (${change.status}, ${change.completedTasks}/${change.totalTasks})`).join(", ") || "none"
    : "unavailable";
} catch {
  activeChanges = "unavailable";
}

const dbUrlKeys = ["TEST_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL"];
const hasBaseDbUrl = dbUrlKeys.some((key) => envKeys.has(key));
const isolatedSchemaHint = dbUrlKeys.some((key) => {
  const value = process.env[key] ?? "";
  return value.includes("schema=family_ledger_test_");
});

const port3000 = await checkPort(3000);
const port3001 = await checkPort(3001);

console.log("# Family Ledger Environment Health");
console.log("Read-only diagnostic. Environment values are never printed.");

printSection("Tool Versions", [
  `node: ${command(["node", "--version"])}`,
  `npm: ${command(["npm", "--version"])}`,
  `pnpm: ${command(["pnpm", "--version"])}`,
  `openspec: ${command(["openspec", "--version"])}`,
]);

printSection("Dependency Install", [
  `node_modules: ${existsSync(path.join(root, "node_modules")) ? "present" : "missing"}`,
  `pnpm lockfile: ${existsSync(path.join(root, "pnpm-lock.yaml")) ? "present" : "missing"}`,
  `package manager expectation: use pnpm for installs and dev server`,
]);

printSection("Prisma Client", [
  `@prisma/client package: ${existsSync(path.join(root, "node_modules/@prisma/client")) ? "present" : "missing"}`,
  `.prisma generated client: ${hasGeneratedPrismaClient() ? "present" : "missing"}`,
  `schema file: ${existsSync(path.join(root, "prisma/schema.prisma")) ? "present" : "missing"}`,
]);

printSection(
  "Environment Keys",
  runtimeEnvKeys.map((key) => `${key}: ${envKeys.has(key) ? `present (${envKeys.get(key)})` : "missing"}`),
);

printSection("Database Test Readiness", [
  `base Prisma database URL key present: ${hasBaseDbUrl ? "yes" : "no"}`,
  `current process already points at isolated family_ledger_test_ schema: ${isolatedSchemaHint ? "yes" : "no"}`,
  `DB-backed tests: use npm run test only; it creates an isolated schema when a compatible base URL is present`,
]);

printSection("Dev Server Ports", [
  `127.0.0.1:3000: ${port3000}`,
  `127.0.0.1:3001: ${port3001}`,
]);

printSection("OpenSpec", [
  `active changes: ${activeChanges}`,
]);

printSection("Git Working Tree", [
  gitStatus ? `dirty entries:\n${gitStatus}` : "clean",
]);

printSection(
  "Validation Scripts",
  validationScripts.map((script) => `${script}: ${packageJson.scripts?.[script] ? "available" : "missing"}`),
);
