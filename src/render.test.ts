import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultWizardState, parseShadcnPresetInput, recomputeRecommendations, resolveStarterConfig, setUserDecision, type WizardStateV2 } from "./core.js";
import { getBundledDesignReference } from "./design.js";
import { createPackageManifest, environmentVariables, renderAgents, renderBlueprint, renderReadme, renderWorkflows, renderWorkspaceFiles } from "./render.js";

function readyState(): WizardStateV2 {
  const state = createDefaultWizardState();
  const design = getBundledDesignReference("linear");
  state.designReference = { value: "linear", source: "user" };
  state.designProvenance = design.source;
  return recomputeRecommendations(state).state;
}

test("default workspace includes the modern baseline without service leakage", () => {
  const config = resolveStarterConfig(readyState());
  const files = renderWorkspaceFiles(config);
  const manifest = createPackageManifest(config);
  assert.equal(manifest.packageManager.startsWith("pnpm@"), true);
  assert.equal(files["biome.json"] !== undefined, true);
  assert.equal(files["vitest.config.ts"] !== undefined, true);
  assert.equal(files["playwright.config.ts"] !== undefined, true);
  assert.equal(files["instrumentation.ts"] !== undefined, true);
  assert.equal(files["components.json"].includes('"base": "base-ui"'), true);
  assert.equal(files["components.json"].includes('"style": "nova"'), true);
  assert.equal(files["app/page.tsx"].includes("Primary action"), true);
  assert.equal(files["components/ui/card.tsx"] !== undefined, true);
  assert.equal(files["vitest.config.ts"].includes('include: ["tests/**/*.test.{ts,tsx}"]'), true);
  assert.equal(files["playwright.config.ts"].includes("pnpm exec next dev --port 3107"), true);
  assert.equal(manifest.scripts["test:e2e:install"], "playwright install chromium");
  assert.equal(files["tsconfig.json"].includes('".next/dev/types/**/*.ts"'), true);
  assert.equal(files["lib/auth.ts"], undefined);
  assert.equal(files["drizzle.config.ts"], undefined);
  assert.equal(manifest.dependencies["better-auth"], undefined);
  assert.deepEqual(environmentVariables(config).map((item) => item.name), ["OTEL_EXPORTER_OTLP_ENDPOINT"]);
});

test("generated guidance omits DESIGN.md when no reference is selected", () => {
  const config = resolveStarterConfig(createDefaultWizardState());
  assert.match(renderBlueprint(config), /Design reference: None/);
  assert.equal(renderAgents(config).includes("DESIGN.md"), false);
  assert.equal(renderReadme(config).includes("DESIGN.md"), false);
  assert.equal(renderWorkflows(config)["implement-blueprint"].includes("DESIGN.md"), false);
  assert.equal(renderWorkspaceFiles(config)["app/page.tsx"].includes("DESIGN.md"), false);
});

test("imported preset tokens and starting surfaces affect the generated workspace", () => {
  let state = readyState();
  state = setUserDecision(state, "startingSurface", "sidebar").state;
  state = setUserDecision(state, "shadcnPreset", parseShadcnPresetInput("b1PziS").preset).state;
  const config = resolveStarterConfig(state);
  const files = renderWorkspaceFiles(config);
  assert.equal(files["app/page.tsx"].includes("md:grid-cols-[15rem_1fr]"), true);
  assert.equal(files["app/globals.css"].includes("--radius: 1rem"), true);
  assert.equal(files["app/globals.css"].includes("oklch(0.58 0.19 255)"), true);
  assert.equal(files["README.md"].includes("Starting surface: sidebar"), true);
});

test("single-weight preset fonts receive the required Next.js font options", () => {
  let state = readyState();
  state = setUserDecision(state, "shadcnPreset", parseShadcnPresetInput("b8NWuUviRk").preset).state;
  const layout = renderWorkspaceFiles(resolveStarterConfig(state))["app/layout.tsx"];
  assert.equal(layout.includes('import { Instrument_Serif, Geist_Mono } from "next/font/google"'), true);
  assert.equal(layout.match(/weight: "400"/g)?.length, 2);
});

test("Drizzle and every Better Auth method produce protected auth scaffolding", () => {
  let state = readyState();
  state = setUserDecision(state, "authentication", "better-auth").state;
  state = setUserDecision(state, "authMethods", ["email-password", "github", "google", "microsoft"]).state;
  const config = resolveStarterConfig(state);
  const files = renderWorkspaceFiles(config);
  const manifest = createPackageManifest(config);
  assert.equal(files["lib/db/schema.ts"].includes("verification"), true);
  assert.equal(files["lib/auth-session.ts"].includes("requireSession"), true);
  assert.equal(files["proxy.ts"].includes("getSessionCookie"), true);
  assert.equal(files["components/auth/sign-out-button.tsx"].includes("authClient.signOut"), true);
  assert.equal(files["app/dashboard/page.tsx"].includes("SignOutButton"), true);
  assert.equal(files["app/sign-up/page.tsx"] !== undefined, true);
  assert.equal(manifest.dependencies["drizzle-orm"] !== undefined, true);
  const env = environmentVariables(config).map((item) => item.name);
  assert.deepEqual(env.slice(0, 4), ["DATABASE_URL", "DIRECT_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]);
  assert.equal(env.includes("GITHUB_CLIENT_SECRET"), true);
  assert.equal(env.includes("GOOGLE_CLIENT_SECRET"), true);
  assert.equal(env.includes("MICROSOFT_CLIENT_SECRET"), true);
});

test("Prisma with ESLint and Prettier emits its own connection and tooling path", () => {
  let state = readyState();
  state = setUserDecision(state, "databaseRequired", true).state;
  state = setUserDecision(state, "orm", "prisma").state;
  state = setUserDecision(state, "tooling", "eslint-prettier").state;
  const config = resolveStarterConfig(state);
  const files = renderWorkspaceFiles(config);
  const manifest = createPackageManifest(config);
  assert.equal(files["prisma/schema.prisma"] !== undefined, true);
  assert.equal(files["lib/db.ts"] !== undefined, true);
  assert.equal(files["prisma.config.ts"].includes("...(connectionUrl ?"), true);
  assert.equal(files["eslint.config.mjs"] !== undefined, true);
  assert.equal(files["prettier.config.mjs"] !== undefined, true);
  assert.equal(files[".prettierignore"].includes("DESIGN.md"), true);
  assert.equal(files["biome.json"], undefined);
  assert.equal(manifest.dependencies["@prisma/client"] !== undefined, true);
  assert.equal(manifest.dependencies["@better-auth/prisma-adapter"], undefined);
  assert.equal(manifest.scripts.postinstall, "prisma generate");
  assert.equal(manifest.devDependencies.typescript, "6.0.3");
});

test("minimal delivery config removes optional files, packages, and scripts", () => {
  let state = readyState();
  state = setUserDecision(state, "ciEnabled", false).state;
  state = setUserDecision(state, "vitest", false).state;
  state = setUserDecision(state, "playwright", false).state;
  state = setUserDecision(state, "opentelemetry", false).state;
  const config = resolveStarterConfig(state);
  const files = renderWorkspaceFiles(config);
  const manifest = createPackageManifest(config);
  assert.equal(files[".github/workflows/verify.yml"], undefined);
  assert.equal(files["vitest.config.ts"], undefined);
  assert.equal(files["playwright.config.ts"], undefined);
  assert.equal(files["instrumentation.ts"], undefined);
  assert.equal(manifest.devDependencies.vitest, undefined);
  assert.equal(manifest.devDependencies["@playwright/test"], undefined);
  assert.equal(manifest.dependencies["@vercel/otel"], undefined);
  assert.equal(manifest.scripts.test, undefined);
  assert.equal(manifest.scripts["test:e2e"], undefined);
});

test("Sentry is additive and composes with OpenTelemetry instrumentation", () => {
  let state = readyState();
  state = setUserDecision(state, "sentry", true).state;
  const config = resolveStarterConfig(state);
  const files = renderWorkspaceFiles(config);
  const manifest = createPackageManifest(config);
  assert.equal(files["instrumentation.ts"].includes("registerOTel"), true);
  assert.equal(files["instrumentation.ts"].includes("captureRequestError"), true);
  assert.equal(files["instrumentation-client.ts"].includes("captureRouterTransitionStart"), true);
  assert.equal(files["sentry.server.config.ts"] !== undefined, true);
  assert.equal(files["sentry.edge.config.ts"] !== undefined, true);
  assert.equal(files["app/global-error.tsx"] !== undefined, true);
  assert.equal(files["next.config.ts"].includes("withSentryConfig"), true);
  assert.equal(manifest.dependencies["@sentry/nextjs"] !== undefined, true);
  assert.equal(environmentVariables(config).some((item) => item.name === "SENTRY_PROJECT"), true);
});
