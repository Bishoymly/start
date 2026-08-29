import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createDefaultState, encodeV3Blueprint, resolveV3Config, setV3UserDecision } from "./core.js";

const cli = new URL("./cli.js", import.meta.url);

function tokenFor(projectName = "app") {
  let state = createDefaultState();
  state = setV3UserDecision(state, "projectName", projectName).state;
  return encodeV3Blueprint(resolveV3Config(state));
}

function run(root: string, args: string[], options: { skipExecution?: boolean } = {}) {
  return spawnSync(process.execPath, [cli.pathname, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...(options.skipExecution ? { START_TEST_SKIP_EXECUTION: "1" } : {}) },
  });
}

test("CLI help documents v3, plan-only, overwrite, and web modes", () => {
  const result = run(process.cwd(), ["--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /v3\.<token>/);
  assert.match(result.stdout, /--plan/);
  assert.match(result.stdout, /--overwrite/);
  assert.match(result.stdout, /--web/);
  assert.match(result.stdout, /\[app-name\]/);
  assert.doesNotMatch(result.stdout, /target-folder/);
});

test("CLI plan-only prints the v3 ordered plan without creating a target", () => {
  const root = mkdtempSync(join(tmpdir(), "start-plan-"));
  const result = run(root, ["app", "--blueprint", tokenFor(), "--plan"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Initialize the official shadcn template/);
  assert.match(result.stdout, /--template next/);
  assert.match(result.stdout, /Install selected project skills/);
  assert.match(result.stdout, /Verify repository readiness/);
  assert.equal(existsSync(join(root, "apps")), false);
});

test("CLI rejects legacy tokens and a missing v3 token before writing", () => {
  const root = mkdtempSync(join(tmpdir(), "start-v3-token-"));
  const legacy = run(root, ["--blueprint", "v2.legacy", "--plan"]);
  assert.equal(legacy.status, 1);
  assert.match(legacy.stderr, /Blueprint v3 is required/);
  const missing = run(root, ["--blueprint", "--plan"]);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Unsupported blueprint token|requires a v3 token/);
  assert.equal(existsSync(join(root, "my-app")), false);
});

test("CLI rejects an app name that differs from the blueprint", () => {
  const root = mkdtempSync(join(tmpdir(), "start-app-name-"));
  const result = run(root, ["other-app", "--blueprint", tokenFor("agent-console"), "--plan"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /app name.*blueprint/i);
  assert.equal(existsSync(join(root, "other-app")), false);
});

test("CLI rejects a symlink app folder without writing", (context) => {
  const root = mkdtempSync(join(tmpdir(), "start-safe-target-"));
  const outside = mkdtempSync(join(tmpdir(), "start-safe-outside-"));
  try { symlinkSync(outside, join(root, "linked"), "dir"); } catch { context.skip("Directory symlinks are unavailable in this environment."); return; }
  const linked = run(root, ["linked", "--blueprint", tokenFor("linked"), "--plan"]);
  assert.equal(linked.status, 1);
  assert.match(linked.stderr, /symbolic links/);
  assert.equal(existsSync(join(outside, "AGENTS.md")), false);
});

test("CLI executes the v3 plan through the no-network test seam and reports readiness", () => {
  const root = mkdtempSync(join(tmpdir(), "start-v3-execute-"));
  const result = run(root, ["app", "--blueprint", tokenFor(), "--skip-install"], { skipExecution: true });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(root, "app", "AGENTS.md")), true);
  assert.equal(existsSync(join(root, "app", "START_READINESS.md")), true);
  assert.match(readFileSync(join(root, "app", "START_READINESS.md"), "utf8"), /Await a PRD|requirements/i);
  assert.match(result.stdout, /Test seam: skipped Initialize the official shadcn template/);
  assert.match(result.stdout, /Skipped:.*install-project-skills/);
});

test("CLI fails safely on a Start-owned conflict unless overwrite is explicit", () => {
  const root = mkdtempSync(join(tmpdir(), "start-conflict-"));
  const args = ["app", "--blueprint", tokenFor(), "--skip-install"];
  const initial = run(root, args, { skipExecution: true });
  assert.equal(initial.status, 0, initial.stderr);
  // The no-network seam deliberately does not synthesize official shadcn output.
  // Supply the upstream command's postcondition so this rerun reaches the Start-owned conflict.
  mkdirSync(join(root, "app", "app"));
  mkdirSync(join(root, "app", "components"));
  writeFileSync(join(root, "app", "components.json"), "{}\n", "utf8");
  const agents = join(root, "app", "AGENTS.md");
  writeFileSync(agents, "user-owned conflict\n", "utf8");
  const conflict = run(root, args, { skipExecution: true });
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, /Conflicting configuration for Add durable agent instructions/);
  assert.equal(readFileSync(agents, "utf8"), "user-owned conflict\n");
  const overwrite = run(root, [...args, "--overwrite", "start-agent-instructions"], { skipExecution: true });
  assert.equal(overwrite.status, 0, overwrite.stderr);
  assert.notEqual(readFileSync(agents, "utf8"), "user-owned conflict\n");
});

test("CLI rejects an unknown official-like target and every planned symlink write", (context) => {
  const root = mkdtempSync(join(tmpdir(), "start-symlink-output-"));
  const app = join(root, "app");
  mkdirSync(app);
  mkdirSync(join(app, "components"));
  writeFileSync(join(app, "components.json"), "{}\n");
  const unknown = run(root, ["app", "--blueprint", tokenFor(), "--skip-install"], { skipExecution: true });
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /state marker/);

  const target = join(root, "safe");
  mkdirSync(target);
  const outside = join(root, "outside-agents.md");
  writeFileSync(outside, "outside\n");
  try { symlinkSync(outside, join(target, "AGENTS.md")); } catch { context.skip("File symlinks are unavailable in this environment."); return; }
  const linked = run(root, ["safe", "--blueprint", tokenFor("safe"), "--skip-install"], { skipExecution: true });
  assert.equal(linked.status, 1);
  assert.match(linked.stderr, /symbolic link/);
  assert.equal(readFileSync(outside, "utf8"), "outside\n");
});

test("a missing installer-produced skill file fails even through the no-network command seam", () => {
  const root = mkdtempSync(join(tmpdir(), "start-skills-missing-"));
  const result = run(root, ["app", "--blueprint", tokenFor()], { skipExecution: true });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /without producing every expected project-local skill file/);
});
