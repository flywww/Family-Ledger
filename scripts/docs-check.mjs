import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function requireFile(relativePath) {
  if (!existsSync(path.join(root, relativePath))) {
    failures.push({
      rule: "required-doc-exists",
      file: relativePath,
      message: `${relativePath} is required by the validation harness.`,
    });
    return "";
  }

  return read(relativePath);
}

function readIfExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

function listDirectories(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    return [];
  }

  return readdirSync(absolutePath)
    .map((entry) => path.join(relativePath, entry))
    .filter((entryPath) => statSync(path.join(root, entryPath)).isDirectory());
}

function listFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    return [];
  }

  return readdirSync(absolutePath)
    .map((entry) => path.join(relativePath, entry))
    .filter((entryPath) => statSync(path.join(root, entryPath)).isFile());
}

function hasUncheckedTasks(tasks) {
  return /-\s+\[\s\]/.test(tasks);
}

function isUiDesignChange(content) {
  return /\b(UI|design|visual|screen|layout|component|responsive|wireframe|prototype)\b/i.test(content);
}

const designSystem = requireFile("docs/design-system.md");
const designSystemHtml = requireFile("docs/design-system.html");
const conflicts = requireFile("docs/design/design-consistency-conflicts.md");
const architecture = requireFile("docs/architecture-guide.md");
const dataModel = requireFile("docs/data-model-guide.md");
const testing = requireFile("docs/testing-strategy.md");
const agents = requireFile("AGENTS.md");
const openspecConfig = requireFile("openspec/config.yaml");
const validationHarness = requireFile("docs/validation-harness.md");
const vercelConfig = requireFile("vercel.json");
const packageJson = JSON.parse(requireFile("package.json") || "{}");

const managedProductComponentFiles = [
  "components/dashboard/summary-card.tsx",
  "components/dashboard/summary-section.tsx",
  "components/dashboard/chart-section.tsx",
  "components/dashboard/dashboard-line-chart.tsx",
  "components/dashboard/dashboard-pie-chart.tsx",
  "components/dashboard/category-selector.tsx",
  "components/balance/balance-table.tsx",
  "components/balance/balance-table-toolbar.tsx",
  "components/balance/retry-failed-button.tsx",
  "components/monthly-refresh-status.tsx",
  "components/cron-health-alert.tsx",
  "components/search.tsx",
  "components/layouts/nav-links.tsx",
  "components/layouts/nav-menu.tsx",
];

const managedReusableComponentFiles = Array.from(
  new Set([
    ...listFiles("components/ui").filter((file) => file.endsWith(".tsx")),
    ...managedProductComponentFiles,
    ...listFiles("components/patterns").filter((file) => file.endsWith(".tsx")),
    ...listFiles("components/shared").filter((file) => file.endsWith(".tsx")),
  ]),
).sort();

if (openspecConfig) {
  for (const unsupportedKey of ["implementation:", "verification:"]) {
    if (new RegExp(`^\\s{2}${unsupportedKey}`, "m").test(openspecConfig)) {
      failures.push({
        rule: "openspec-supported-artifact-keys",
        file: "openspec/config.yaml",
        message: `OpenSpec spec-driven schema does not support a ${unsupportedKey.replace(":", "")} artifact rule key here. Use proposal, specs, design, and tasks.`,
      });
    }
  }

  const requiredRoutes = [
    "docs/design-system.md",
    "docs/design/design-consistency-conflicts.md",
    "docs/validation-harness.md",
    "docs/architecture-guide.md",
    "docs/data-model-guide.md",
    "docs/testing-strategy.md",
    "AGENTS.md",
  ];

  for (const route of requiredRoutes) {
    if (!openspecConfig.includes(route)) {
      failures.push({
        rule: "openspec-doc-routing",
        file: "openspec/config.yaml",
        message: `OpenSpec config should route agents to ${route}.`,
      });
    }
  }

  if (openspecConfig.length > 6000) {
    failures.push({
      rule: "openspec-concise-routing-layer",
      file: "openspec/config.yaml",
      message: "OpenSpec config is getting large. Keep it as routing/process guidance, not duplicated source-of-truth content.",
    });
  }

  const duplicatedDesignSignals = (openspecConfig.match(/Recommended Light Theme Values|Anti-Patterns|Token Layers|Type Scale/g) ?? []).length;
  if (duplicatedDesignSignals > 0) {
    failures.push({
      rule: "openspec-no-large-design-duplication",
      file: "openspec/config.yaml",
      message: "OpenSpec config appears to duplicate design-system sections. Route to docs instead.",
    });
  }
}

if (vercelConfig) {
  try {
    const parsedVercelConfig = JSON.parse(vercelConfig);
    const regions = parsedVercelConfig.regions;

    if (!Array.isArray(regions) || regions.length !== 1 || regions[0] !== "sin1") {
      failures.push({
        rule: "vercel-production-region",
        file: "vercel.json",
        message: 'Production Vercel Functions must set project-level `regions` to exactly `["sin1"]`.',
      });
    }
  } catch (error) {
    failures.push({
      rule: "vercel-json-parseable",
      file: "vercel.json",
      message: `vercel.json must be valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
for (const changePath of listDirectories("openspec/changes")) {
  const proposalPath = path.join(changePath, "proposal.md");
  const designPath = path.join(changePath, "design.md");
  const tasksPath = path.join(changePath, "tasks.md");
  const prototypeNotesPath = path.join(changePath, "prototype/notes.md");

  const proposal = readIfExists(proposalPath);
  const design = readIfExists(designPath);
  const tasks = readIfExists(tasksPath);
  const combinedChangeText = `${proposal}\n${design}\n${tasks}`;

  if (!proposal || !isUiDesignChange(combinedChangeText)) {
    continue;
  }

  if (tasks && !hasUncheckedTasks(tasks)) {
    continue;
  }

  const visualImpact = proposal.match(/Visual impact:\s*(none|small|medium|large)/i)?.[1]?.toLowerCase();

  if (!visualImpact) {
    failures.push({
      rule: "openspec-ui-visual-impact",
      file: proposalPath,
      message: "UI/design OpenSpec proposals must include `Visual impact: none`, `small`, `medium`, or `large` before implementation.",
    });
  }

  if (design) {
    if (!design.includes("## Visual Review")) {
      failures.push({
        rule: "openspec-visual-review-section",
        file: designPath,
        message: "UI/design OpenSpec design docs must include `## Visual Review` embedded in the change.",
      });
    }

    if (!/Visual Validation/i.test(design)) {
      failures.push({
        rule: "openspec-visual-validation-plan",
        file: designPath,
        message: "UI/design OpenSpec design docs must include a visual validation plan.",
      });
    }
  }

  if (tasks && !/visual review/i.test(tasks)) {
    failures.push({
      rule: "openspec-visual-review-task",
      file: tasksPath,
      message: "UI/design OpenSpec tasks must include visual review before implementation is complete.",
    });
  }

  if (visualImpact === "medium" || visualImpact === "large") {
    const prototypeNotes = readIfExists(prototypeNotesPath);

    if (!prototypeNotes) {
      failures.push({
        rule: "openspec-prototype-notes",
        file: prototypeNotesPath,
        message: "Medium and large visual changes must include `prototype/notes.md` inside the OpenSpec change.",
      });
    }

    if (design && !design.includes("prototype/")) {
      failures.push({
        rule: "openspec-prototype-linked",
        file: designPath,
        message: "Medium and large visual design docs must link to the OpenSpec change prototype.",
      });
    }

    if (tasks && !/prototype/i.test(tasks)) {
      failures.push({
        rule: "openspec-prototype-review-task",
        file: tasksPath,
        message: "Medium and large visual changes must include prototype review before implementation.",
      });
    }

    for (const requiredPhrase of ["Status: reference only", "Implementation starts after"]) {
      if (prototypeNotes && !prototypeNotes.includes(requiredPhrase)) {
        failures.push({
          rule: "openspec-prototype-contract",
          file: prototypeNotesPath,
          message: `Prototype notes must include \`${requiredPhrase}\` to prevent bypassing the OpenSpec process.`,
        });
      }
    }
  }
}

const oldDocs = [
  "docs/architecture-design-report.md",
  "docs/code-optimization-report.md",
  "docs/architecture.md",
  "docs/data-model.md",
  "docs/testing.md",
  "docs/design/family-ledger-design-system.md",
  "docs/design/index.html",
];

for (const oldDoc of oldDocs) {
  if (existsSync(path.join(root, oldDoc))) {
    failures.push({
      rule: "no-legacy-report-docs",
      file: oldDoc,
      message: `${oldDoc} should be folded into convention docs such as docs/architecture-guide.md, docs/data-model-guide.md, docs/testing-strategy.md, or AGENTS.md.`,
    });
  }
}

if (conflicts && !conflicts.includes("## New Conflict Record Template")) {
  failures.push({
    rule: "conflict-template-present",
    file: "docs/design/design-consistency-conflicts.md",
    message: "Design conflicts doc should include the conflict record template.",
  });
}

if (validationHarness) {
  const requiredSections = ["# Validation Harness", "## Validation matrix", "## Manual-only rules", "## Adoption phases"];
  for (const section of requiredSections) {
    if (!validationHarness.includes(section)) {
      failures.push({
        rule: "validation-harness-section",
        file: "docs/validation-harness.md",
        message: `Validation harness doc is missing ${section}.`,
      });
    }
  }

  if (!validationHarness.includes("| Area | Source rule | Validation method | Tool/script | Automated? | Status |")) {
    failures.push({
      rule: "validation-matrix-present",
      file: "docs/validation-harness.md",
      message: "Validation harness doc should include the validation matrix table.",
    });
  }
}

if (designSystem && !designSystem.includes("docs/design/design-consistency-conflicts.md")) {
  failures.push({
    rule: "design-system-conflict-routing",
    file: "docs/design-system.md",
    message: "Design system should route unresolved conflicts to docs/design/design-consistency-conflicts.md.",
  });
}

if (designSystem) {
  const requiredPhrases = [
    "### Reusable Component Catalog",
    "New reusable components must be documented here and mirrored in `docs/design-system.html`.",
    "OpenSpec UI proposals should state whether they reuse, extend, add, or intentionally avoid a reusable component.",
  ];

  for (const phrase of requiredPhrases) {
    if (!designSystem.includes(phrase)) {
      failures.push({
        rule: "reusable-component-catalog-policy",
        file: "docs/design-system.md",
        message: `Design system should include reusable component catalog policy: ${phrase}`,
      });
    }
  }
}

for (const componentFile of managedReusableComponentFiles) {
  if (!existsSync(path.join(root, componentFile))) {
    failures.push({
      rule: "managed-reusable-component-exists",
      file: componentFile,
      message: `${componentFile} is listed as a managed reusable component but does not exist.`,
    });
    continue;
  }

  if (designSystem && !designSystem.includes(componentFile)) {
    failures.push({
      rule: "reusable-component-markdown-catalog",
      file: "docs/design-system.md",
      message: `Managed reusable component ${componentFile} must be listed in docs/design-system.md.`,
    });
  }

  if (designSystemHtml && !designSystemHtml.includes(componentFile)) {
    failures.push({
      rule: "reusable-component-html-catalog",
      file: "docs/design-system.html",
      message: `Managed reusable component ${componentFile} must be listed in docs/design-system.html.`,
    });
  }
}

if (designSystemHtml) {
  const htmlChecks = [
    ["docs/design-system.md", "static-html-links-source-markdown"],
    ["docs/design/design-consistency-conflicts.md", "static-html-links-conflicts"],
    ["scripts/design-check.mjs", "static-html-links-design-check"],
  ];

  for (const [needle, rule] of htmlChecks) {
    if (!designSystemHtml.includes(needle) && !designSystemHtml.includes(needle.replace("docs/", "./"))) {
      failures.push({
        rule,
        file: "docs/design-system.html",
        message: `Static design-system HTML should link to ${needle}.`,
      });
    }
  }
}

if (architecture && !architecture.includes("# Family Ledger Architecture Guide")) {
  failures.push({
    rule: "architecture-guide-title",
    file: "docs/architecture-guide.md",
    message: "Architecture source of truth should be titled # Family Ledger Architecture Guide.",
  });
}

if (dataModel && !dataModel.includes("# Family Ledger Data Model Guide")) {
  failures.push({
    rule: "data-model-guide-title",
    file: "docs/data-model-guide.md",
    message: "Data model source of truth should be titled # Family Ledger Data Model Guide.",
  });
}

if (testing && !testing.includes("# Family Ledger Testing Strategy")) {
  failures.push({
    rule: "testing-strategy-title",
    file: "docs/testing-strategy.md",
    message: "Testing source of truth should be titled # Family Ledger Testing Strategy.",
  });
}

const unitTestScript = packageJson.scripts?.["test:unit"] ?? "";

if (unitTestScript.includes("monthly-refresh.test.ts") || /\bvitest\s+run\s*$/.test(unitTestScript)) {
  failures.push({
    rule: "unit-tests-exclude-db-backed-tests",
    file: "package.json",
    message: "`npm run test:unit` must not run database-backed tests directly. Use `npm run test` for Prisma-backed tests.",
  });
}

const monthlyRefreshTest = readIfExists("tests/monthly-refresh.test.ts");

if (
  monthlyRefreshTest &&
  (!monthlyRefreshTest.includes("TEST_SCHEMA_PREFIX = \"family_ledger_test_\"") ||
    !monthlyRefreshTest.includes("assertIsolatedTestDatabase();"))
) {
  failures.push({
    rule: "db-backed-tests-require-isolated-schema-guard",
    file: "tests/monthly-refresh.test.ts",
    message: "Database-backed reset helpers must assert an isolated `family_ledger_test_` schema before deleting rows.",
  });
}

if (agents && !agents.includes("# Family Ledger Repository Guide")) {
  failures.push({
    rule: "repository-guide-title",
    file: "AGENTS.md",
    message: "Repository guide should be titled # Family Ledger Repository Guide.",
  });
}

if (failures.length > 0) {
  console.error("Docs check failed. Source-of-truth drift found:");
  for (const item of failures) {
    console.error(`- ${item.file}`);
    console.error(`  Rule: ${item.rule}`);
    console.error(`  Recommendation: ${item.message}`);
  }
  process.exit(1);
}

console.log("Docs check passed.");
