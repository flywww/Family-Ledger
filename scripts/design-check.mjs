import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components"];

const trackedKnownConflicts = new Set([
  "app/(auth)/setting/page.tsx::suspicious-direct-palette",
]);

const ignoredFiles = new Set([
  "components/ui/chart.tsx",
  "components/ui/loading-spinner.tsx",
  "components/ui/button.tsx",
  "components/ui/calendar.tsx",
  "components/ui/card.tsx",
  "components/ui/command.tsx",
  "components/ui/dialog.tsx",
  "components/ui/dropdown-menu.tsx",
  "components/ui/form.tsx",
  "components/ui/input.tsx",
  "components/ui/label.tsx",
  "components/ui/month-picker.tsx",
  "components/ui/navigation-menu.tsx",
  "components/ui/popover.tsx",
  "components/ui/scroll-area.tsx",
  "components/ui/select.tsx",
  "components/ui/separator.tsx",
  "components/ui/skeleton.tsx",
  "components/ui/table.tsx",
  "components/ui/tabs.tsx",
  "components/ui/textarea.tsx",
]);

const violations = [];

function walk(dir) {
  const absolute = path.join(root, dir);
  return readdirSync(absolute).flatMap((entry) => {
    const entryPath = path.join(absolute, entry);
    const relativePath = path.relative(root, entryPath);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      return walk(relativePath);
    }

    return /\.(tsx|ts|jsx|js)$/.test(entry) ? [relativePath] : [];
  });
}

function record(file, rule, line, message) {
  if (trackedKnownConflicts.has(`${file}::${rule}`)) {
    return;
  }

  violations.push({ file, rule, line, message });
}

function lineFor(content, index) {
  return content.slice(0, index).split("\n").length;
}

function checkHardCodedHex(file, content) {
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
  for (const match of content.matchAll(hexPattern)) {
    record(
      file,
      "hard-coded-hex",
      lineFor(content, match.index ?? 0),
      "Hard-coded hex color found in app/components code. Use design-system tokens or document the exception."
    );
  }
}

function checkDecorativeStyles(file, content) {
  const patterns = [
    [/\bbg-gradient-[\w-]+/g, "decorative-gradient", "Gradient background found. Authenticated UI should avoid decorative gradients unless documented."],
    [/\b(from|via|to)-(purple|pink|fuchsia|violet)-\d{2,3}\b/g, "purple-pink-gradient", "Purple/pink gradient token found. Avoid AI-style decorative gradients in Family Ledger UI."],
    [/\b(backdrop-blur|blur-\w+)\b/g, "glassmorphism", "Blur/glassmorphism style found. Core finance UI should stay flat and tokenized."],
    [/\bbg-(?:white|black)\/\d{1,3}\b/g, "glass-surface-opacity", "Translucent white/black surface found. Prefer solid tokenized app surfaces over glassmorphism."],
    [/\b(blob|bokeh|orb|glassmorphism)\b/gi, "decorative-blob-glass", "Forbidden decorative style wording found. Verify this is not rendered UI styling."],
  ];

  for (const [pattern, rule, message] of patterns) {
    for (const match of content.matchAll(pattern)) {
      record(file, rule, lineFor(content, match.index ?? 0), message);
    }
  }
}

function checkChartColors(file, content) {
  if (!/recharts|ChartConfig|ChartContainer|PieChart|LineChart|BarChart|AreaChart/.test(content)) {
    return;
  }

  const literalColorPattern = /\b(?:stroke|fill|color)=["'](?!none\b|currentColor\b|currentFill\b|var\(--color-|var\(--chart-|hsl\(var\(--chart-)[^"']+["']/g;
  for (const match of content.matchAll(literalColorPattern)) {
    record(
      file,
      "non-token-chart-color",
      lineFor(content, match.index ?? 0),
      "Chart color does not use --chart-1 through --chart-5 or a derived chart CSS variable."
    );
  }
}

function checkSuspiciousPaletteUsage(file, content) {
  const allowedStatusFamilies = new Set(["emerald", "amber", "rose", "sky"]);
  const suspiciousFamilies = [
    "slate",
    "zinc",
    "neutral",
    "stone",
    "gray",
    "red",
    "orange",
    "yellow",
    "lime",
    "green",
    "teal",
    "cyan",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
  ];
  const utilityPattern = new RegExp(
    `\\b(?:bg|text|border|ring|from|via|to)-(${suspiciousFamilies.join("|")})-\\d{2,3}(?:\\/\\d{1,3})?\\b`,
    "g",
  );

  for (const match of content.matchAll(utilityPattern)) {
    const family = match[1];
    if (allowedStatusFamilies.has(family)) {
      continue;
    }

    record(
      file,
      "suspicious-direct-palette",
      lineFor(content, match.index ?? 0),
      `Direct Tailwind palette utility "${match[0]}" found. Prefer semantic tokens like bg-card, text-foreground, border-border, or document a temporary conflict.`
    );
  }
}

function checkIconOnlyButtons(file, content) {
  const buttonPattern = /<Button\b(?=[^>]*\bsize=["']icon["'])[\s\S]*?<\/Button>|<Button\b(?=[^>]*\bsize=["']icon["'])[^>]*\/>/g;

  for (const match of content.matchAll(buttonPattern)) {
    const block = match[0];
    const hasAccessibleName =
      /\baria-label=/.test(block) ||
      /\btitle=/.test(block) ||
      /className=["'][^"']*\bsr-only\b/.test(block);

    if (!hasAccessibleName) {
      record(
        file,
        "icon-button-label",
        lineFor(content, match.index ?? 0),
        "Icon-only Button is missing aria-label, title, or sr-only text."
      );
    }
  }
}

for (const file of scanRoots.flatMap(walk)) {
  if (ignoredFiles.has(file)) {
    continue;
  }

  const content = readFileSync(path.join(root, file), "utf8");
  checkHardCodedHex(file, content);
  checkDecorativeStyles(file, content);
  checkChartColors(file, content);
  checkSuspiciousPaletteUsage(file, content);
  checkIconOnlyButtons(file, content);
}

if (violations.length > 0) {
  console.error("Design check failed. Fix these or record an intentional conflict in docs/design/design-consistency-conflicts.md and update scripts/design-check.mjs if it must remain temporarily allowed:");
  for (const item of violations) {
    console.error(`- ${item.file}:${item.line}`);
    console.error(`  Rule: ${item.rule}`);
    console.error(`  Recommendation: ${item.message}`);
  }
  process.exit(1);
}

console.log("Design check passed.");
