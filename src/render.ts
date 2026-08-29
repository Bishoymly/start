import { type AgentId, type ExecutionPlanV3, type StarterConfigV3 } from "./core.js";

export const START_VERSION = "0.5.0";

export type StartToolingManifest = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type ReadinessVerification = {
  command: string;
  status: "pending" | "passed" | "failed";
  details?: string;
};

export type RenderReadinessReportArgs = {
  plan: ExecutionPlanV3;
  executed: readonly string[];
  skipped: readonly string[];
  conflicts?: readonly string[];
  resolvedVersions?: Readonly<Record<string, string>>;
  verification?: ReadinessVerification;
  warnings?: readonly string[];
};

const packageCommands = {
  npm: (script: string) => `npm run ${script}`,
  pnpm: (script: string) => `pnpm run ${script}`,
  yarn: (script: string) => `yarn ${script}`,
  bun: (script: string) => `bun run ${script}`,
} as const;

function run(config: StarterConfigV3, script: string): string {
  return packageCommands[config.packageManager](script);
}

function packageLauncher(config: StarterConfigV3, executable: string): string {
  if (config.packageManager === "npm") return `npx ${executable}`;
  if (config.packageManager === "pnpm") return `pnpm exec ${executable}`;
  if (config.packageManager === "yarn") return `yarn exec ${executable}`;
  return `bunx ${executable}`;
}

function addDependency(target: Record<string, string>, name: string, version: string) {
  target[name] = version;
}

/** Internal renderer/executor handshake; merge this into, never over, upstream package.json. */
export function createStartToolingManifest(config: StarterConfigV3): StartToolingManifest {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = { "@types/node": "^24.5.0", typescript: "^5.9.2" };
  const scripts: Record<string, string> = { typecheck: "tsc --noEmit" };

  if (config.tooling === "biome") {
    addDependency(devDependencies, "@biomejs/biome", "^2.2.4");
    Object.assign(scripts, { lint: "biome lint .", "lint:fix": "biome lint --write .", format: "biome format --write .", "format:check": "biome format ." });
  } else {
    Object.assign(devDependencies, { eslint: "^9.39.5", "eslint-config-next": "^16.3.1", "eslint-config-prettier": "^10.1.8", prettier: "^3.6.2" });
    Object.assign(scripts, { lint: "eslint .", "lint:fix": "eslint . --fix", format: "prettier --write .", "format:check": "prettier --check ." });
  }
  if (config.testing.includes("vitest")) {
    addDependency(devDependencies, "vitest", "^3.2.4");
    Object.assign(scripts, { test: "vitest run", "test:watch": "vitest" });
  }
  if (config.testing.includes("playwright")) {
    addDependency(devDependencies, "@playwright/test", "^1.55.0");
    Object.assign(scripts, { "test:e2e:install": "playwright install chromium", "test:e2e": "playwright test" });
  }
  if (config.databaseRequired && config.orm === "drizzle") {
    addDependency(dependencies, "drizzle-orm", "^0.45.2");
    addDependency(devDependencies, "drizzle-kit", "^0.31.4");
    addDependency(devDependencies, "dotenv", "^17.2.2");
    if (config.databaseProvider === "neon") addDependency(dependencies, "@neondatabase/serverless", "^1.0.2");
    else { addDependency(dependencies, "pg", "^8.16.3"); addDependency(devDependencies, "@types/pg", "^8.15.5"); }
    Object.assign(scripts, { "db:generate": "drizzle-kit generate", "db:migrate": "drizzle-kit migrate" });
  }
  if (config.databaseRequired && config.orm === "prisma") {
    addDependency(dependencies, "@prisma/client", "^7.1.0");
    addDependency(devDependencies, "prisma", "^7.1.0");
    addDependency(devDependencies, "dotenv", "^17.2.2");
    Object.assign(scripts, { "db:generate": "prisma generate", "db:migrate": "prisma migrate dev" });
  }
  if (config.authentication === "better-auth") addDependency(dependencies, "better-auth", "^1.7.0");

  const storageDependencies: Partial<Record<StarterConfigV3["storage"], [string, string]>> = {
    "vercel-blob": ["@vercel/blob", "^2.0.0"], s3: ["@aws-sdk/client-s3", "^3.890.0"], r2: ["@aws-sdk/client-s3", "^3.890.0"], "azure-blob": ["@azure/storage-blob", "^12.28.0"], gcs: ["@google-cloud/storage", "^7.17.0"], "supabase-storage": ["@supabase/supabase-js", "^2.57.0"],
  };
  const storage = storageDependencies[config.storage];
  if (storage) addDependency(dependencies, storage[0], storage[1]);
  const aiDependencies: Partial<Record<StarterConfigV3["aiProviders"][number], [string, string]>> = {
    openai: ["@ai-sdk/openai", "^2.0.0"], anthropic: ["@ai-sdk/anthropic", "^2.0.0"], google: ["@ai-sdk/google", "^2.0.0"], "azure-openai": ["@ai-sdk/azure", "^2.0.0"], bedrock: ["@ai-sdk/amazon-bedrock", "^2.0.0"], vertex: ["@ai-sdk/google-vertex", "^2.0.0"], "vercel-ai-gateway": ["@ai-sdk/gateway", "^2.0.0"],
  };
  for (const provider of config.aiProviders) {
    addDependency(dependencies, "ai", "^5.0.0");
    const dependency = aiDependencies[provider];
    if (dependency) addDependency(dependencies, dependency[0], dependency[1]);
  }
  if (config.observability.includes("opentelemetry")) addDependency(dependencies, "@vercel/otel", "^1.13.0");
  if (config.observability.includes("sentry")) addDependency(dependencies, "@sentry/nextjs", "^10.10.0");

  const verify = [run(config, "format:check"), run(config, "lint"), run(config, "typecheck")];
  if (config.testing.includes("vitest")) verify.push(run(config, "test"));
  if (config.testing.includes("playwright")) verify.push(run(config, "test:e2e"));
  verify.push(run(config, "build"));
  scripts.verify = verify.join(" && ");
  return { scripts, dependencies, devDependencies };
}

function renderAgents(config: StarterConfigV3): string {
  return `# Repository instructions

This repository is ready for product work but has no product requirements yet. Await a PRD, accepted requirements, or an explicit user task before creating product pages, routes, entities, dashboards, upload flows, chat flows, or sample data.

## Delivery loop

1. Read \`START_READINESS.md\` and the relevant requirement before editing.
2. Keep provider integrations behind narrow server-side adapters.
3. Make the smallest coherent change and add focused tests.
4. Run \`${run(config, "verify")}\` before shipping.
5. Report commands, results, and remaining risks.

## Safety rules

- Do not expose secrets in client code, commits, logs, or browser bundles.
- Check authorization at every protected server-side boundary; redirects are not authorization.
- Ask before destructive changes, production mutations, or external messages.
- Preserve the official shadcn-generated app, styles, components, fonts, and preset output unless a requirement explicitly changes them.
`;
}

function renderNativeAgentEntryPoints(config: StarterConfigV3): Record<string, string> {
  const body = `Read /AGENTS.md and /START_READINESS.md before editing. Await a PRD or explicit requirements before product work. Run ${run(config, "verify")} before shipping.\n`;
  const files: Partial<Record<AgentId, { path: string; content: string }>> = {
    codex: { path: ".codex/instructions.md", content: body }, "claude-code": { path: "CLAUDE.md", content: body }, cursor: { path: ".cursor/rules/start.mdc", content: `---\ndescription: Start readiness contract\nalwaysApply: true\n---\n${body}` }, "github-copilot": { path: ".github/copilot-instructions.md", content: body }, "gemini-cli": { path: "GEMINI.md", content: body }, opencode: { path: "opencode.json", content: `${JSON.stringify({ instructions: ["AGENTS.md", "START_READINESS.md"] }, null, 2)}\n` }, windsurf: { path: ".windsurf/rules/start.md", content: body }, "grok-build": { path: ".grok/instructions.md", content: body },
  };
  return Object.fromEntries([config.primaryAgent, ...config.additionalAgents].map((agent) => {
    const file = files[agent];
    if (!file) throw new Error(`No native agent entry point for ${agent}.`);
    return [file.path, file.content];
  }));
}

function renderWorkflows(config: StarterConfigV3): Record<string, string> {
  const requirements = "Await a PRD, accepted requirements, or an explicit user task before creating product behavior.";
  return {
    ".agents/commands/implement.md": `# Implement\n\n${requirements}\n\nRead AGENTS.md and START_READINESS.md, identify the smallest requirement-backed vertical slice, then implement and test it. Preserve unselected provider boundaries.\n`,
    ".agents/commands/verify.md": `# Verify\n\nRun \`${run(config, "verify")}\`. If browser verification is selected, inspect the running application in a real browser. Report exact commands and outcomes.\n`,
    ".agents/commands/review.md": "# Review\n\nReview the current diff for correctness, security, accessibility, provider leakage, missing tests, and unintended changes to official shadcn output. Cite actionable findings with file and line.\n",
    ".agents/commands/ship-check.md": `# Ship check\n\n${requirements}\n\nConfirm requirements, environment variables, migrations, CI, and \`${run(config, "verify")}\` are complete before shipping.\n`,
  };
}

function renderEnvironmentExample(plan: ExecutionPlanV3): string {
  if (!plan.environment.length) return "# No environment variables are required by the selected Start configuration.\n";
  return ["# Copy to .env.local. Never commit real secrets.", ...plan.environment.flatMap((entry) => ["", `# ${entry.purpose}${entry.required ? "" : " Optional."}`, `${entry.name}=`])].join("\n") + "\n";
}

function renderEnvironmentDocumentation(plan: ExecutionPlanV3): string {
  const variables = plan.environment.length ? `| Variable | Required | Capability | Purpose |\n| --- | --- | --- | --- |\n${plan.environment.map((entry) => `| \`${entry.name}\` | ${entry.required ? "Yes" : "No"} | ${entry.capability} | ${entry.purpose} |`).join("\n")}` : "No environment variables are required by the selected configuration.";
  return `# Environment contract\n\n${variables}\n\nAdd values locally in \`.env.local\`; do not commit secrets.\n`;
}

function renderQualityFiles(config: StarterConfigV3): Record<string, string> {
  const files: Record<string, string> = {
    "tsconfig.json": `${JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["dom", "dom.iterable", "esnext"], allowJs: false, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./*"] } }, include: ["next-env.d.ts", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.ts", "**/*.tsx"], exclude: ["node_modules"] }, null, 2)}\n`,
  };
  if (config.tooling === "biome") files["biome.json"] = `${JSON.stringify({ $schema: "https://biomejs.dev/schemas/2.2.4/schema.json", vcs: { enabled: true, clientKind: "git", useIgnoreFile: true }, files: { includes: ["**", "!!.next", "!!node_modules"] }, formatter: { enabled: true, indentStyle: "space" }, linter: { enabled: true, rules: { recommended: true } } }, null, 2)}\n`;
  else {
    files["eslint.config.mjs"] = "import { defineConfig, globalIgnores } from \"eslint/config\";\nimport nextVitals from \"eslint-config-next/core-web-vitals\";\nimport nextTypeScript from \"eslint-config-next/typescript\";\nimport prettier from \"eslint-config-prettier/flat\";\nexport default defineConfig([...nextVitals, ...nextTypeScript, prettier, globalIgnores([\".next/**\", \"node_modules/**\"])]);\n";
    files["prettier.config.mjs"] = "const config = { semi: true, singleQuote: false, trailingComma: \"all\" };\nexport default config;\n";
    files[".prettierignore"] = ".next\nnode_modules\nplaywright-report\ntest-results\n";
  }
  if (config.testing.includes("vitest")) {
    files["vitest.config.ts"] = "import { defineConfig } from \"vitest/config\";\nexport default defineConfig({ test: { environment: \"node\", include: [\"tests/**/*.test.ts\"] } });\n";
    files["tests/readiness.test.ts"] = "import assert from \"node:assert/strict\";\nimport { existsSync } from \"node:fs\";\nimport test from \"node:test\";\n\ntest(\"Start readiness documents exist\", () => {\n  assert.equal(existsSync(\"AGENTS.md\"), true);\n  assert.equal(existsSync(\"START_READINESS.md\"), true);\n});\n";
  }
  if (config.testing.includes("playwright")) {
    files["playwright.config.ts"] = `import { defineConfig, devices } from \"@playwright/test\";\nexport default defineConfig({ testDir: \"./tests/e2e\", webServer: { command: \"${packageLauncher(config, "next dev")} --port 3107\", url: \"http://127.0.0.1:3107\", reuseExistingServer: !process.env.CI }, use: { baseURL: \"http://127.0.0.1:3107\", trace: \"on-first-retry\" }, projects: [{ name: \"chromium\", use: { ...devices[\"Desktop Chrome\"] } }] });\n`;
    files["tests/e2e/readiness.spec.ts"] = "import { expect, test } from \"@playwright/test\";\n\ntest(\"official starter is reachable, responsive, and keyboard-safe\", async ({ page }) => {\n  await page.emulateMedia({ reducedMotion: \"reduce\" });\n  for (const viewport of [{ width: 320, height: 720 }, { width: 1440, height: 900 }]) {\n    await page.setViewportSize(viewport);\n    await page.goto(\"/\");\n    await expect(page.locator(\"body\")).toBeVisible();\n    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);\n  }\n  await page.keyboard.press(\"Tab\");\n  await expect.poll(() => page.evaluate(() => document.activeElement !== document.body)).toBe(true);\n});\n";
  }
  return files;
}

function renderCi(config: StarterConfigV3, plan: ExecutionPlanV3): Record<string, string> {
  if (!config.ciEnabled) return {};
  const install = config.packageManager === "npm" ? "npm ci" : `${config.packageManager} install --frozen-lockfile`;
  const browser = config.testing.includes("playwright") ? `\n      - run: ${packageLauncher(config, "playwright install")} --with-deps chromium` : "";
  if (config.ci === "github-actions") return { ".github/workflows/verify.yml": `name: Verify\non: [push, pull_request]\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: ${install}${browser}\n      - run: ${plan.verification.command}\n` };
  if (config.ci === "gitlab-ci") return { ".gitlab-ci.yml": `image: node:22\nverify:\n  script:\n    - ${install}\n    - ${plan.verification.command}\n` };
  return { "azure-pipelines.yml": `trigger:\n- main\npool:\n  vmImage: ubuntu-latest\nsteps:\n- task: NodeTool@0\n  inputs:\n    versionSpec: \"22.x\"\n- script: ${install}\n- script: ${plan.verification.command}\n` };
}

function renderCapabilityLayers(config: StarterConfigV3): Record<string, string> {
  const files: Record<string, string> = {};
  if (config.databaseRequired && config.orm === "drizzle") {
    files["lib/db/schema.ts"] = "// Start intentionally creates no product tables. Add domain tables only after requirements are accepted.\nexport {};\n";
    files["lib/db/client.ts"] = "import { drizzle } from \"drizzle-orm/node-postgres\";\nimport { Pool } from \"pg\";\n\nexport function createDatabaseClient() {\n  const url = process.env.DATABASE_URL;\n  if (!url) throw new Error(\"DATABASE_URL is required to create the database client.\");\n  return drizzle(new Pool({ connectionString: url }));\n}\n";
    files["drizzle/.gitkeep"] = "";
    files["drizzle.config.ts"] = "import \"dotenv/config\";\nimport { defineConfig } from \"drizzle-kit\";\nconst url = process.env.DATABASE_URL;\nif (!url) throw new Error(\"DATABASE_URL is required for Drizzle commands.\");\nexport default defineConfig({ schema: \"./lib/db/schema.ts\", out: \"./drizzle\", dialect: \"postgresql\", dbCredentials: { url } });\n";
  }
  if (config.databaseRequired && config.orm === "prisma") {
    files["prisma/schema.prisma"] = "generator client {\n  provider = \"prisma-client\"\n  output = \"../lib/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n}\n\n// Start intentionally creates no product models. Add domain models after requirements are accepted.\n";
    files["lib/db/client.ts"] = "import { PrismaClient } from \"@/lib/generated/prisma/client\";\n\nexport const db = new PrismaClient();\n";
    files["prisma/migrations/.gitkeep"] = "";
  }
  if (config.authentication === "better-auth") {
    files["lib/auth.ts"] = "import { betterAuth } from \"better-auth\";\n\n// Framework configuration only. Product authorization policies belong to requirement-backed server boundaries.\nexport const auth = betterAuth({ emailAndPassword: { enabled: true } });\n";
    files["lib/auth-session.ts"] = "import { auth } from \"@/lib/auth\";\n\nexport async function getSession(headers: Headers) {\n  return auth.api.getSession({ headers });\n}\n";
    files["app/api/auth/[...all]/route.ts"] = "import { auth } from \"@/lib/auth\";\nimport { toNextJsHandler } from \"better-auth/next-js\";\n\nexport const { GET, POST } = toNextJsHandler(auth);\n";
  }
  if (config.storage !== "none") files["lib/storage/index.ts"] = `export const storageProvider = \"${config.storage}\" as const;\n\n// Add requirement-backed upload and download policies here; Start creates no file routes or sample assets.\n`;
  if (config.aiProviders.length) files["lib/ai/providers.ts"] = `export const selectedAiProviders = ${JSON.stringify(config.aiProviders)} as const;\n\n// Add requirement-backed model calls here; Start creates no chat routes, prompts, or UI.\n`;
  if (config.observability.includes("opentelemetry")) files["instrumentation.ts"] = `import { registerOTel } from \"@vercel/otel\";\n\nexport function register() {\n  registerOTel({ serviceName: \"${config.projectName}\" });\n}\n`;
  if (config.observability.includes("sentry")) {
    files["sentry.server.config.ts"] = "import * as Sentry from \"@sentry/nextjs\";\n\nSentry.init({ dsn: process.env.SENTRY_DSN });\n";
    files["sentry.edge.config.ts"] = "import * as Sentry from \"@sentry/nextjs\";\n\nSentry.init({ dsn: process.env.SENTRY_DSN });\n";
  }
  return files;
}

/** Render only Start-owned, durable files. Official shadcn UI output is never rendered here. */
export function renderStartOwnedFiles(config: StarterConfigV3, plan: ExecutionPlanV3): Record<string, string> {
  if (plan.version !== 3 || plan.blueprint.length === 0) throw new Error("A v3 execution plan is required.");
  return {
    "AGENTS.md": renderAgents(config), "START_PLAN.md": renderPlanMarkdown(plan), "START_ENVIRONMENT.md": renderEnvironmentDocumentation(plan), ".env.example": renderEnvironmentExample(plan),
    "START_READINESS.md": renderReadinessReport({ plan, executed: [], skipped: [], verification: { command: plan.verification.command, status: "pending", details: "Generation has not yet run verification." } }),
    "start-tooling.json": `${JSON.stringify(createStartToolingManifest(config), null, 2)}\n`,
    ...renderWorkflows(config), ...renderNativeAgentEntryPoints(config), ...renderQualityFiles(config), ...renderCi(config, plan), ...renderCapabilityLayers(config),
  };
}

export function renderAgentEntryPoints(config: StarterConfigV3): Record<string, string> {
  return { "AGENTS.md": renderAgents(config), ...renderWorkflows(config), ...renderNativeAgentEntryPoints(config) };
}

export function renderPlanMarkdown(plan: ExecutionPlanV3): string {
  const steps = plan.steps.map((step, index) => {
    const command = step.command ? `\n\nCommand: \`${step.command.command}\`` : "";
    const capabilities = step.capabilities?.length ? `\n\nCapabilities: ${step.capabilities.map((capability) => `\`${capability}\``).join(", ")}` : "";
    return `### ${index + 1}. ${step.title}\n\n- ID: \`${step.id}\`\n- Owner: ${step.owner}\n- Type: ${step.kind}\n- ${step.description}${command}${capabilities}`;
  }).join("\n\n");
  const environment = plan.environment.length ? plan.environment.map((entry) => `- \`${entry.name}\` (${entry.required ? "required" : "optional"}; ${entry.capability}) — ${entry.purpose}`).join("\n") : "- No environment variables are required.";
  const capabilities = plan.capabilities.length ? plan.capabilities.map((capability) => `- \`${capability.id}\` (${capability.status}) — ${capability.description}`).join("\n") : "- No optional capabilities are selected.";
  return `# Start execution plan\n\nBlueprint: \`${plan.blueprint}\`\n\n## Ordered steps\n\n${steps}\n\n## Project skills\n\n${plan.skills.map((skill) => `- \`${skill.id}\` from ${skill.source}; expected: ${skill.expectedPaths.map((path) => `\`${path}\``).join(", ")}`).join("\n")}\n\n## Environment\n\n${environment}\n\n## Capability contracts\n\n${capabilities}\n\n## Verification\n\nRun \`${plan.verification.command}\`. This repository must await a PRD, accepted requirements, or an explicit user task before product work.\n\n## Warnings\n\n${plan.warnings.map((warning) => `- ${warning}`).join("\n")}\n`;
}

export function renderReadinessReport(args: RenderReadinessReportArgs): string {
  const versions = Object.entries(args.resolvedVersions ?? {});
  const verification = args.verification ?? { command: args.plan.verification.command, status: "pending" as const };
  const list = (items: readonly string[]) => items.length ? items.map((item) => `- \`${item}\``).join("\n") : "- None";
  return `# Start readiness report\n\nGenerated by @bishoymly/start v${START_VERSION}.\n\n## Executed steps\n\n${list(args.executed)}\n\n## Skipped steps\n\n${list(args.skipped)}\n\n## Conflicts\n\n${list(args.conflicts ?? [])}\n\n## Warnings\n\n${list(args.warnings ?? [])}\n\n## Resolved versions\n\n${versions.length ? versions.map(([name, version]) => `- \`${name}\`: ${version}`).join("\n") : "- Not recorded yet"}\n\n## Verification\n\n- Command: \`${verification.command}\`\n- Status: ${verification.status}${verification.details ? `\n- Details: ${verification.details}` : ""}\n\n## Next action\n\nRepository readiness is infrastructure only. Await a PRD, accepted requirements, or an explicit user task before adding product pages, routes, entities, dashboards, uploads, chats, navigation, or sample data.\n`;
}
