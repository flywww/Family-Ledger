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

function getTopLevelUncheckedTaskBlocks(tasks) {
  const blocks = [];
  const lines = tasks.split(/\r?\n/);
  let current = null;

  lines.forEach((line, index) => {
    if (/^-\s+\[\s\]/.test(line)) {
      if (current) {
        blocks.push(current);
      }
      current = {
        line: index + 1,
        content: line,
      };
      return;
    }

    if (current) {
      current.content += `\n${line}`;
    }
  });

  if (current) {
    blocks.push(current);
  }

  return blocks;
}

function isUiDesignChange(content) {
  return /\b(UI|design|visual|screen|layout|component|responsive|wireframe|prototype)\b/i.test(content);
}

function hasExistingWorkflowIntegration(tasks) {
  return /existing workflow integration/i.test(tasks);
}

function hasCreateAndVisibleProof(tasks) {
  return /create-and-visible proof/i.test(tasks) ||
    (/create|submit|writes?/i.test(tasks) && /visible|shows?|render|list|table|detail|read path/i.test(tasks));
}

function isBehaviorChange(content) {
  return /\b(behavior|workflow|calculation|server action|database|save|create|update|delete|pricing|projection|auth|authenticated|route|persistence|Prisma|persisted|read path)\b/i.test(content);
}

function isTddExempt(content) {
  return /\b(docs-only|process-only|prototype-only|reference-only)\b/i.test(content);
}

function hasTddContract(content) {
  return /TDD behavior:/i.test(content) &&
    /Public interface:/i.test(content) &&
    /Test command:/i.test(content) &&
    /Mocking:/i.test(content) &&
    /Module depth:/i.test(content);
}

function hasTddCycle(content) {
  return /\bRED\b/.test(content) &&
    /\bGREEN\b/.test(content) &&
    /\bREFACTOR\b/.test(content) &&
    /\bVALIDATE\b/.test(content);
}

function hasDbBackedBehavior(content) {
  return /\b(database|Prisma|persistence|persisted|save|saved|create|update|delete|DB-backed|schema|migration)\b/i.test(content);
}

function hasDbSafeTestCommand(content) {
  return /Test command:\s*npm run test(?:\s|$)/im.test(content) ||
    /Manual-only:\s*no DB behavior implemented in this task/i.test(content);
}

function hasManualOnlyReason(content) {
  if (!/Test command:\s*manual review/i.test(content)) {
    return true;
  }

  const manualOnly = content.match(/Manual-only:\s*(.+)/i)?.[1]?.trim() ?? "";
  return manualOnly.length > 12 && !/^(none|n\/a|-)$/i.test(manualOnly);
}

function collectTddTaskFailures({ proposal, design, tasks }) {
  const combinedChangeText = `${proposal}\n${design}\n${tasks}`;
  if (!tasks || !hasUncheckedTasks(tasks) || isTddExempt(combinedChangeText) || !isBehaviorChange(combinedChangeText)) {
    return [];
  }

  const taskBlocks = getTopLevelUncheckedTaskBlocks(tasks).filter((task) =>
    isBehaviorChange(`${proposal}\n${design}\n${task.content}`),
  );
  const tddFailures = [];

  for (const task of taskBlocks) {
    if (!hasTddContract(task.content)) {
      tddFailures.push({
        rule: "openspec-tdd-contract-required",
        line: task.line,
        message: "Behavior-changing active OpenSpec tasks must include TDD behavior, Public interface, Test command, Mocking, and Module depth.",
      });
    }

    if (!hasTddCycle(task.content)) {
      tddFailures.push({
        rule: "openspec-tdd-cycle-required",
        line: task.line,
        message: "Behavior-changing active OpenSpec tasks must include RED, GREEN, REFACTOR, and VALIDATE.",
      });
    }

    if (hasDbBackedBehavior(task.content) && !hasDbSafeTestCommand(task.content)) {
      tddFailures.push({
        rule: "openspec-tdd-db-safe-command",
        line: task.line,
        message: "DB-backed TDD tasks must use `Test command: npm run test` or explicitly state `Manual-only: no DB behavior implemented in this task`.",
      });
    }

    if (!hasManualOnlyReason(task.content)) {
      tddFailures.push({
        rule: "openspec-tdd-manual-exemption-reason",
        line: task.line,
        message: "Tasks using `Test command: manual review` must include a concrete Manual-only reason.",
      });
    }
  }

  return tddFailures;
}

function runTddClassifierSelfChecks() {
  const cases = [
    {
      name: "complete behavior task",
      content: [
        "- [ ] TDD behavior: calculation returns target year.",
        "  Public interface: calculateFireProjection().",
        "  Test command: npm run test:unit",
        "  Mocking: none.",
        "  Module depth: deep.",
        "  Manual-only: none.",
        "  - [ ] RED: Add failing test.",
        "  - [ ] GREEN: Implement minimum.",
        "  - [ ] REFACTOR: Improve while green.",
        "  - [ ] VALIDATE: Run checks.",
      ].join("\n"),
      contract: true,
      cycle: true,
      dbSafe: true,
    },
    {
      name: "db backed task uses safe runner",
      content: [
        "- [ ] TDD behavior: saved profile is persisted.",
        "  Public interface: saveFireProfile().",
        "  Test command: npm run test",
        "  Mocking: none.",
        "  Module depth: deep.",
        "  Manual-only: none.",
        "  - [ ] RED: Add failing test.",
        "  - [ ] GREEN: Implement minimum.",
        "  - [ ] REFACTOR: Improve while green.",
        "  - [ ] VALIDATE: Run checks.",
      ].join("\n"),
      contract: true,
      cycle: true,
      dbSafe: true,
    },
    {
      name: "db backed task rejects unit-only runner",
      content: [
        "- [ ] TDD behavior: saved profile is persisted.",
        "  Public interface: saveFireProfile().",
        "  Test command: npm run test:unit",
        "  Mocking: none.",
        "  Module depth: deep.",
        "  Manual-only: none.",
        "  - [ ] RED: Add failing test.",
        "  - [ ] GREEN: Implement minimum.",
        "  - [ ] REFACTOR: Improve while green.",
        "  - [ ] VALIDATE: Run checks.",
      ].join("\n"),
      contract: true,
      cycle: true,
      dbSafe: false,
    },
    {
      name: "docs-only task is exempt",
      content: "- [ ] docs-only: update source docs.",
      exempt: true,
    },
    {
      name: "manual review needs reason",
      content: [
        "- [ ] TDD behavior: route visual review.",
        "  Public interface: /fire route.",
        "  Test command: manual review",
        "  Mocking: none.",
        "  Module depth: existing.",
        "  Manual-only: browser automation is not active.",
        "  - [ ] RED: Record manual-only reason.",
        "  - [ ] GREEN: Implement route.",
        "  - [ ] REFACTOR: Rerun check.",
        "  - [ ] VALIDATE: Run checks.",
      ].join("\n"),
      manualReason: true,
    },
    {
      name: "one compliant task does not hide a non-compliant task",
      proposal: "Behavior change: save profile.",
      design: "",
      tasks: [
        "- [ ] TDD behavior: saved profile is persisted.",
        "  Public interface: saveFireProfile().",
        "  Test command: npm run test",
        "  Mocking: none.",
        "  Module depth: deep.",
        "  Manual-only: none.",
        "  - [ ] RED: Add failing test.",
        "  - [ ] GREEN: Implement minimum.",
        "  - [ ] REFACTOR: Improve while green.",
        "  - [ ] VALIDATE: Run checks.",
        "- [ ] Persist updated profile settings.",
      ].join("\n"),
      collectedFailureRules: ["openspec-tdd-contract-required", "openspec-tdd-cycle-required"],
    },
  ];

  for (const item of cases) {
    if (typeof item.exempt === "boolean" && isTddExempt(item.content) !== item.exempt) {
      failures.push({
        rule: "docs-check-tdd-self-test",
        file: "scripts/docs-check.mjs",
        message: `TDD classifier self-check failed for ${item.name}: exemption mismatch.`,
      });
    }

    if (typeof item.contract === "boolean" && hasTddContract(item.content) !== item.contract) {
      failures.push({
        rule: "docs-check-tdd-self-test",
        file: "scripts/docs-check.mjs",
        message: `TDD classifier self-check failed for ${item.name}: contract mismatch.`,
      });
    }

    if (typeof item.cycle === "boolean" && hasTddCycle(item.content) !== item.cycle) {
      failures.push({
        rule: "docs-check-tdd-self-test",
        file: "scripts/docs-check.mjs",
        message: `TDD classifier self-check failed for ${item.name}: cycle mismatch.`,
      });
    }

    const dbCommandAllowed = !hasDbBackedBehavior(item.content) || hasDbSafeTestCommand(item.content);
    if (typeof item.dbSafe === "boolean" && dbCommandAllowed !== item.dbSafe) {
      failures.push({
        rule: "docs-check-tdd-self-test",
        file: "scripts/docs-check.mjs",
        message: `TDD classifier self-check failed for ${item.name}: DB command mismatch.`,
      });
    }

    if (typeof item.manualReason === "boolean" && hasManualOnlyReason(item.content) !== item.manualReason) {
      failures.push({
        rule: "docs-check-tdd-self-test",
        file: "scripts/docs-check.mjs",
        message: `TDD classifier self-check failed for ${item.name}: manual reason mismatch.`,
      });
    }

    if (item.collectedFailureRules) {
      const actualRules = collectTddTaskFailures({
        proposal: item.proposal,
        design: item.design,
        tasks: item.tasks,
      }).map((failure) => failure.rule);

      for (const expectedRule of item.collectedFailureRules) {
        if (!actualRules.includes(expectedRule)) {
          failures.push({
            rule: "docs-check-tdd-self-test",
            file: "scripts/docs-check.mjs",
            message: `TDD classifier self-check failed for ${item.name}: missing ${expectedRule}.`,
          });
        }
      }
    }
  }
}

function requireIncludes(content, needle, rule, file, message) {
  if (!content.includes(needle)) {
    failures.push({ rule, file, message });
  }
}

runTddClassifierSelfChecks();

const designSystem = requireFile("docs/design-system.md");
const designSystemHtml = requireFile("docs/design-system.html");
const conflicts = requireFile("docs/design/design-consistency-conflicts.md");
const architecture = requireFile("docs/architecture-guide.md");
const dataModel = requireFile("docs/data-model-guide.md");
const testing = requireFile("docs/testing-strategy.md");
const agentWorkflow = requireFile("docs/agent-development-workflow.md");
const featureBacklog = requireFile("docs/feature-backlog.md");
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
    "docs/feature-backlog.md",
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

  requireIncludes(
    openspecConfig,
    "Durable-rule validation path",
    "openspec-durable-rule-validation-gate",
    "openspec/config.yaml",
    "OpenSpec config must keep the durable-rule validation gate so new durable rules map to validation.",
  );

  requireIncludes(
    openspecConfig,
    "docs/validation-harness.md",
    "openspec-validation-harness-routing",
    "openspec/config.yaml",
    "OpenSpec config must route durable-rule validation updates to docs/validation-harness.md.",
  );

  requireIncludes(
    openspecConfig,
    "Agent-led deployment gate",
    "openspec-agent-led-deployment-gate",
    "openspec/config.yaml",
    "OpenSpec config must keep the agent-led deployment gate so agents ask before state-changing CI/CD steps.",
  );

  requireIncludes(
    openspecConfig,
    "warn what evidence will be missing",
    "openspec-skip-warning-gate",
    "openspec/config.yaml",
    "OpenSpec config must require agents to warn before skipping CI/CD checkpoints.",
  );

  requireIncludes(
    openspecConfig,
    "TDD, behavior tests, mocking boundaries, interface design for testability, deep modules, refactoring evidence, or Codex Plan Mode TDD contracts -> docs/testing-strategy.md",
    "openspec-tdd-routing",
    "openspec/config.yaml",
    "OpenSpec config must route TDD behavior, mocking, interface, module-depth, refactoring, and Codex Plan Mode rules to docs/testing-strategy.md.",
  );

  requireIncludes(
    openspecConfig,
    "TDD behavior, Public interface, Test command, Mocking, Module depth, RED, GREEN, REFACTOR, and VALIDATE",
    "openspec-tdd-task-contract-routing",
    "openspec/config.yaml",
    "OpenSpec config must require behavior-changing tasks to include the TDD contract fields.",
  );
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

  if (tasks && hasExistingWorkflowIntegration(tasks) && !hasCreateAndVisibleProof(tasks)) {
    failures.push({
      rule: "openspec-existing-workflow-create-visible-proof",
      file: tasksPath,
      message: "Existing workflow integration tasks must include create-and-visible proof: verify the create/submit path writes data and the list/detail/read path shows it under relevant filters or views.",
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

for (const changePath of listDirectories("openspec/changes")) {
  if (changePath === "openspec/changes/archive" || changePath.includes("/archive/")) {
    continue;
  }

  const proposalPath = path.join(changePath, "proposal.md");
  const designPath = path.join(changePath, "design.md");
  const tasksPath = path.join(changePath, "tasks.md");
  const proposal = readIfExists(proposalPath);
  const design = readIfExists(designPath);
  const tasks = readIfExists(tasksPath);

  for (const failure of collectTddTaskFailures({ proposal, design, tasks })) {
    failures.push({
      rule: failure.rule,
      file: tasksPath,
      message: `${failure.message} First failing task starts on line ${failure.line}.`,
    });
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

  if (!validationHarness.includes("| Area | Owner doc | Source rule | Validation method | Tool/script | Automated? | Status |")) {
    failures.push({
      rule: "validation-matrix-present",
      file: "docs/validation-harness.md",
      message: "Validation harness doc should include the validation matrix table.",
    });
  }

  requireIncludes(
    validationHarness,
    "Agent-led gate mode",
    "validation-harness-agent-led-gate",
    "docs/validation-harness.md",
    "Validation harness must map agent-led deployment gates to a validation path.",
  );

  requireIncludes(
    validationHarness,
    "docs/agent-development-workflow.md",
    "validation-harness-agent-workflow-routing",
    "docs/validation-harness.md",
    "Validation harness must map the AI agent workflow doc to a validation path.",
  );

  requireIncludes(
    validationHarness,
    "Create-and-visible UI workflow proof",
    "validation-harness-create-visible-proof",
    "docs/validation-harness.md",
    "Validation harness must document create-and-visible proof for existing UI workflow integration.",
  );

  const requiredTddHarnessPhrases = [
    ["TDD behavior tests use public interfaces and one RED/GREEN/REFACTOR cycle at a time.", "validation-harness-tdd-cycle", "Validation harness must map the TDD behavior-test cycle to a validation path."],
    ["Behavior-changing OpenSpec tasks include the TDD contract", "validation-harness-tdd-task-contract", "Validation harness must map active OpenSpec TDD task-shape enforcement."],
    ["DB-backed TDD uses the isolated `npm run test` runner", "validation-harness-tdd-db-runner", "Validation harness must map DB-backed TDD to the isolated test runner."],
    ["Codex Plan Mode behavior-changing plans include a TDD Contract", "validation-harness-codex-plan-tdd", "Validation harness must document Codex Plan Mode TDD contract review."],
    ["TDD mocking boundary", "validation-harness-tdd-mocking-manual", "Validation harness must document manual review for TDD mocking boundaries."],
    ["TDD module depth", "validation-harness-tdd-module-depth", "Validation harness must document manual review for module depth."],
    ["TDD refactor evidence", "validation-harness-tdd-refactor-evidence", "Validation harness must document manual review for refactor evidence."],
    ["Planning Protocol readiness", "validation-harness-planning-protocol-readiness", "Validation harness must document manual review for Planning Protocol readiness."],
    ["Non-trivial planning uses the Planning Protocol readiness check", "validation-harness-planning-protocol-matrix", "Validation harness must map Planning Protocol usage to a validation path."],
  ];

  for (const [needle, rule, message] of requiredTddHarnessPhrases) {
    requireIncludes(validationHarness, needle, rule, "docs/validation-harness.md", message);
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

if (testing) {
  requireIncludes(
    testing,
    "agent-led gate mode",
    "testing-strategy-agent-led-gate",
    "docs/testing-strategy.md",
    "Testing strategy must describe agent-led deployment gate mode.",
  );

  const requiredTddTestingPhrases = [
    ["## TDD With OpenSpec", "testing-strategy-tdd-section", "Testing strategy must include the TDD With OpenSpec section."],
    ["### Behavior Tests", "testing-strategy-tdd-behavior-tests", "Testing strategy must include TDD behavior-test guidance."],
    ["### Mocking Rules", "testing-strategy-tdd-mocking-rules", "Testing strategy must include TDD mocking guidance."],
    ["### Interface Design For Testability", "testing-strategy-tdd-interface-design", "Testing strategy must include interface-design-for-testability guidance."],
    ["### Deep Modules", "testing-strategy-tdd-deep-modules", "Testing strategy must include deep-module guidance."],
    ["### Refactoring After Green", "testing-strategy-tdd-refactoring", "Testing strategy must include refactoring-after-green guidance."],
    ["### OpenSpec TDD Task Template", "testing-strategy-tdd-openspec-template", "Testing strategy must include the OpenSpec TDD task template."],
    ["### Codex Plan Mode TDD Contract", "testing-strategy-tdd-codex-plan-contract", "Testing strategy must include the Codex Plan Mode TDD contract."],
    ["### Validation Evidence Format", "testing-strategy-tdd-evidence-format", "Testing strategy must include TDD validation evidence format."],
    ["Mock system boundaries only", "testing-strategy-tdd-boundary-mocks", "Testing strategy must require boundary-only mocking."],
    ["Never refactor while RED", "testing-strategy-tdd-never-refactor-red", "Testing strategy must require refactoring only after GREEN."],
    ["small interface, deep implementation", "testing-strategy-tdd-deep-module-phrase", "Testing strategy must define deep modules as small interface, deep implementation."],
  ];

  for (const [needle, rule, message] of requiredTddTestingPhrases) {
    requireIncludes(testing, needle, rule, "docs/testing-strategy.md", message);
  }
}

if (agentWorkflow) {
  const requiredWorkflowPhrases = [
    ["# AI Agent Development Workflow", "agent-workflow-title", "Agent workflow doc should keep its canonical title."],
    ["## Planning Protocol", "agent-workflow-planning-protocol", "Agent workflow doc must include the Planning Protocol for non-trivial/revised plans."],
    ["Plan readiness check", "agent-workflow-plan-readiness-check", "Planning Protocol must include the plan readiness check."],
    ["What changed from previous plan:", "agent-workflow-plan-revision-delta", "Planning Protocol must require tracking what changed from the previous plan."],
    ["What was intentionally preserved:", "agent-workflow-plan-preserve-detail", "Planning Protocol must require preserving earlier approved detail."],
    ["Deferred feature backlog updates:", "agent-workflow-deferred-backlog-check", "Planning Protocol must require staged-plan backlog updates."],
    ["Revision rule: a revised plan is a complete replacement plan", "agent-workflow-complete-replacement-plan", "Planning Protocol must treat revised plans as complete replacement plans."],
    ["Feature backlog rule: when a requirement is split across stages", "agent-workflow-feature-backlog-rule", "Agent workflow doc must require backlog entries for deferred staged requirements."],
    ["Does this require scripts/docs-check.mjs enforcement?", "agent-workflow-planning-docs-check-question", "Planning Protocol must ask whether docs-check enforcement is required."],
    ["## Agent Command Map", "agent-workflow-command-map", "Agent workflow doc must include the unified command map."],
    ["## Local Dev Bootstrap", "agent-workflow-bootstrap", "Agent workflow doc must include the local dev bootstrap workflow."],
    ["## DB-Safe Validation Decision Tree", "agent-workflow-db-safe-validation", "Agent workflow doc must include the DB-safe validation decision tree."],
    ["## Handoff Report Template", "agent-workflow-handoff-template", "Agent workflow doc must include the standard handoff report template."],
    ["Do not change `.gitignore` or commit these folders without maintainer approval.", "agent-workflow-local-tooling-approval", "Agent workflow doc must protect local AI tooling folder treatment."],
    ["Never use `git reset`, `git checkout --`, `git clean`, or destructive history commands without explicit approval.", "agent-workflow-dirty-worktree-safety", "Agent workflow doc must keep destructive Git command safety guidance."],
  ];

  for (const [needle, rule, message] of requiredWorkflowPhrases) {
    requireIncludes(agentWorkflow, needle, rule, "docs/agent-development-workflow.md", message);
  }

  const requiredTddWorkflowPhrases = [
    ["## TDD Apply Loop", "agent-workflow-tdd-apply-loop", "Agent workflow doc must include the TDD apply loop."],
    ["RED", "agent-workflow-tdd-red", "Agent workflow doc must include RED in the TDD apply loop."],
    ["GREEN", "agent-workflow-tdd-green", "Agent workflow doc must include GREEN in the TDD apply loop."],
    ["REFACTOR", "agent-workflow-tdd-refactor", "Agent workflow doc must include REFACTOR in the TDD apply loop."],
    ["Public interface", "agent-workflow-tdd-public-interface", "Agent workflow doc must require the public interface under test."],
    ["focused command", "agent-workflow-tdd-focused-command", "Agent workflow doc must require focused command evidence."],
    ["TDD Contract", "agent-workflow-tdd-codex-contract", "Agent workflow doc must require Codex Plan Mode TDD Contract for behavior work."],
  ];

  for (const [needle, rule, message] of requiredTddWorkflowPhrases) {
    requireIncludes(agentWorkflow, needle, rule, "docs/agent-development-workflow.md", message);
  }
}

if (featureBacklog) {
  const requiredFeatureBacklogPhrases = [
    ["# Feature Backlog", "feature-backlog-title", "Feature backlog must keep its canonical title."],
    ["## Backlog Rule", "feature-backlog-rule-section", "Feature backlog must include the staged-requirement backlog rule."],
    ["When a requirement is split across stages", "feature-backlog-staged-requirement-rule", "Feature backlog must require deferred staged requirements to be captured."],
    ["### Agent API - Holding Write Operations", "feature-backlog-agent-holding-writes", "Feature backlog must preserve the deferred Agent API holding write work."],
    ["Use DB-backed tests with `npm run test`.", "feature-backlog-agent-validation", "Deferred Agent API holding write work must keep DB-backed validation notes."],
  ];

  for (const [needle, rule, message] of requiredFeatureBacklogPhrases) {
    requireIncludes(featureBacklog, needle, rule, "docs/feature-backlog.md", message);
  }
}

if (!existsSync(path.join(root, "scripts/env-health.mjs"))) {
  failures.push({
    rule: "env-health-script-exists",
    file: "scripts/env-health.mjs",
    message: "Read-only environment health script must exist for AI-agent startup diagnostics.",
  });
}

if (packageJson.scripts?.["env:health"] !== "node scripts/env-health.mjs") {
  failures.push({
    rule: "env-health-package-script",
    file: "package.json",
    message: "`npm run env:health` must run `node scripts/env-health.mjs`.",
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

if (agents) {
  const requiredAgentContractPhrases = [
    ["### MUST", "agent-contract-must-section", "AGENTS.md must keep a MUST section for non-negotiable repo operations."],
    ["### ASK FIRST", "agent-contract-ask-first-section", "AGENTS.md must keep an ASK FIRST section for high-risk changes."],
    ["### NEVER", "agent-contract-never-section", "AGENTS.md must keep a NEVER section for prohibited actions."],
    ["Never delete or reset real database data unless the user explicitly asks.", "agent-contract-database-safety", "AGENTS.md must keep the real database deletion/reset prohibition."],
    ["Keep durable rules mapped to a validation path in `docs/validation-harness.md`.", "agent-contract-validation-path", "AGENTS.md must keep the durable-rule validation-path requirement."],
    ["Never edit `.env*` files into commits or expose secrets.", "agent-contract-env-safety", "AGENTS.md must keep the .env and secret-safety prohibition."],
    ["### Agent-Led Gate Mode", "agent-led-gate-mode-section", "AGENTS.md must keep the agent-led gate mode section for deployable OpenSpec changes."],
    ["If the user asks to skip a required gate or archive early", "agent-led-skip-warning", "AGENTS.md must require explicit warnings before skipped CI/CD gates."],
    ["docs/agent-development-workflow.md", "agent-workflow-doc-routing", "AGENTS.md must route agents to the AI agent workflow doc."],
    ["npm run env:health", "agent-env-health-command", "AGENTS.md must list the read-only environment health command."],
  ];

  for (const [needle, rule, message] of requiredAgentContractPhrases) {
    requireIncludes(agents, needle, rule, "AGENTS.md", message);
  }
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
