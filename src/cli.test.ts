import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createDefaultWizardState, encodeBlueprint, recomputeRecommendations, resolveStarterConfig, setUserDecision } from "./core.js";
import { getBundledDesignReference } from "./design.js";

function tokenFor(targetDirectory = "generated-app") {
  let state = createDefaultWizardState();
  const design = getBundledDesignReference("notion");
  state.designReference = { value: "notion", source: "user" };
  state.designProvenance = design.source;
  state = setUserDecision(state, "targetDirectory", targetDirectory).state;
  return encodeBlueprint(resolveStarterConfig(recomputeRecommendations(state).state));
}

function tokenWithoutDesign(targetDirectory = "generated-app") {
  let state = createDefaultWizardState();
  state = setUserDecision(state, "targetDirectory", targetDirectory).state;
  return encodeBlueprint(resolveStarterConfig(state));
}

const cli = new URL("./cli.js", import.meta.url);

test("CLI help documents interactive, web, and blueprint modes", () => {
  const result = spawnSync(process.execPath, [cli.pathname, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /same project, UI, service, and delivery questions/i);
  assert.match(result.stdout, /--web/);
  assert.match(result.stdout, /--blueprint/);
});

test("CLI gives non-interactive shells a recoverable path", () => {
  const result = spawnSync(process.execPath, [cli.pathname], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Interactive setup requires a terminal/);
  assert.match(result.stderr, /bishoy\.io\/start/);
});

test("CLI refuses to overwrite a non-empty folder", () => {
  const root = mkdtempSync(join(tmpdir(), "bishoy-starter-overwrite-"));
  const target = join(root, "existing-app");
  mkdirSync(target);
  writeFileSync(join(target, "keep.txt"), "keep", "utf8");
  const result = spawnSync(process.execPath, [cli.pathname, "existing-app", "--blueprint", tokenFor(), "--skip-install"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to overwrite non-empty folder/);
});

test("CLI rejects an unsafe target override before writing", () => {
  const root = mkdtempSync(join(tmpdir(), "bishoy-start-target-"));
  const result = spawnSync(process.execPath, [cli.pathname, "../outside", "--blueprint", tokenFor(), "--skip-install"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /safe relative path/);
  assert.equal(existsSync(join(root, "..", "outside", "package.json")), false);
});

test("CLI rejects target paths that escape through symbolic links", (context) => {
  const root = mkdtempSync(join(tmpdir(), "bishoy-start-symlink-root-"));
  const outside = mkdtempSync(join(tmpdir(), "bishoy-start-symlink-outside-"));
  try {
    symlinkSync(outside, join(root, "linked"), "dir");
  } catch {
    context.skip("Directory symlinks are unavailable in this environment.");
    return;
  }
  const result = spawnSync(process.execPath, [cli.pathname, "linked/app", "--blueprint", tokenFor(), "--skip-install"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /symbolic links/);
  assert.equal(existsSync(join(outside, "app")), false);
});

test("CLI uses the blueprint folder, writes the v0.4 contract, and initializes Git", () => {
  const root = mkdtempSync(join(tmpdir(), "bishoy-start-generate-"));
  const result = spawnSync(process.execPath, [cli.pathname, "--blueprint", tokenFor("apps/web"), "--skip-install"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const target = join(root, "apps", "web");
  assert.equal(existsSync(join(target, "package.json")), true);
  assert.equal(existsSync(join(target, "README.md")), true);
  assert.equal(existsSync(join(target, "biome.json")), true);
  assert.equal(existsSync(join(target, "vitest.config.ts")), true);
  assert.equal(existsSync(join(target, "playwright.config.ts")), true);
  assert.equal(existsSync(join(target, "instrumentation.ts")), true);
  assert.equal(existsSync(join(target, ".git")), true);
  assert.match(readFileSync(join(target, "APP_BLUEPRINT.md"), "utf8"), /v0\.4\.0/);
});

test("CLI generates without fetching or writing a design reference", () => {
  const root = mkdtempSync(join(tmpdir(), "bishoy-start-no-design-"));
  const result = spawnSync(process.execPath, [cli.pathname, "app", "--blueprint", tokenWithoutDesign(), "--skip-install"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(root, "app", "DESIGN.md")), false);
  assert.equal(readFileSync(join(root, "app", "README.md"), "utf8").includes("DESIGN.md"), false);
  assert.match(result.stdout, /Design: none/);
});

test("CLI reuses an outer Git repository instead of nesting one", () => {
  const root = mkdtempSync(join(tmpdir(), "bishoy-start-outer-git-"));
  const git = spawnSync("git", ["init", "--initial-branch=main"], { cwd: root, encoding: "utf8" });
  if (git.status !== 0) return;
  const result = spawnSync(process.execPath, [cli.pathname, "app", "--blueprint", tokenFor(), "--skip-install"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(root, "app", ".git")), false);
  assert.match(result.stdout, /Using existing Git repository/);
});
