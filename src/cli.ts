#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
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
  renderPlanMarkdown,
  renderReadinessReport,
  renderStartOwnedFiles,
  createStartToolingManifest,
  type StartToolingManifest,
} from "./render.js";
import { collectInteractiveWizardState, TerminalPrompter } from "./interactive.js";

const webBuilderUrl = "https://bishoy.io/start";

type FileState = "absent" | "satisfied" | "different";
type Outcome = { executed: string[]; skipped: string[]; conflicts: string[] };

function fail(message: string): never {
  console.error(`\nStart generation stopped: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`@bishoymly/start

Turn an empty folder into a verified, agent-ready Next.js repository in one reviewable run.

Usage:
  pnpm dlx @bishoymly/start@latest [target-folder] --blueprint v3.<token>
  pnpm dlx @bishoymly/start@latest [target-folder] --blueprint v3.<token> --plan
  pnpm dlx @bishoymly/start@latest --web

Options:
  --blueprint <token>  Execute a portable v3 blueprint
  --plan               Print the ordered execution plan without writing files or running commands
  --overwrite          Approve replacing conflicting Start-owned configuration
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
  if (targets.length > 1) fail("Only one target folder may be supplied.");
  if (args.some((argument) => argument.startsWith("--") && !["--blueprint", "--plan", "--overwrite", "--skip-install", "--web", "--help"].includes(argument))) {
    fail("Unknown option. Run with --help for supported options.");
  }
  return { blueprint: blueprintIndex >= 0 ? args[blueprintIndex + 1] : undefined, target: targets[0], planOnly: args.includes("--plan"), overwrite: args.includes("--overwrite"), skipInstall: args.includes("--skip-install") };
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

function filesState(target: string, files: Record<string, string>): FileState {
  const entries = Object.entries(files);
  const present = entries.filter(([path]) => existsSync(resolve(target, path)));
  if (present.length === 0) return "absent";
  if (present.length === entries.length && present.every(([path, content]) => readFileSync(resolve(target, path), "utf8") === content)) return "satisfied";
  return "different";
}

function pathExistsState(target: string, paths: readonly string[]): FileState {
  const count = paths.filter((path) => existsSync(resolve(target, path))).length;
  return count === 0 ? "absent" : count === paths.length ? "satisfied" : "different";
}

function writeFiles(target: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    const absolute = resolve(target, path);
    if (absolute !== target && !absolute.startsWith(`${target}/`)) fail("A planned file escaped the target directory.");
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }
}

async function conflictDecision(step: ExecutionPlanStep, overwrite: boolean, interactive: boolean): Promise<"overwrite" | "preserve"> {
  if (overwrite) return "overwrite";
  if (!interactive) fail(`Conflicting configuration for ${step.title}. Re-run with --overwrite to authorize this command or capability.`);
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await prompt.question(`\n${step.title} differs from the selected blueprint. Overwrite this command or capability? [y/N] `)).trim().toLowerCase();
    return answer === "y" || answer === "yes" ? "overwrite" : "preserve";
  } finally {
    prompt.close();
  }
}

function runCommand(command: string, cwd: string, label: string, allowFailure = false): boolean {
  if (process.env.START_TEST_SKIP_EXECUTION === "1") {
    console.log(`Test seam: skipped ${label}.`);
    return true;
  }
  console.log(`\n${label}: ${command}`);
  const result = spawnSync(command, { cwd, shell: true, stdio: "inherit" });
  if (result.status !== 0) {
    if (allowFailure) return false;
    fail(`${label} failed. The workspace was preserved for inspection and retry.`);
  }
  return true;
}

function plannedVersions(target: string): Record<string, string> {
  const versions: Record<string, string> = { node: process.version };
  const packageFile = resolve(target, "package.json");
  if (!existsSync(packageFile)) return versions;
  try {
    const pkg = JSON.parse(readFileSync(packageFile, "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    for (const name of ["next", "shadcn", "typescript", "vitest", "playwright"]) {
      const version = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
      if (version) versions[name] = version;
    }
  } catch { /* the official CLI owns package.json; its verifier will report malformed JSON */ }
  return versions;
}

function initializeGit(target: string): void {
  const existing = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: target, encoding: "utf8" });
  if (existing.status === 0) return console.log(`Using existing Git repository: ${existing.stdout.trim()}`);
  const initialized = spawnSync("git", ["init", "--initial-branch=main"], { cwd: target, encoding: "utf8" });
  if (initialized.status === 0) console.log("Initialized Git repository on main.");
  else console.warn("Git initialization was skipped. Initialize it later with git init --initial-branch=main.");
}

async function applyFiles(target: string, step: ExecutionPlanStep, files: Record<string, string>, overwrite: boolean, interactive: boolean, outcome: Outcome): Promise<void> {
  const state = filesState(target, files);
  if (state === "satisfied") return void outcome.skipped.push(step.id);
  if (state === "different") {
    outcome.conflicts.push(step.id);
    if (await conflictDecision(step, overwrite, interactive) === "preserve") return void outcome.skipped.push(step.id);
  }
  writeFiles(target, files);
  outcome.executed.push(step.id);
}

function scopedStartFiles(files: Record<string, string>, id: string, agentFiles: Record<string, string>): Record<string, string> {
  const isCi = (path: string) => [".github/workflows/verify.yml", ".gitlab-ci.yml", "azure-pipelines.yml"].includes(path);
  const isCapability = (path: string) => path.startsWith("lib/db/") || path === "drizzle.config.ts" || path.startsWith("prisma/") || path === "lib/auth.ts" || path === "lib/auth-session.ts" || path.startsWith("lib/storage/") || path.startsWith("lib/ai/") || path === "instrumentation.ts" || path.startsWith("sentry.");
  const belongsTo = (path: string) => {
    if (id === "ci") return isCi(path);
    if (id === "database") return path.startsWith("lib/db/") || path === "drizzle.config.ts" || path.startsWith("prisma/");
    if (id === "authentication") return path === "lib/auth.ts" || path === "lib/auth-session.ts";
    if (id === "storage") return path.startsWith("lib/storage/");
    if (id.startsWith("ai-")) return path.startsWith("lib/ai/");
    if (id === "opentelemetry") return path === "instrumentation.ts";
    if (id === "sentry") return path.startsWith("sentry.");
    return !isCi(path) && !isCapability(path) && !(path in agentFiles) && path !== "START_READINESS.md" && path !== "start-tooling.json";
  };
  return Object.fromEntries(Object.entries(files).filter(([path]) => belongsTo(path)));
}

function toolingState(target: string, manifest: StartToolingManifest): FileState {
  const packageFile = resolve(target, "package.json");
  if (!existsSync(packageFile)) return "absent";
  let pkg: Record<string, unknown>;
  try { pkg = JSON.parse(readFileSync(packageFile, "utf8")) as Record<string, unknown>; } catch { return "different"; }
  const entries = (["scripts", "dependencies", "devDependencies"] as const).flatMap((section) => Object.entries(manifest[section] ?? {}).map(([name, version]) => [section, name, version] as const));
  const matched = entries.filter(([section, name, version]) => (pkg[section] as Record<string, string> | undefined)?.[name] === version).length;
  if (matched === entries.length) return "satisfied";
  if (matched === 0 && entries.every(([section, name]) => (pkg[section] as Record<string, string> | undefined)?.[name] === undefined)) return "absent";
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
  writeFiles(target, { "package.json": `${JSON.stringify(pkg, null, 2)}\n` });
}

async function applyQuality(target: string, step: ExecutionPlanStep, files: Record<string, string>, manifest: StartToolingManifest, overwrite: boolean, interactive: boolean, outcome: Outcome): Promise<void> {
  const fileState = filesState(target, files);
  const manifestState = toolingState(target, manifest);
  if (fileState === "satisfied" && manifestState === "satisfied") return void outcome.skipped.push(step.id);
  if (fileState === "different" || manifestState === "different") {
    outcome.conflicts.push(step.id);
    if (await conflictDecision(step, overwrite, interactive) === "preserve") return void outcome.skipped.push(step.id);
  }
  writeFiles(target, files);
  applyToolingManifest(target, manifest);
  outcome.executed.push(step.id);
}

function installSkills(plan: ExecutionPlanV3, target: string): void {
  for (const skill of plan.skills) runCommand(skill.installCommand, target, `Installing ${skill.id}`);
  if (process.env.START_TEST_SKIP_EXECUTION !== "1" && pathExistsState(target, plan.skills.flatMap((skill) => skill.expectedPaths)) !== "satisfied") {
    fail("The official Skills CLI completed without producing every expected project-local skill file.");
  }
}

async function execute(config: StarterConfigV3, plan: ExecutionPlanV3, target: string, options: ReturnType<typeof parseArguments>): Promise<Outcome> {
  const outcome: Outcome = { executed: [], skipped: [], conflicts: [] };
  const interactive = Boolean(stdin.isTTY && stdout.isTTY && !options.blueprint);
  mkdirSync(target, { recursive: true });
  const startFiles = renderStartOwnedFiles(config, plan);
  const agentFiles = renderAgentEntryPoints(config);
  const toolingManifest = createStartToolingManifest(config);

  for (const step of plan.steps) {
    if (step.id === "official-shadcn-init") {
      const contract = step.command;
      if (!contract) fail("The official shadcn plan step is missing its command.");
      const state = pathExistsState(target, contract.affectedPaths);
      if (state === "satisfied") outcome.skipped.push(step.id);
      else if (state === "different") {
        outcome.conflicts.push(step.id);
        if (await conflictDecision(step, options.overwrite, interactive) === "overwrite") {
          runCommand(`${contract.command} --force`, target, step.title);
          outcome.executed.push(step.id);
        } else outcome.skipped.push(step.id);
      } else {
        runCommand(contract.command, target, step.title);
        outcome.executed.push(step.id);
      }
      continue;
    }
    if (step.id === "start-agent-instructions") {
      await applyFiles(target, step, agentFiles, options.overwrite, interactive, outcome);
      continue;
    }
    if (step.id === "start-quality" || step.id === "start-ci" || step.id.startsWith("capability-")) {
      const id = step.id === "start-quality" ? "quality" : step.id === "start-ci" ? "ci" : step.id.slice("capability-".length);
      const scoped = scopedStartFiles(startFiles, id, agentFiles);
      if (step.id === "start-quality") await applyQuality(target, step, scoped, toolingManifest, options.overwrite, interactive, outcome);
      else if (Object.keys(scoped).length) await applyFiles(target, step, scoped, options.overwrite, interactive, outcome);
      else outcome.skipped.push(step.id);
      continue;
    }
    if (step.id === "install-project-skills") {
      if (options.skipInstall) {
        outcome.skipped.push(step.id);
        continue;
      }
      const state = pathExistsState(target, plan.skills.flatMap((skill) => skill.expectedPaths));
      if (state === "satisfied") outcome.skipped.push(step.id);
      else if (state === "different") {
        outcome.conflicts.push(step.id);
        if (await conflictDecision(step, options.overwrite, interactive) === "preserve") outcome.skipped.push(step.id);
        else { installSkills(plan, target); outcome.executed.push(step.id); }
      } else { installSkills(plan, target); outcome.executed.push(step.id); }
    }
  }

  if (!options.skipInstall) {
    runCommand({ npm: "npm install", pnpm: "pnpm install", yarn: "yarn install", bun: "bun install" }[config.packageManager], target, "Installing project dependencies");
    outcome.executed.push("install-dependencies");
  } else outcome.skipped.push("install-dependencies");

  const verification = plan.steps.find((step) => step.id === "verify-readiness");
  if (!verification) fail("The execution plan is missing readiness verification.");
  let verificationStatus: "pending" | "passed" | "failed" = "pending";
  let verificationFailed = false;
  if (!options.skipInstall && process.env.START_TEST_SKIP_EXECUTION !== "1") {
    verificationFailed = !runCommand(plan.verification.command, target, verification.title, true);
    verificationStatus = verificationFailed ? "failed" : "passed";
    outcome[verificationFailed ? "skipped" : "executed"].push(verification.id);
  } else outcome.skipped.push(verification.id);

  writeFiles(target, { "START_READINESS.md": renderReadinessReport({ plan, executed: outcome.executed, skipped: outcome.skipped, conflicts: outcome.conflicts, resolvedVersions: plannedVersions(target), verification: { command: plan.verification.command, status: verificationStatus } }) });
  if (verificationFailed) fail(`${verification.title} failed. START_READINESS.md records the failed verification; the workspace was preserved for inspection and retry.`);
  initializeGit(target);
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
    const prompter = new TerminalPrompter();
    try {
      config = resolveV3Config(await collectInteractiveWizardState(prompter, options.target));
      const review = buildExecutionPlan(config);
      console.log(`\n${renderPlanMarkdown(review)}`);
      planAlreadyPrinted = true;
      if (options.planOnly || !(await prompter.confirm("executePlan", "Execute this plan now?", true))) return;
    } finally {
      prompter.close();
    }
  }
  const targetDirectory = options.target ?? config.targetDirectory;
  const target = checkTarget(realpathSync(process.cwd()), targetDirectory);
  config = { ...config, targetDirectory };
  const plan = buildExecutionPlan(config);
  if (!planAlreadyPrinted) console.log(renderPlanMarkdown(plan));
  if (options.planOnly) return;
  const outcome = await execute(config, plan, target, options);
  console.log(`\nReadiness report written to ${resolve(target, "START_READINESS.md")}.`);
  console.log(`Executed: ${outcome.executed.join(", ") || "none"}`);
  console.log(`Skipped: ${outcome.skipped.join(", ") || "none"}`);
  console.log("Repository setup is complete. Await a PRD or requirements before implementing product behavior.");
}

void main().catch((error) => fail(error instanceof Error ? error.message : "Unexpected CLI failure."));
