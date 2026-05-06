import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components"].filter((dir) => existsSync(path.join(root, dir)));
const violations = [];

const serverOnlyImports = [
  {
    pattern: /['"](?:@\/lib\/prisma|(?:\.\.\/)+lib\/prisma|@prisma\/client)['"]/,
    rule: "no-ui-prisma-import",
    why: "UI code should go through server actions, route handlers, or read-model helpers instead of importing Prisma directly.",
    fix: "Move the database access behind a server-side module and pass typed data into the UI.",
  },
  {
    pattern: /['"](?:@\/lib\/monthly-refresh|(?:\.\.\/)+lib\/monthly-refresh)['"]/,
    rule: "no-client-monthly-refresh-engine",
    why: "The monthly refresh engine owns database writes, rate limits, and provider calls, so it must stay server-side.",
    fix: "Expose a narrow server action or API route for the client workflow.",
  },
  {
    pattern: /['"](?:@\/lib\/fx|(?:\.\.\/)+lib\/fx|@\/lib\/pricing|(?:\.\.\/)+lib\/pricing)['"]/,
    rule: "no-client-provider-import",
    why: "FX and pricing modules may use secrets, network providers, and server caches.",
    fix: "Compute values server-side or call an explicit server action.",
  },
  {
    pattern: /['"](?:@\/auth|(?:\.\.\/)+auth|next\/headers|next\/server|node:[^'"]+|fs|path)['"]/,
    rule: "no-client-server-runtime-import",
    why: "Client bundles cannot safely depend on server runtimes, filesystem APIs, auth internals, or request headers.",
    fix: "Keep the import in a server component, server action, route handler, or server-only helper.",
  },
  {
    pattern: /['"](?:@\/app\/api|(?:\.\.\/)+app\/api|@\/prisma|(?:\.\.\/)+prisma)['"]/,
    rule: "no-component-internal-server-folder-import",
    why: "Components should not depend on API route internals or Prisma implementation folders.",
    fix: "Move shared types/helpers into lib or pass the result through props.",
  },
];

function walk(dir) {
  const absolute = path.join(root, dir);
  return readdirSync(absolute).flatMap((entry) => {
    const entryPath = path.join(absolute, entry);
    const relativePath = path.relative(root, entryPath);
    const stats = statSync(entryPath);

    if (relativePath === "app/api" || relativePath.startsWith("app/api/")) {
      return [];
    }

    if (stats.isDirectory()) {
      return walk(relativePath);
    }

    return /\.(tsx|ts|jsx|js)$/.test(entry) ? [relativePath] : [];
  });
}

function isClientFile(content) {
  const firstStatement = content.trimStart().split(/\r?\n/, 1)[0]?.trim();
  return firstStatement === "'use client'" || firstStatement === '"use client"';
}

function lineFor(content, index) {
  return content.slice(0, index).split("\n").length;
}

function record(file, line, rule, why, fix) {
  violations.push({ file, line, rule, why, fix });
}

for (const file of scanRoots.flatMap(walk)) {
  const content = readFileSync(path.join(root, file), "utf8");
  const imports = [...content.matchAll(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];?/gm)];

  for (const match of imports) {
    const importStatement = match[0];
    for (const check of serverOnlyImports) {
      if (check.rule.startsWith("no-client") && !isClientFile(content)) {
        continue;
      }

      if (check.pattern.test(importStatement)) {
        record(file, lineFor(content, match.index ?? 0), check.rule, check.why, check.fix);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Architecture check failed. Import boundary violations found:");
  for (const item of violations) {
    console.error(`- ${item.file}:${item.line}`);
    console.error(`  Rule: ${item.rule}`);
    console.error(`  Why: ${item.why}`);
    console.error(`  Suggested fix: ${item.fix}`);
  }
  process.exit(1);
}

console.log("Architecture check passed.");
