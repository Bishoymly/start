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

test("shadcn presets are parsed but the plan uses only documented init flags", () => {
  assert.equal(parseShadcnPresetInput("npx shadcn@latest init --template next --base base --preset b0 --yes").foundation, "base-ui");
  const plan = buildExecutionPlan(resolveV3Config(createDefaultState()));
  assert.equal(plan.steps[0]?.command?.command, "pnpm dlx shadcn@latest init --template next --base base --preset b0 --yes");
  assert.equal(plan.steps.some((step) => step.command?.command.includes("--force")), false);
});

test("v3 blueprints and selected agent skills are deterministic", () => {
  let state = createDefaultState();
  state = setV3UserDecision(state, "additionalAgents", ["claude-code"]).state;
  const config = resolveV3Config(state);
  const token = encodeV3Blueprint(config);
  assert.deepEqual(decodeV3Blueprint(token), config);
  assert.match(buildV3StarterCommand(config), /--blueprint v3\./);
  const plan = buildExecutionPlan(config);
  assert.equal(plan.skills.some((skill) => skill.installCommand.includes("--agent codex") && skill.expectedPaths[0]?.startsWith(".agents/skills/")), true);
  assert.equal(plan.skills.some((skill) => skill.installCommand.includes("--agent claude-code") && skill.expectedPaths[0]?.startsWith(".claude/skills/")), true);
  assert.equal(plan.steps.some((step) => step.id === "install-dependencies"), true);
  assert.equal(plan.steps.some((step) => step.id === "install-browser"), true);
  assert.equal(plan.steps.some((step) => step.id === "record-readiness"), true);
  assert.equal(plan.steps.some((step) => step.id === "initialize-git"), true);
});
