import assert from "node:assert/strict";
import test from "node:test";
import { buildExecutionPlan, buildV3StarterCommand, createDefaultState, decodeV3Blueprint, encodeV3Blueprint, parseShadcnPresetInput, resolveV3Config, setV3UserDecision } from "./core.js";

test("v3 is the only public blueprint surface and has no product-shaping fields", () => {
  const state = createDefaultState();
  assert.equal(state.version, 3);
  assert.equal("startingSurface" in state, false);
  assert.equal("designReference" in state, false);
  assert.equal("firstTask" in state, false);
  const config = resolveV3Config(state);
  assert.equal("theme" in config, false);
  assert.throws(() => decodeV3Blueprint("v2.anything"), /v3 is required/);
});

test("shadcn presets are parsed and initialization is fully non-interactive", () => {
  assert.equal(parseShadcnPresetInput("npx shadcn@latest init --template next --base base --preset b0 --yes").foundation, "base-ui");
  const plan = buildExecutionPlan(resolveV3Config(createDefaultState()));
  assert.equal(plan.steps[0]?.command?.command, "pnpm dlx shadcn@latest init --name my-app --template next --base base --preset b0 --no-monorepo --yes");
  assert.equal(plan.steps.some((step) => step.command?.command.includes("--force")), false);

  let npmState = createDefaultState();
  npmState = setV3UserDecision(npmState, "packageManager", "npm").state;
  const npmPlan = buildExecutionPlan(resolveV3Config(npmState));
  assert.match(npmPlan.steps[0]?.command?.command ?? "", /^npx --yes shadcn@latest init --name my-app /);
});

test("v3 blueprints and selected agent skills are deterministic", () => {
  let state = createDefaultState();
  state = setV3UserDecision(state, "additionalAgents", ["claude-code"]).state;
  const config = resolveV3Config(state);
  const token = encodeV3Blueprint(config);
  assert.deepEqual(decodeV3Blueprint(token), config);
  assert.match(buildV3StarterCommand(config), /--blueprint v3\./);
  const plan = buildExecutionPlan(config);
  assert.equal(plan.skills.some((skill) => skill.installCommand.includes("--agent codex claude-code") && skill.expectedPaths.some((path) => path.startsWith(".agents/skills/")) && skill.expectedPaths.some((path) => path.startsWith(".claude/skills/"))), true);
  assert.equal(plan.skills.some((skill) => skill.source === "vercel/next.js" && skill.id === "next-dev-loop"), true);
  assert.equal(plan.skills.some((skill) => skill.source === "vercel-labs/agent-browser" && skill.id === "agent-browser"), true);
  assert.equal(plan.skills.some((skill) => skill.id.includes("browser-verification")), false);
  assert.equal(plan.steps.some((step) => step.id === "install-dependencies"), true);
  assert.match(plan.steps.find((step) => step.id === "install-shadcn-components")?.command?.command ?? "", /shadcn@latest add --all --yes --overwrite/);
  assert.doesNotMatch(plan.steps.find((step) => step.id === "install-shadcn-components")?.command?.command ?? "", /--override/);
  assert.equal(plan.steps.find((step) => step.id === "install-dependencies")?.command?.command, "pnpm install --no-frozen-lockfile");
  assert.equal(plan.steps.some((step) => step.id === "install-browser"), true);
  assert.equal(plan.steps.some((step) => step.id === "record-readiness"), true);
  assert.equal(plan.steps.some((step) => step.id === "initialize-git"), true);
  assert.match(plan.steps.find((step) => step.id === "initialize-git")?.command?.command ?? "", /git commit -m "chore: initialize with Start"/);
});

test("project name is the app folder across state, blueprints, and commands", () => {
  let state = createDefaultState();
  state = setV3UserDecision(state, "projectName", "agent-console").state;
  state = setV3UserDecision(state, "targetDirectory", "apps/console").state;
  const config = resolveV3Config(state);

  assert.equal(config.targetDirectory, "agent-console");
  assert.equal(decodeV3Blueprint(encodeV3Blueprint(config)).targetDirectory, "agent-console");
  assert.match(buildV3StarterCommand(config), /^pnpm dlx @bishoymly\/start@latest agent-console /);
});
