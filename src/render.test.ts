import assert from "node:assert/strict";
import test from "node:test";
import { buildExecutionPlan, createDefaultState, resolveV3Config, setV3UserDecision } from "./core.js";
import { createStartToolingManifest, renderAgentEntryPoints, renderPlanMarkdown, renderReadinessReport, renderStartOwnedFiles } from "./render.js";

function defaultConfig() {
  const config = resolveV3Config(createDefaultState());
  return { config, plan: buildExecutionPlan(config) };
}

const forbiddenProductPaths = [
  "app/page.tsx", "app/layout.tsx", "app/globals.css", "components/ui/button.tsx", "components/ui/card.tsx", "app/dashboard/page.tsx", "app/sign-in/page.tsx", "app/sign-up/page.tsx", "app/api/auth/[...all]/route.ts", "tests/home.test.tsx",
];

test("durable baseline preserves official UI ownership and has no service leakage", () => {
  const { config, plan } = defaultConfig();
  const files = renderStartOwnedFiles(config, plan);
  const tooling = createStartToolingManifest(config);

  for (const path of forbiddenProductPaths) assert.equal(files[path], undefined, `${path} must remain official or requirement-owned`);
  assert.equal(files["AGENTS.md"].includes("Think before coding"), true);
  assert.equal(files["AGENTS.md"].includes("BEGIN:nextjs-agent-rules"), true);
  assert.equal(files["AGENTS.md"].includes("Project structure"), true);
  assert.equal(files["AGENTS.md"].includes("## Verification"), true);
  assert.equal(files["AGENTS.md"].includes("shadcn block"), true);
  assert.equal(files["docs/START_READINESS.md"].includes("Status: pending"), true);
  assert.equal(files["docs/DEVELOPMENT.md"].includes("Full local gate"), true);
  assert.equal(files["docs/AGENT_WORKFLOWS.md"].includes(".agents/commands/implement.md"), true);
  assert.equal(files["docs/HOOKS.md"].includes("Husky"), true);
  assert.equal(files["README.md"].includes("Quick start"), true);
  assert.equal(files["README.md"].includes(".env.example"), true);
  assert.equal(files["README.md"].includes("pnpm install"), true);
  assert.equal(files["README.md"].includes("Production build"), true);
  assert.equal(files["README.md"].includes("Playwright tests"), true);
  assert.equal(files[".github/workflows/verify.yml"].includes(plan.verification.command), true);
  assert.equal(files["start-tooling.json"] !== undefined, true);
  assert.equal(files["tests/readiness.test.ts"].includes('from "vitest"'), true);
  assert.equal(files["tests/readiness.test.ts"].includes("docs/START_PLAN.md"), true);
  assert.equal(files["biome.json"].includes('"!!test-results"'), true);
  assert.equal(files["biome.json"].includes('"!!tsconfig.json"'), true);
  assert.equal(files["biome.json"].includes('"components/ui/**"'), true);
  assert.equal(files["next.config.ts"].includes('allowedDevOrigins: ["127.0.0.1"]'), true);
  assert.equal(files[".nvmrc"], "24.3.0\n");
  assert.match(files[".github/workflows/verify.yml"], /pnpm\/action-setup@v4/);
  assert.match(files[".github/workflows/verify.yml"], /node-version: 24\.3\.0/);
  assert.equal(tooling.dependencies?.["better-auth"], undefined);
  assert.equal(tooling.dependencies?.next, "16.3.3");
  assert.equal(tooling.packageManager, "pnpm@9.15.0");
  assert.equal(tooling.engines?.node, ">=24.3.0 <25");
  assert.equal(tooling.devDependencies?.husky, "9.1.7");
  assert.equal(tooling.dependencies?.ai, undefined);
  assert.equal(files["lib/db/schema.ts"], undefined);
  assert.equal(files["lib/auth.ts"], undefined);
  assert.equal(files["lib/storage/index.ts"], undefined);
  assert.equal(files["lib/ai/providers.ts"], undefined);
});

test("selected capabilities add empty durable layers without demo behavior", () => {
  let state = createDefaultState();
  state = setV3UserDecision(state, "authentication", "better-auth").state;
  state = setV3UserDecision(state, "storage", "vercel-blob").state;
  state = setV3UserDecision(state, "aiProviders", ["openai"]).state;
  state = setV3UserDecision(state, "opentelemetry", true).state;
  state = setV3UserDecision(state, "sentry", true).state;
  const config = resolveV3Config(state);
  const files = renderStartOwnedFiles(config, buildExecutionPlan(config));
  const tooling = createStartToolingManifest(config);

  assert.equal(files["lib/db/schema.ts"].includes("no product tables"), true);
  assert.equal(files["lib/auth.ts"].includes("betterAuth"), true);
  assert.equal(files["lib/storage/index.ts"].includes("no file routes"), true);
  assert.equal(files["lib/ai/providers.ts"].includes("no chat routes"), true);
  assert.equal(files["instrumentation.ts"].includes("registerOTel"), true);
  assert.equal(files["sentry.server.config.ts"] !== undefined, true);
  assert.equal(tooling.dependencies?.["better-auth"] !== undefined, true);
  assert.equal(tooling.dependencies?.["@vercel/blob"] !== undefined, true);
  assert.equal(tooling.dependencies?.["@ai-sdk/openai"] !== undefined, true);
  for (const path of forbiddenProductPaths.filter((path) => path !== "app/api/auth/[...all]/route.ts")) assert.equal(files[path], undefined, `${path} must not be generated by capability setup`);
  assert.equal(typeof files["app/api/auth/[...all]/route.ts"], "string", "Better Auth needs only its framework route handler");
});

test("agent entry points are limited to selected agents and retain the readiness rule", () => {
  let state = createDefaultState();
  state = setV3UserDecision(state, "primaryAgent", "claude-code").state;
  state = setV3UserDecision(state, "additionalAgents", ["cursor"]).state;
  const files = renderAgentEntryPoints(resolveV3Config(state));

  assert.equal(files["CLAUDE.md"].includes("docs/START_READINESS.md"), true);
  assert.equal(files[".cursor/rules/start.mdc"] !== undefined, true);
  assert.equal(files[".codex/instructions.md"], undefined);
  assert.equal(files[".agents/commands/verify.md"].includes("run verify"), true);
});

test("plan and readiness report expose ordered ownership and execution evidence", () => {
  const { plan } = defaultConfig();
  const markdown = renderPlanMarkdown(plan);
  const report = renderReadinessReport({
    plan,
    executed: ["official-shadcn-init", "start-quality"],
    skipped: ["start-ci"],
    conflicts: ["capability-storage: preserved existing adapter"],
    resolvedVersions: { next: "16.3.1", typescript: "5.9.2" },
    verification: { command: plan.verification.command, status: "passed", details: "All selected checks completed." },
  });

  assert.match(markdown, /1\. Initialize the official shadcn template/);
  assert.match(markdown, /Historical generation record/);
  assert.match(markdown, /Skill install commands/);
  assert.match(markdown, /--agent codex --yes/);
  assert.match(markdown, /Await a PRD/);
  assert.match(report, /official-shadcn-init/);
  assert.match(report, /Status: passed/);
  assert.match(report, /next/);
  assert.match(report, /Await a PRD/);
});
