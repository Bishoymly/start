import { type AgentId, type ExecutionPlanV3, type StarterConfigV3 } from "./core.js";

export const START_VERSION = "0.6.8";

export type StartToolingManifest = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  removeDevDependencies?: readonly string[];
  packageManager?: string;
  engines?: Record<string, string>;
  lintStaged?: Record<string, string>;
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
  const dependencies: Record<string, string> = { next: "16.3.3", react: "19.2.8", "react-dom": "19.2.8" };
  const devDependencies: Record<string, string> = { "@types/node": "24.13.3", typescript: "5.9.3", husky: "9.1.7", "lint-staged": "17.4.1" };
  const scripts: Record<string, string> = { typecheck: "tsc --noEmit", prepare: "husky" };
  const removeDevDependencies: string[] = [];

  if (config.tooling === "biome") {
    addDependency(devDependencies, "@biomejs/biome", "^2.5.11");
    // shadcn currently includes ESLint and Prettier. They are intentionally
    // removed for the selected Biome setup, so pnpm does not report an unused
    // deprecated ESLint package during the first install.
    removeDevDependencies.push("eslint", "eslint-config-next", "prettier", "prettier-plugin-tailwindcss");
    Object.assign(scripts, { lint: "biome lint .", "lint:fix": "biome lint --write .", format: "biome format --write .", "format:check": "biome format ." });
  } else {
    Object.assign(devDependencies, { eslint: "^9.39.5", "eslint-config-next": "^16.3.1", "eslint-config-prettier": "^10.1.8", prettier: "^3.6.2" });
    Object.assign(scripts, { lint: "eslint .", "lint:fix": "eslint . --fix", format: "prettier --write .", "format:check": "prettier --check ." });
  }
  if (config.testing.includes("vitest")) {
    addDependency(devDependencies, "vitest", "4.1.11");
    Object.assign(scripts, { test: "vitest run", "test:watch": "vitest" });
  }
  if (config.testing.includes("playwright")) {
    addDependency(devDependencies, "@playwright/test", "1.62.1");
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
  const packageManager = { pnpm: "pnpm@9.15.0", npm: "npm@11.4.2", yarn: "yarn@1.22.22", bun: "bun@1.4.0" }[config.packageManager];
  return { scripts, dependencies, devDependencies, removeDevDependencies, packageManager, engines: { node: ">=24.3.0 <25" }, lintStaged: { "*.{js,jsx,ts,tsx,json,css,md}": "biome check --write --no-errors-on-unmatched" } };
}

function renderAgents(config: StarterConfigV3): string {
  return `# Agent instructions

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in \`node_modules/next/dist/docs/\` before writing any Next.js code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Read [the development guide](docs/DEVELOPMENT.md), [agent workflows](docs/AGENT_WORKFLOWS.md), [hook policy](docs/HOOKS.md), and the current [readiness report](docs/START_READINESS.md) before editing. [START_PLAN.md](docs/START_PLAN.md) is a historical record of the completed Start generation, not a task list for you to repeat.

## Project structure

- \`app/\` contains App Router routes, layouts, route handlers, and route-local UI.
- \`components/ui/\` contains installed shadcn primitives; keep their conventions intact. Put product-specific reusable UI in \`components/\` outside that directory.
- \`lib/\` contains shared server-safe utilities and the selected capability adapters. Keep secrets and privileged access on the server.
- \`tests/\` contains Vitest and Playwright coverage. \`docs/\` is the durable project contract.

Prefer the installed shadcn components. When an accepted requirement calls for a larger composable pattern, use an official shadcn block as a starting point, then adapt it to the project; never add blocks or components speculatively.

## Verification

Run \`${run(config, "verify")}\` before shipping. It checks formatting, linting, TypeScript, the selected unit and browser tests, and the production build. Use the focused commands in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) while iterating, then finish with the full gate.

## Operating rules

1. **Think before coding.** Inspect the relevant code, tests, and requirement; surface a material ambiguity before making a consequential assumption.
2. **Simplicity first.** Choose the smallest requirement-backed design and avoid speculative layers, features, and abstractions.
3. **Surgical changes.** Keep the diff focused on the requested behavior; preserve the installed shadcn components and selected provider boundaries unless the requirement changes them.
4. **Goal-driven execution.** Define a checkable outcome, add or update focused tests, run \`${run(config, "verify")}\`, and report the exact result and remaining risk.

Never expose secrets in code, commits, logs, or browser bundles. Check authorization at protected server boundaries. Ask before destructive changes, production mutations, or external messages.
`;
}

function renderNativeAgentEntryPoints(config: StarterConfigV3): Record<string, string> {
  const body = `Read /AGENTS.md and /docs/START_READINESS.md before editing. Follow /docs/DEVELOPMENT.md and /docs/AGENT_WORKFLOWS.md. Run ${run(config, "verify")} before shipping.\n`;
  const files: Partial<Record<AgentId, { path: string; content: string }>> = {
    codex: { path: ".codex/instructions.md", content: body }, "claude-code": { path: "CLAUDE.md", content: body }, cursor: { path: ".cursor/rules/start.mdc", content: `---\ndescription: Start readiness contract\nalwaysApply: true\n---\n${body}` }, "github-copilot": { path: ".github/copilot-instructions.md", content: body }, "gemini-cli": { path: "GEMINI.md", content: body }, opencode: { path: "opencode.json", content: `${JSON.stringify({ instructions: ["AGENTS.md", "docs/START_READINESS.md", "docs/DEVELOPMENT.md"] }, null, 2)}\n` }, windsurf: { path: ".windsurf/rules/start.md", content: body }, "grok-build": { path: ".grok/instructions.md", content: body },
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
    ".agents/commands/implement.md": `# Implement\n\n${requirements}\n\nRead AGENTS.md and docs/START_READINESS.md, identify the smallest requirement-backed vertical slice, then implement and test it. Preserve unselected provider boundaries.\n`,
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

function renderProjectDocumentation(config: StarterConfigV3, plan: ExecutionPlanV3): Record<string, string> {
  const packageManager = config.packageManager;
  const command = (script: string) => run(config, script);
  const install = { npm: "npm install", pnpm: "pnpm install", yarn: "yarn install", bun: "bun install" }[packageManager];
  const hookCommand = packageLauncher(config, "lint-staged");
  const testCommandRows = [
    config.testing.includes("vitest") ? `| Unit tests | \`${command("test")}\` |` : null,
    config.testing.includes("playwright") ? `| Install Playwright Chromium | \`${command("test:e2e:install")}\` |\n| Playwright tests | \`${command("test:e2e")}\` |` : null,
  ].filter((row): row is string => row !== null).join("\n");
  const playwrightNote = config.testing.includes("playwright") ? `\n\nRun \`${command("test:e2e:install")}\` if Chromium is not installed.` : "";
  return {
    "README.md": `# ${config.projectName}\n\nA verified Next.js workspace generated by [Start](https://github.com/Bishoymly/start). The installed shadcn preset and all available shadcn UI components are ready for requirement-backed product work.\n\n## Quick start\n\n\`\`\`bash\n${install}\ncp .env.example .env.local\n${command("dev")}\n\`\`\`\n\nFill in only the values documented in [.env.example](./.env.example) and [the environment contract](./docs/START_ENVIRONMENT.md). Never commit \`.env.local\`. On PowerShell, use \`Copy-Item .env.example .env.local\` instead of \`cp\`. Open [http://localhost:3000](http://localhost:3000). Before changing the project, read [AGENTS.md](./AGENTS.md) and [the development guide](./docs/DEVELOPMENT.md).\n\n## Commands\n\n| Goal | Command |\n| --- | --- |\n| Start development | \`${command("dev")}\` |\n| Production build | \`${command("build")}\` |\n${testCommandRows}\n| Full local verification | \`${command("verify")}\` |\n\n## Documentation\n\n- [Development commands](./docs/DEVELOPMENT.md)\n- [Agent workflows and project skills](./docs/AGENT_WORKFLOWS.md)\n- [Git hooks](./docs/HOOKS.md)\n- [Execution plan](./docs/START_PLAN.md)\n- [Environment contract](./docs/START_ENVIRONMENT.md)\n- [Current readiness report](./docs/START_READINESS.md)\n`,
    "docs/DEVELOPMENT.md": `# Development\n\n## Required runtime\n\nUse Node 24.3.0 (see \`.nvmrc\`) and ${packageManager}. The exact package-manager version is recorded in \`package.json\`.\n\n## Commands\n\n| Goal | Command |\n| --- | --- |\n| Start development | \`${command("dev")}\` |\n| Production build | \`${command("build")}\` |\n| Format files | \`${command("format")}\` |\n| Lint | \`${command("lint")}\` |\n| Type-check | \`${command("typecheck")}\` |\n${testCommandRows}\n| Full local gate | \`${command("verify")}\` |${playwrightNote}\n\nCI runs the same \`${command("verify")}\` command.\n`,
    "docs/AGENT_WORKFLOWS.md": `# Agent workflows\n\nStart installs project-local skills for the selected agent in its native directory. The selected skills and expected paths are recorded in [START_PLAN.md](./START_PLAN.md).\n\nFor shared agent workflows, use:\n\n- \`.agents/commands/implement.md\` — make the smallest requirement-backed vertical slice.\n- \`.agents/commands/verify.md\` — run and report the verification gate.\n- \`.agents/commands/review.md\` — review the current diff for correctness, security, accessibility, and tests.\n- \`.agents/commands/ship-check.md\` — confirm readiness before shipping.\n\nEvery agent follows [AGENTS.md](../AGENTS.md): think before coding, keep work simple and surgical, and verify the stated goal.\n`,
    "docs/HOOKS.md": `# Hooks\n\nHusky activates the committed \`.husky/pre-commit\` hook when dependencies are installed. It runs \`${hookCommand}\`, which applies Biome checks and safe fixes to staged source, JSON, CSS, and Markdown files.\n\nUse \`${command("verify")}\` before pushing; the pre-commit hook is intentionally faster and does not replace the full test, browser, and production-build gate. To bypass a hook only for an intentional emergency commit, use \`git commit --no-verify\` and record why in the pull request.\n`,
  };
}

function renderQualityFiles(config: StarterConfigV3): Record<string, string> {
  const files: Record<string, string> = {
    "tsconfig.json": `${JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["dom", "dom.iterable", "esnext"], allowJs: false, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./*"] } }, include: ["next-env.d.ts", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.ts", "**/*.tsx"], exclude: ["node_modules"] }, null, 2)}\n`,
    "next.config.ts": "import type { NextConfig } from \"next\";\n\nconst nextConfig: NextConfig = {\n  allowedDevOrigins: [\"127.0.0.1\"],\n};\n\nexport default nextConfig;\n",
    ".nvmrc": "24.3.0\n",
    ".husky/pre-commit": `#!/usr/bin/env sh\n${packageLauncher(config, "lint-staged")}\n`,
  };
  if (config.tooling === "biome") files["biome.json"] = `${JSON.stringify({ $schema: "https://biomejs.dev/schemas/2.5.11/schema.json", vcs: { enabled: true, clientKind: "git", useIgnoreFile: true }, files: { includes: ["**", "!!.next", "!!node_modules", "!!test-results", "!!playwright-report", "!!tsconfig.json"] }, formatter: { enabled: true, indentStyle: "space" }, linter: { enabled: true, rules: { preset: "recommended" } }, overrides: [{ includes: ["components/ui/**"], linter: { enabled: false } }], css: { parser: { tailwindDirectives: true } } }, null, 2)}\n`;
  else {
    files["eslint.config.mjs"] = "import { defineConfig, globalIgnores } from \"eslint/config\";\nimport nextVitals from \"eslint-config-next/core-web-vitals\";\nimport nextTypeScript from \"eslint-config-next/typescript\";\nimport prettier from \"eslint-config-prettier/flat\";\nexport default defineConfig([...nextVitals, ...nextTypeScript, prettier, globalIgnores([\".next/**\", \"node_modules/**\"])]);\n";
    files["prettier.config.mjs"] = "const config = { semi: true, singleQuote: false, trailingComma: \"all\" };\nexport default config;\n";
    files[".prettierignore"] = ".next\nnode_modules\nplaywright-report\ntest-results\n";
  }
  if (config.testing.includes("vitest")) {
    files["vitest.config.ts"] = "import { defineConfig } from \"vitest/config\";\nexport default defineConfig({ test: { environment: \"node\", include: [\"tests/**/*.test.ts\"] } });\n";
    files["tests/readiness.test.ts"] = "import { existsSync } from \"node:fs\";\nimport { expect, test } from \"vitest\";\n\ntest(\"Start project contracts exist before verification\", () => {\n  expect(existsSync(\"AGENTS.md\")).toBe(true);\n  expect(existsSync(\"docs/START_PLAN.md\")).toBe(true);\n});\n";
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
  const setup = config.packageManager === "pnpm"
    ? "      - uses: pnpm/action-setup@v4\n        with:\n          version: 9.15.0\n      - uses: actions/setup-node@v5\n        with:\n          node-version: 24.3.0\n          cache: pnpm"
    : "      - uses: actions/setup-node@v5\n        with:\n          node-version: 24.3.0";
  if (config.ci === "github-actions") return { ".github/workflows/verify.yml": `name: Verify\non: [push, pull_request]\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v5\n${setup}\n      - run: ${install}${browser}\n      - run: ${plan.verification.command}\n` };
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
    "AGENTS.md": renderAgents(config), "docs/START_PLAN.md": renderPlanMarkdown(plan), "docs/START_ENVIRONMENT.md": renderEnvironmentDocumentation(plan), ".env.example": renderEnvironmentExample(plan),
    "docs/START_READINESS.md": renderReadinessReport({ plan, executed: [], skipped: [], verification: { command: plan.verification.command, status: "pending", details: "Generation has not yet run verification." } }),
    "start-tooling.json": `${JSON.stringify(createStartToolingManifest(config), null, 2)}\n`,
    ...renderProjectDocumentation(config, plan), ...renderWorkflows(config), ...renderNativeAgentEntryPoints(config), ...renderQualityFiles(config), ...renderCi(config, plan), ...renderCapabilityLayers(config),
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
  return `# Start execution plan\n\nBlueprint: \`${plan.blueprint}\`\n\n> Historical generation record: Start completed these steps when this repository was created. Do not rerun them unless an explicit maintenance task calls for it; use [START_READINESS.md](./START_READINESS.md) to see the current state.\n\n## Ordered steps\n\n${steps}\n\n## Project skills\n\n${plan.skills.map((skill) => `- \`${skill.id}\` from ${skill.source}, installed for ${skill.agents.map((agent) => `\`${agent}\``).join(", ")}; expected: ${skill.expectedPaths.map((path) => `\`${path}\``).join(", ")}`).join("\n")}\n\n## Skill install commands\n\n${plan.skills.map((skill) => `\`$ ${skill.installCommand}\``).join("\n\n")}\n\n## Environment\n\n${environment}\n\n## Capability contracts\n\n${capabilities}\n\n## Verification\n\nRun \`${plan.verification.command}\`. This repository must await a PRD, accepted requirements, or an explicit user task before product work.\n\n## Warnings\n\n${plan.warnings.map((warning) => `- ${warning}`).join("\n")}\n`;
}

export function renderReadinessReport(args: RenderReadinessReportArgs): string {
  const versions = Object.entries(args.resolvedVersions ?? {});
  const verification = args.verification ?? { command: args.plan.verification.command, status: "pending" as const };
  const list = (items: readonly string[]) => items.length ? items.map((item) => `- \`${item}\``).join("\n") : "- None";
  return `# Start readiness report\n\nGenerated by @bishoymly/start v${START_VERSION}.\n\n## Executed steps\n\n${list(args.executed)}\n\n## Skipped steps\n\n${list(args.skipped)}\n\n## Conflicts\n\n${list(args.conflicts ?? [])}\n\n## Warnings\n\n${list(args.warnings ?? [])}\n\n## Resolved versions\n\n${versions.length ? versions.map(([name, version]) => `- \`${name}\`: ${version}`).join("\n") : "- Not recorded yet"}\n\n## Verification\n\n- Command: \`${verification.command}\`\n- Status: ${verification.status}${verification.details ? `\n- Details: ${verification.details}` : ""}\n\n## Next action\n\nRepository readiness is infrastructure only. Await a PRD, accepted requirements, or an explicit user task before adding product pages, routes, entities, dashboards, uploads, chats, navigation, or sample data.\n`;
}
