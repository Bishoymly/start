import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAgentKickoffPrompt,
  buildStarterCommand,
  createDefaultWizardState,
  decodeBlueprint,
  encodeBlueprint,
  isValidProjectName,
  isValidTargetDirectory,
  parseShadcnPresetInput,
  recomputeRecommendations,
  resolveStarterConfig,
  setUserDecision,
  useRecommendation,
  validateWizardState,
} from "./core.js";
import { getBundledDesignReference } from "./design.js";

function readyState() {
  const state = createDefaultWizardState();
  const design = getBundledDesignReference("stripe");
  state.designReference = { value: "stripe", source: "user" };
  state.designProvenance = design.source;
  return recomputeRecommendations(state).state;
}

test("v2 defaults form the modern lightweight baseline", () => {
  const state = createDefaultWizardState();
  assert.equal(state.version, 2);
  assert.equal(state.stage, "project");
  assert.deepEqual(state.packageManager, { value: "pnpm", source: "recommended" });
  assert.deepEqual(state.tooling, { value: "biome", source: "recommended" });
  assert.deepEqual(state.uiFoundation, { value: "base-ui", source: "recommended" });
  assert.equal(state.shadcnPreset.value.code, "b0");
  assert.equal(state.startingSurface.value, "minimal");
  assert.equal(state.ciEnabled.value, true);
  assert.equal(state.vitest.value, true);
  assert.equal(state.playwright.value, true);
  assert.equal(state.opentelemetry.value, true);
  assert.equal(state.sentry.value, false);
});

test("a design reference is optional", () => {
  const state = createDefaultWizardState();
  assert.deepEqual(validateWizardState(state).errors, []);
  const config = resolveStarterConfig(state);
  assert.equal(config.designReference, null);
  assert.equal(config.designSource, null);
  assert.equal(config.themeAdapted, false);
  assert.equal(buildAgentKickoffPrompt(config).includes("DESIGN.md"), false);
  assert.deepEqual(decodeBlueprint(encodeBlueprint(config)), config);
});

test("design references still require matching provenance", () => {
  const state = createDefaultWizardState();
  state.designReference = { value: "stripe", source: "user" };
  assert.match(validateWizardState(state).errors.join(" "), /provenance/);
});

test("shadcn preset imports normalize codes, official URLs, and copied commands without executing them", () => {
  const direct = parseShadcnPresetInput("b0");
  const fromUrl = parseShadcnPresetInput("https://ui.shadcn.com/init?base=radix&preset=b0");
  const fromCommand = parseShadcnPresetInput("pnpm dlx shadcn@latest init --base base --preset b0 && touch never-executed");
  assert.deepEqual(fromUrl.preset, direct.preset);
  assert.equal(fromUrl.foundation, "radix-ui");
  assert.equal(fromCommand.foundation, "base-ui");
  assert.equal(fromCommand.preset.style, "nova");
  assert.throws(() => parseShadcnPresetInput("npx shadcn init; rm -rf app"), /No valid shadcn preset/);
  assert.throws(() => parseShadcnPresetInput("npx shadcn init --base aria --preset b0"), /unsupported shadcn foundation/);
});

test("starting surface and first task round-trip into a deterministic kickoff prompt", () => {
  let state = readyState();
  state = setUserDecision(state, "startingSurface", "sidebar").state;
  state = setUserDecision(state, "firstTask", "Build the project list empty state").state;
  const config = resolveStarterConfig(state);
  assert.equal(config.startingSurface, "sidebar");
  assert.match(buildAgentKickoffPrompt(config), /build the project list empty state/i);
  assert.match(buildAgentKickoffPrompt(config), /pnpm run verify/);
  assert.deepEqual(decodeBlueprint(encodeBlueprint(config)), config);
});

test("older v2 tokens hydrate the additive UI fields", () => {
  const current = resolveStarterConfig(readyState());
  const legacy = { ...current } as Partial<typeof current>;
  delete legacy.shadcnPreset;
  delete legacy.startingSurface;
  delete legacy.firstTask;
  const decoded = decodeBlueprint(encodeBlueprint(legacy as typeof current));
  assert.equal(decoded.shadcnPreset.code, "b0");
  assert.equal(decoded.startingSurface, "minimal");
  assert.equal(decoded.firstTask, "");
});

test("project names and target directories reject unsafe paths", () => {
  assert.equal(isValidProjectName("agent-console"), true);
  assert.equal(isValidProjectName("Agent Console"), false);
  assert.equal(isValidTargetDirectory("apps/web"), true);
  assert.equal(isValidTargetDirectory("."), true);
  assert.equal(isValidTargetDirectory("../outside"), false);
  assert.equal(isValidTargetDirectory("/tmp/app"), false);
  assert.equal(isValidTargetDirectory("apps\\web"), false);
  assert.equal(isValidTargetDirectory(".git/app"), false);
  assert.equal(isValidTargetDirectory("node_modules/app"), false);
  assert.equal(isValidTargetDirectory("CON/app"), false);
  assert.equal(isValidTargetDirectory("apps/web."), false);
  assert.equal(isValidTargetDirectory("apps/my app"), false);
});

test("project name updates a recommendation-controlled target folder", () => {
  let state = createDefaultWizardState();
  state = setUserDecision(state, "projectName", "console").state;
  assert.deepEqual(state.targetDirectory, { value: "console", source: "recommended" });
  state = setUserDecision(state, "targetDirectory", "apps/web").state;
  state = setUserDecision(state, "projectName", "renamed").state;
  assert.deepEqual(state.targetDirectory, { value: "apps/web", source: "user" });
});

test("design recommendations update untouched theme and motion", () => {
  let state = readyState();
  assert.equal(state.uiFoundation.value, "base-ui");
  assert.equal(state.theme.value, "light");
  assert.equal(state.motion.value, "expressive");
  assert.equal(state.motion.source, "recommended");
  state.designReference = { value: null, source: "user" };
  state.designProvenance = null;
  state = recomputeRecommendations(state).state;
  assert.deepEqual(state.motion, { value: "subtle", source: "recommended" });
});

test("explicit theme and motion overrides survive design changes", () => {
  let state = readyState();
  state = setUserDecision(state, "theme", "dark").state;
  state = setUserDecision(state, "motion", "off").state;
  state = setUserDecision(state, "designReference", "spotify").state;
  assert.deepEqual(state.theme, { value: "dark", source: "user" });
  assert.deepEqual(state.motion, { value: "off", source: "user" });
  state = useRecommendation(state, "motion").state;
  assert.deepEqual(state.motion, { value: "expressive", source: "recommended" });
});

test("Better Auth recommends email auth, database, and Drizzle without overwriting user choices", () => {
  let state = readyState();
  state = setUserDecision(state, "hosting", "aws").state;
  state = setUserDecision(state, "databaseProvider", "aws-rds").state;
  state = setUserDecision(state, "authMethods", ["github", "microsoft"]).state;
  state = setUserDecision(state, "authentication", "better-auth").state;
  assert.equal(state.databaseRequired.value, true);
  assert.equal(state.databaseProvider.value, "aws-rds");
  assert.equal(state.orm.value, "drizzle");
  assert.deepEqual(state.authMethods, { value: ["github", "microsoft"], source: "user" });
});

test("Better Auth requires at least one method and a database", () => {
  let state = readyState();
  state = setUserDecision(state, "authentication", "better-auth").state;
  state = setUserDecision(state, "authMethods", []).state;
  assert.match(validateWizardState(state).errors.join(" "), /sign-in method/);
  state = setUserDecision(state, "databaseRequired", false).state;
  assert.match(validateWizardState(state).errors.join(" "), /requires a database/);
});

test("dormant database and host answers are restored", () => {
  let state = readyState();
  state = setUserDecision(state, "hosting", "cloudflare").state;
  state = setUserDecision(state, "storage", "r2").state;
  state = setUserDecision(state, "databaseRequired", true).state;
  state = setUserDecision(state, "databaseProvider", "neon").state;
  state = setUserDecision(state, "hosting", "aws").state;
  assert.deepEqual(state.storage, { value: "none", source: "recommended" });
  state = setUserDecision(state, "hosting", "cloudflare").state;
  assert.deepEqual(state.storage, { value: "r2", source: "user" });
  assert.deepEqual(state.databaseProvider, { value: "neon", source: "user" });
});

test("delivery selections normalize into active arrays", () => {
  let state = readyState();
  state = setUserDecision(state, "ciEnabled", false).state;
  state = setUserDecision(state, "vitest", false).state;
  state = setUserDecision(state, "playwright", true).state;
  state = setUserDecision(state, "opentelemetry", false).state;
  state = setUserDecision(state, "sentry", true).state;
  const config = resolveStarterConfig(state);
  assert.equal(config.ciEnabled, false);
  assert.deepEqual(config.testing, ["playwright"]);
  assert.deepEqual(config.observability, ["sentry"]);
});

test("mixed cloud remains a warning", () => {
  let state = readyState();
  state = setUserDecision(state, "hosting", "aws").state;
  state = setUserDecision(state, "storage", "s3").state;
  state = setUserDecision(state, "aiProviders", ["vertex"]).state;
  assert.equal(validateWizardState(state).warnings.length, 1);
});

test("v2 blueprints round-trip and omit inactive auth and database choices", () => {
  const state = readyState();
  const config = resolveStarterConfig(state);
  assert.equal(config.version, 2);
  assert.equal(config.databaseProvider, undefined);
  assert.deepEqual(config.authMethods, []);
  assert.deepEqual(decodeBlueprint(encodeBlueprint(config)), config);
});

test("v1, malformed, and oversized blueprint tokens are rejected explicitly", () => {
  assert.throws(() => decodeBlueprint("v1.nope"), /v1 is no longer supported/);
  assert.throws(() => decodeBlueprint("v2.nope"), /malformed/);
  assert.throws(() => decodeBlueprint(`v2.${"x".repeat(32_001)}`), /oversized/);
});

test("generation command follows the selected package manager and target folder", () => {
  const launchers = { pnpm: "pnpm dlx", bun: "bunx", yarn: "yarn dlx", npm: "npx" } as const;
  for (const packageManager of Object.keys(launchers) as (keyof typeof launchers)[]) {
    const launcher = launchers[packageManager];
    let state = readyState();
    state = setUserDecision(state, "packageManager", packageManager).state;
    state = setUserDecision(state, "targetDirectory", "apps/web").state;
    const command = buildStarterCommand(resolveStarterConfig(state));
    assert.equal(command.startsWith(`${launcher} @bishoymly/start@latest apps/web --blueprint v2.`), true);
  }
});
