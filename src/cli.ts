#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { dirname, resolve } from "node:path";
import { stdin, stdout } from "node:process";
import {
  buildExecutionPlan,
  decodeV3Blueprint,
  isValidTargetDirectory,
  resolveV3Config,
  type ExecutionPlanV3,
  type ExecutionPlanStep,
  type StarterConfigV3,
} from "./core.js";
import {
  renderAgentEntryPoints,
  renderReadinessReport,
  renderStartOwnedFiles,
  START_VERSION,
  createStartToolingManifest,
  type StartToolingManifest,
} from "./render.js";
import { bootstrapEnvironment } from "./bootstrap.js";
import { collectInteractiveWizardState, renderPlanPreview, renderSplash, TerminalPrompter } from "./interactive.js";

const webBuilderUrl = "https://bishoy.io/start";
const useColor = Boolean(stdout.isTTY && !process.env.NO_COLOR);
const lightBlue = (value: string) => useColor ? `\u001B[38;5;117m${value}\u001B[0m` : value;

type FileState = "absent" | "satisfied" | "different";
type Outcome = { executed: string[]; skipped: string[]; conflicts: string[]; warnings: string[] };
type StartState = { version: 3; blueprint: string; officialCommand: string };
type CommandProgress = { current: number; total: number };

function fail(message: string): never {
  console.error(`\nStart generation stopped: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`@bishoymly/start

Turn an empty folder into a verified, agent-ready Next.js repository in one reviewable run.

Usage:
  pnpm dlx @bishoymly/start@latest [app-name] --blueprint v3.<token>
  pnpm dlx @bishoymly/start@latest [app-name] --blueprint v3.<token> --plan
  pnpm dlx @bishoymly/start@latest --web

Options:
  --blueprint <token>  Execute a portable v3 blueprint
  --plan               Print the ordered execution plan without writing files or running commands
  --skip-install       Skip project skill installation, dependency installation, and verification
  --web                Open ${webBuilderUrl}
  --help, -h           Show this help`);
}

function openWebBuilder(): void {
  const command: [string, string[]] = platform() === "darwin"
    ? ["open", [webBuilderUrl]]
    : platform() === "win32"
      ? ["cmd", ["/c", "start", "", webBuilderUrl]]
      : ["xdg-open", [webBuilderUrl]];
  const result = spawnSync(command[0], command[1], { stdio: "ignore" });
  console.log(result.status === 0 ? `Opened ${webBuilderUrl}` : `Open the web builder: ${webBuilderUrl}`);
}

function parseArguments(args: string[]) {
  const blueprintIndex = args.indexOf("--blueprint");
  const optionValues = new Set([blueprintIndex + 1]);
  const targets = args.filter((argument, index) => !argument.startsWith("-") && !optionValues.has(index));
  if (targets.length > 1) fail("Only one app name may be supplied.");
  if (args.some((argument) => argument.startsWith("--") && !["--blueprint", "--plan", "--skip-install", "--web", "--help"].includes(argument))) {
    fail("Unknown option. Run with --help for supported options.");
  }
  return { blueprint: blueprintIndex >= 0 ? args[blueprintIndex + 1] : undefined, target: targets[0], planOnly: args.includes("--plan"), skipInstall: args.includes("--skip-install") };
}

function checkTarget(root: string, targetDirectory: string): string {
  if (!isValidTargetDirectory(targetDirectory)) fail("Target folder must be a safe relative path without spaces, backslashes, or parent-directory segments.");
  let cursor = root;
  for (const segment of targetDirectory === "." ? [] : targetDirectory.split("/")) {
    cursor = resolve(cursor, segment);
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) fail("Target folder cannot pass through symbolic links.");
  }
  const target = resolve(root, targetDirectory);
  if (target !== root && !target.startsWith(`${root}/`)) fail("Target folder must stay inside the current directory.");
  return target;
}

function assertNoSymlink(target: string, relativePath = "."): string {
  const absolute = resolve(target, relativePath);
  if (absolute !== target && !absolute.startsWith(`${target}/`)) fail("A planned path escaped the target directory.");
  let cursor = target;
  if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) fail("Start will not write through a symbolic link.");
  for (const segment of relativePath.split("/").filter(Boolean)) {
    cursor = resolve(cursor, segment);
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) fail(`Start will not write through symbolic link: ${relativePath}`);
  }
  return absolute;
}

function filesState(target: string, files: Record<string, string>): FileState {
  const entries = Object.entries(files);
  const present = entries.filter(([path]) => existsSync(assertNoSymlink(target, path)));
  if (present.length === 0) return "absent";
  if (present.length === entries.length && present.every(([path, content]) => readFileSync(assertNoSymlink(target, path), "utf8") === content)) return "satisfied";
  return "different";
}

function pathExistsState(target: string, paths: readonly string[]): FileState {
  const count = paths.filter((path) => existsSync(assertNoSymlink(target, path))).length;
  return count === 0 ? "absent" : count === paths.length ? "satisfied" : "different";
}

function writeFiles(target: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    const absolute = assertNoSymlink(target, path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }
}

function runCommand(command: string, cwd: string, label: string, options: { allowFailure?: boolean; environment?: NodeJS.ProcessEnv; progress?: CommandProgress } = {}): boolean {
  if (options.progress) {
    options.progress.current += 1;
    const position = `${String(options.progress.current).padStart(2, "0")}/${String(options.progress.total).padStart(2, "0")}`;
    console.log(`\n  ${lightBlue(`━━ ${position}`)}  ${label}`);
    console.log(`     ${lightBlue("↳")} ${command}`);
  } else {
    console.log(`\n  ${lightBlue("━━")} ${label}`);
    console.log(`     ${lightBlue("↳")} ${command}`);
  }
  if (process.env.START_TEST_SKIP_EXECUTION === "1") {
    console.log(`Test seam: skipped ${label}.`);
    return true;
  }
  const result = spawnSync(command, { cwd, shell: true, stdio: "inherit", env: { ...process.env, ...options.environment } });
  if (result.status !== 0) {
    if (options.allowFailure) return false;
    fail(`${label} failed. The workspace was preserved for inspection and retry.`);
  }
  return true;
}

function resolvedVersions(target: string): Record<string, string> {
  const versions: Record<string, string> = { node: process.version };
  const packageFile = resolve(target, "package.json");
  if (!existsSync(packageFile)) return versions;
  try {
    const pkg = JSON.parse(readFileSync(packageFile, "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    for (const name of ["next", "shadcn", "typescript", "vitest", "@playwright/test"]) {
      const installed = resolve(target, "node_modules", ...name.split("/"), "package.json");
      if (existsSync(installed)) {
        try {
          const packageVersion = (JSON.parse(readFileSync(installed, "utf8")) as { version?: unknown }).version;
          if (typeof packageVersion === "string") versions[name] = packageVersion;
        } catch { /* retained as a warning in the readiness report below */ }
      }
      const declared = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
      if (!versions[name] && declared) versions[`${name} (declared; not installed)`] = declared;
    }
  } catch { /* the official CLI owns package.json; its verifier will report malformed JSON */ }
  return versions;
}

function readStartState(target: string): StartState | null {
  const stateFile = assertNoSymlink(target, ".start/v3-state.json");
  if (!existsSync(stateFile)) return null;
  try {
    const value = JSON.parse(readFileSync(stateFile, "utf8")) as Partial<StartState>;
    return value.version === 3 && typeof value.blueprint === "string" && typeof value.officialCommand === "string" ? value as StartState : null;
  } catch { return null; }
}

function officialState(target: string, command: NonNullable<ExecutionPlanStep["command"]>, blueprint: string): FileState {
  const state = readStartState(target);
  const existing = pathExistsState(target, command.affectedPaths);
  if (!state) return existing === "absent" ? "absent" : "different";
  return state.blueprint === blueprint && state.officialCommand === command.command && existing === "satisfied" ? "satisfied" : "different";
}

function initializeGit(target: string): void {
  const existing = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: target, encoding: "utf8" });
  if (existing.status === 0) return console.log(`Using existing Git repository: ${existing.stdout.trim()}`);
  const initialized = spawnSync("git", ["init", "--initial-branch=main"], { cwd: target, encoding: "utf8" });
  if (initialized.status === 0) console.log("Initialized Git repository on main.");
  else console.warn("Git initialization was skipped. Initialize it later with git init --initial-branch=main.");
}

async function applyFiles(target: string, step: ExecutionPlanStep, files: Record<string, string>, outcome: Outcome): Promise<void> {
  const state = filesState(target, files);
  if (state === "satisfied") return void outcome.skipped.push(step.id);
  if (state === "different") outcome.conflicts.push(step.id);
  writeFiles(target, files);
  outcome.executed.push(step.id);
}

function scopedStartFiles(files: Record<string, string>, id: string, agentFiles: Record<string, string>): Record<string, string> {
  const isCi = (path: string) => [".github/workflows/verify.yml", ".gitlab-ci.yml", "azure-pipelines.yml"].includes(path);
  const isCapability = (path: string) => path.startsWith("lib/db/") || path === "drizzle.config.ts" || path.startsWith("prisma/") || path === "lib/auth.ts" || path === "lib/auth-session.ts" || path === "app/api/auth/[...all]/route.ts" || path.startsWith("lib/storage/") || path.startsWith("lib/ai/") || path === "instrumentation.ts" || path.startsWith("sentry.");
  const belongsTo = (path: string) => {
    if (id === "project-contracts") return !isCi(path) && !isCapability(path) && !(path in agentFiles) && path !== "docs/START_READINESS.md" && !["tsconfig.json", "next.config.ts", ".nvmrc", ".husky/pre-commit", "biome.json", "eslint.config.mjs", "prettier.config.mjs", ".prettierignore", "vitest.config.ts", "playwright.config.ts"].includes(path) && !path.startsWith("tests/");
    if (id === "quality") return ["tsconfig.json", "next.config.ts", ".nvmrc", ".husky/pre-commit", "biome.json", "eslint.config.mjs", "prettier.config.mjs", ".prettierignore", "vitest.config.ts", "playwright.config.ts"].includes(path) || path.startsWith("tests/");
    if (id === "ci") return isCi(path);
    if (id === "database") return path.startsWith("lib/db/") || path === "drizzle.config.ts" || path.startsWith("prisma/");
    if (id === "authentication") return path === "lib/auth.ts" || path === "lib/auth-session.ts" || path === "app/api/auth/[...all]/route.ts";
    if (id === "storage") return path.startsWith("lib/storage/");
    if (id.startsWith("ai-")) return path.startsWith("lib/ai/");
    if (id === "opentelemetry") return path === "instrumentation.ts";
    if (id === "sentry") return path.startsWith("sentry.");
    return false;
  };
  return Object.fromEntries(Object.entries(files).filter(([path]) => belongsTo(path)));
}

function toolingState(target: string, manifest: StartToolingManifest): FileState {
  const packageFile = resolve(target, "package.json");
  if (!existsSync(packageFile)) return "absent";
  let pkg: Record<string, unknown>;
  try { pkg = JSON.parse(readFileSync(packageFile, "utf8")) as Record<string, unknown>; } catch { return "different"; }
  const entries = (["scripts", "dependencies", "devDependencies"] as const).flatMap((section) => Object.entries(manifest[section] ?? {}).map(([name, version]) => [section, name, version] as const));
  const matched = entries.every(([section, name, version]) => (pkg[section] as Record<string, string> | undefined)?.[name] === version);
  const removable = manifest.removeDevDependencies ?? [];
  const removalsSatisfied = removable.every((name) => (pkg.devDependencies as Record<string, string> | undefined)?.[name] === undefined);
  const metadataMatches = (!manifest.packageManager || pkg.packageManager === manifest.packageManager)
    && (!manifest.engines || JSON.stringify(pkg.engines) === JSON.stringify(manifest.engines))
    && (!manifest.lintStaged || JSON.stringify(pkg["lint-staged"]) === JSON.stringify(manifest.lintStaged));
  if (matched && removalsSatisfied && metadataMatches) return "satisfied";
  if (entries.every(([section, name]) => (pkg[section] as Record<string, string> | undefined)?.[name] === undefined) && removalsSatisfied) return "absent";
  return "different";
}

function applyToolingManifest(target: string, manifest: StartToolingManifest): void {
  const packageFile = resolve(target, "package.json");
  let pkg: Record<string, unknown> = {};
  if (existsSync(packageFile)) pkg = JSON.parse(readFileSync(packageFile, "utf8")) as Record<string, unknown>;
  for (const section of ["scripts", "dependencies", "devDependencies"] as const) {
    const values = manifest[section];
    if (!values || Object.keys(values).length === 0) continue;
    pkg[section] = { ...(pkg[section] as Record<string, string> | undefined), ...values };
  }
  if (manifest.removeDevDependencies?.length && pkg.devDependencies && typeof pkg.devDependencies === "object") {
    for (const name of manifest.removeDevDependencies) delete (pkg.devDependencies as Record<string, string>)[name];
  }
  if (manifest.packageManager) pkg.packageManager = manifest.packageManager;
  if (manifest.engines) pkg.engines = manifest.engines;
  if (manifest.lintStaged) pkg["lint-staged"] = manifest.lintStaged;
  writeFiles(target, { "package.json": `${JSON.stringify(pkg, null, 2)}\n` });
}

function normalizeOfficialStarterForTooling(target: string, config: StarterConfigV3): void {
  if (config.tooling !== "biome") return;
  // This is the sole known unused import in the current official starter. Keep
  // the edit exact and optional so upstream layout changes remain untouched.
  const layout = assertNoSymlink(target, "app/layout.tsx");
  if (existsSync(layout)) {
    const content = readFileSync(layout, "utf8");
    const normalized = content.replace('import { Geist, Geist_Mono, Inter } from "next/font/google"', 'import { Geist_Mono, Inter } from "next/font/google"');
    if (normalized !== content) writeFileSync(layout, normalized, "utf8");
  }
  for (const path of ["eslint.config.mjs", "prettier.config.mjs", ".prettierignore"]) {
    const file = assertNoSymlink(target, path);
    if (existsSync(file) && lstatSync(file).isFile()) unlinkSync(file);
  }
  const gitignore = assertNoSymlink(target, ".gitignore");
  const requiredIgnores = ["!.env.example", "/test-results/", "/playwright-report/"];
  const existing = existsSync(gitignore) ? readFileSync(gitignore, "utf8") : "";
  const missing = requiredIgnores.filter((entry) => !existing.split(/\r?\n/).includes(entry));
  if (missing.length) writeFileSync(gitignore, `${existing.replace(/\s*$/, "")}\n${missing.join("\n")}\n`, "utf8");
  const hook = assertNoSymlink(target, ".husky/pre-commit");
  if (existsSync(hook)) chmodSync(hook, 0o755);
}

async function applyQuality(target: string, config: StarterConfigV3, step: ExecutionPlanStep, files: Record<string, string>, manifest: StartToolingManifest, outcome: Outcome): Promise<void> {
  const fileState = filesState(target, files);
  const manifestState = toolingState(target, manifest);
  if (fileState === "satisfied" && manifestState === "satisfied") {
    normalizeOfficialStarterForTooling(target, config);
    return void outcome.skipped.push(step.id);
  }
  if (fileState === "different" || manifestState === "different") outcome.conflicts.push(step.id);
  writeFiles(target, files);
  applyToolingManifest(target, manifest);
  normalizeOfficialStarterForTooling(target, config);
  outcome.executed.push(step.id);
}

function installSkills(plan: ExecutionPlanV3, target: string, progress: CommandProgress): void {
  if (process.env.START_TEST_SKILL_OUTPUTS === "1") {
    writeFiles(target, Object.fromEntries(plan.skills.flatMap((skill) => skill.expectedPaths.map((path) => [path, "# test-only installed skill\n"]))));
  }
  runCommand(plan.skills.map((skill) => skill.installCommand).join(" && "), target, "Install selected project skills", { progress });
  if (pathExistsState(target, plan.skills.flatMap((skill) => skill.expectedPaths)) !== "satisfied") {
    fail("The official Skills CLI completed without producing every expected project-local skill file.");
  }
  console.log(`     ${lightBlue("✓")} Project skills installed: ${plan.skills.map((skill) => skill.expectedPaths[0]).join(", ")}`);
}

async function execute(config: StarterConfigV3, plan: ExecutionPlanV3, target: string, options: ReturnType<typeof parseArguments>): Promise<Outcome> {
  const outcome: Outcome = { executed: [], skipped: [], conflicts: [], warnings: [...plan.warnings] };
  const commandProgress: CommandProgress = {
    current: 0,
    total: 1 + (options.skipInstall ? 0 : 1 + plan.steps.filter((step) => step.id === "install-shadcn-components" || step.id === "install-dependencies" || step.id === "format-generated-source" || step.id === "install-browser").length + 1),
  };
  const startFiles = renderStartOwnedFiles(config, plan);
  const agentFiles = renderAgentEntryPoints(config);
  const toolingManifest = createStartToolingManifest(config);

  for (const step of plan.steps) {
    if (step.id === "official-shadcn-init") {
      const contract = step.command;
      if (!contract) fail("The official shadcn plan step is missing its command.");
      const state = officialState(target, contract, plan.blueprint);
      if (state === "satisfied") outcome.skipped.push(step.id);
      else if (state === "different") {
        outcome.conflicts.push(step.id);
        // Start never invokes undocumented force behavior against an unknown
        // official-looking directory. A v3 marker is the sole resumability proof.
        fail(`Existing official-like files have no matching Start v3 state marker. Preserve them or choose a new target; ${step.id} cannot be overwritten.`);
      } else {
        // shadcn creates <cwd>/<name>. Run it from the parent so the known app
        // name resolves to the target itself instead of a nested app/app folder.
        // shadcn currently writes a pnpm-workspace.yaml for its generated
        // single-package app. Its nested `pnpm add` then targets that root,
        // which is correct but otherwise rejected by pnpm's safety check.
        // Scope the exception to bootstrap and inherit it into shadcn's child.
        runCommand(contract.command, dirname(target), step.title, { environment: bootstrapEnvironment(config.packageManager), progress: commandProgress });
        // The no-network test seam does not synthesize upstream output.
        // Production shadcn creates this directory itself.
        if (!existsSync(target)) mkdirSync(target, { recursive: true });
        outcome.executed.push(step.id);
      }
      continue;
    }
    if (step.id === "record-start-state") {
      const official = plan.steps.find((candidate) => candidate.id === "official-shadcn-init")?.command;
      if (!official) fail("The execution plan is missing its official template contract.");
      await applyFiles(target, step, { ".start/v3-state.json": `${JSON.stringify({ version: 3, blueprint: plan.blueprint, officialCommand: official.command }, null, 2)}\n` }, outcome);
      continue;
    }
    if (step.id === "install-shadcn-components") {
      if (options.skipInstall) {
        outcome.skipped.push(step.id);
        continue;
      }
      const statePath = ".start/v3-shadcn-components.json";
      if (pathExistsState(target, [statePath]) === "satisfied") outcome.skipped.push(step.id);
      else {
        if (!step.command) fail("The execution plan is missing the shadcn component command.");
        runCommand(step.command.command, target, step.title, { environment: bootstrapEnvironment(config.packageManager), progress: commandProgress });
        writeFiles(target, { [statePath]: `${JSON.stringify({ version: 1, blueprint: plan.blueprint, command: step.command.command }, null, 2)}\n` });
        outcome.executed.push(step.id);
      }
      continue;
    }
    if (step.id === "start-agent-instructions") {
      await applyFiles(target, step, agentFiles, outcome);
      continue;
    }
    if (step.id === "start-project-contracts" || step.id === "start-quality" || step.id === "start-ci" || step.id.startsWith("capability-")) {
      const id = step.id === "start-project-contracts" ? "project-contracts" : step.id === "start-quality" ? "quality" : step.id === "start-ci" ? "ci" : step.id.slice("capability-".length);
      const scoped = scopedStartFiles(startFiles, id, agentFiles);
      if (step.id === "start-quality") await applyQuality(target, config, step, scoped, toolingManifest, outcome);
      else if (Object.keys(scoped).length) await applyFiles(target, step, scoped, outcome);
      else outcome.skipped.push(step.id);
      continue;
    }
    if (step.id === "install-project-skills") {
      if (options.skipInstall) {
        outcome.skipped.push(step.id);
        continue;
      }
      const state = pathExistsState(target, plan.skills.flatMap((skill) => skill.expectedPaths));
      if (state === "satisfied") {
        console.log(`     ${lightBlue("✓")} Project skills already available: ${plan.skills.map((skill) => skill.expectedPaths[0]).join(", ")}`);
        outcome.skipped.push(step.id);
      }
      else if (state === "different") {
        outcome.conflicts.push(step.id);
        installSkills(plan, target, commandProgress);
        outcome.executed.push(step.id);
      } else { installSkills(plan, target, commandProgress); outcome.executed.push(step.id); }
      continue;
    }
    if (step.id === "install-dependencies" || step.id === "format-generated-source" || step.id === "install-browser") {
      if (options.skipInstall) outcome.skipped.push(step.id);
      else if (!step.command) fail(`The execution plan is missing ${step.id}'s command.`);
      else { runCommand(step.command.command, target, step.title, { progress: commandProgress }); outcome.executed.push(step.id); }
      continue;
    }
    if (step.id === "verify-readiness") continue;
    if (step.id === "record-readiness") continue;
    if (step.id === "initialize-git") continue;
  }

  const verification = plan.steps.find((step) => step.id === "verify-readiness");
  if (!verification) fail("The execution plan is missing readiness verification.");
  let verificationStatus: "pending" | "passed" | "failed" = "pending";
  let verificationFailed = false;
  if (!options.skipInstall && process.env.START_TEST_SKIP_EXECUTION !== "1") {
    verificationFailed = !runCommand(plan.verification.command, target, verification.title, { allowFailure: true, progress: commandProgress });
    verificationStatus = verificationFailed ? "failed" : "passed";
    outcome[verificationFailed ? "skipped" : "executed"].push(verification.id);
  } else outcome.skipped.push(verification.id);

  if (options.skipInstall) outcome.warnings.push("Dependencies and verification were skipped; this workspace is not ready until a full run succeeds.");
  const readinessStep = plan.steps.find((step) => step.id === "record-readiness");
  if (!readinessStep) fail("The execution plan is missing the readiness report step.");
  // The matching state marker proves this is Start's mutable execution record;
  // it is deliberately refreshed on each resumable run rather than treated as
  // user configuration.
  writeFiles(target, { "docs/START_READINESS.md": renderReadinessReport({ plan, executed: outcome.executed, skipped: outcome.skipped, conflicts: outcome.conflicts, resolvedVersions: resolvedVersions(target), verification: { command: plan.verification.command, status: verificationStatus, details: options.skipInstall ? "Not ready: --skip-install bypassed dependency installation and verification." : undefined }, warnings: outcome.warnings }) });
  outcome.executed.push(readinessStep.id);
  if (verificationFailed) fail(`${verification.title} failed. docs/START_READINESS.md records the failed verification; the workspace was preserved for inspection and retry.`);
  const gitStep = plan.steps.find((step) => step.id === "initialize-git");
  if (!gitStep) fail("The execution plan is missing Git initialization.");
  initializeGit(target);
  outcome.executed.push(gitStep.id);
  return outcome;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) return printHelp();
  if (args.includes("--web")) return openWebBuilder();
  const options = parseArguments(args);
  let config: StarterConfigV3;
  let planAlreadyPrinted = false;
  if (options.blueprint) {
    try { config = decodeV3Blueprint(options.blueprint); } catch (error) { fail(error instanceof Error ? error.message : "Invalid v3 blueprint."); }
  } else {
    if (!stdin.isTTY || !stdout.isTTY) fail(`Interactive setup requires a terminal. Use --blueprint v3.<token> or open ${webBuilderUrl}.`);
    stdout.write(renderSplash(START_VERSION));
    const prompter = new TerminalPrompter();
    try {
      config = resolveV3Config(await collectInteractiveWizardState(prompter, options.target));
      const review = buildExecutionPlan(config);
      stdout.write(renderPlanPreview(review, useColor));
      planAlreadyPrinted = true;
      if (options.planOnly || !(await prompter.confirm("executePlan", "Execute this plan now?", true))) return;
    } finally {
      prompter.close();
    }
  }
  if (options.blueprint && options.target && options.target !== config.projectName) {
    fail("The app name argument must match the project name in the blueprint.");
  }
  const target = checkTarget(realpathSync(process.cwd()), config.projectName);
  const plan = buildExecutionPlan(config);
  if (!planAlreadyPrinted) stdout.write(renderPlanPreview(plan, useColor));
  if (options.planOnly) return;
  const outcome = await execute(config, plan, target, options);
  console.log(`\nReadiness report written to ${resolve(target, "docs/START_READINESS.md")}.`);
  console.log(`Executed: ${outcome.executed.join(", ") || "none"}`);
  console.log(`Skipped: ${outcome.skipped.join(", ") || "none"}`);
  console.log("Repository setup is complete. Await a PRD or requirements before implementing product behavior.");
}

void main().catch((error) => fail(error instanceof Error ? error.message : "Unexpected CLI failure."));
