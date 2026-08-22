#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { resolve } from "node:path";
import { buildAgentKickoffPrompt, decodeBlueprint, isValidTargetDirectory, agentLabels, resolveStarterConfig, type AgentId, type StarterConfigV2 } from "./core.js";
import { verifyDesignMarkdown } from "./design.js";
import { collectInteractiveWizardState, TerminalPrompter, type InteractivePrompter } from "./interactive.js";
import { renderAgents, renderBlueprint, renderSkillsLock, renderWorkspaceFiles, renderWorkflows, skillBundle } from "./render.js";

const args = process.argv.slice(2);
const blueprintIndex = args.indexOf("--blueprint");
const targetArg = args.find((argument, index) => !argument.startsWith("-") && index !== blueprintIndex + 1);
const skipInstall = args.includes("--skip-install");
const webBuilderUrl = "https://bishoy.io/start";

function fail(message: string): never {
  console.error(`\nStart generation stopped: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`@bishoymly/start

Usage:
  pnpm dlx @bishoymly/start@latest
  pnpm dlx @bishoymly/start@latest [target-folder]
  pnpm dlx @bishoymly/start@latest --web
  pnpm dlx @bishoymly/start@latest [target-folder] --blueprint v2.<token> [--skip-install]

Without --blueprint, Start asks the same project, UI, service, and delivery questions as the web builder.

Options:
  --blueprint <token>  Generate from a portable web or CLI blueprint
  --web               Open ${webBuilderUrl}
  --skip-install      Write the workspace without installing dependencies
  --help, -h          Show this help`);
}

function openWebBuilder(): boolean {
  const command: [string, string[]] = platform() === "darwin"
    ? ["open", [webBuilderUrl]]
    : platform() === "win32"
      ? ["cmd", ["/c", "start", "", webBuilderUrl]]
      : ["xdg-open", [webBuilderUrl]];
  const result = spawnSync(command[0], command[1], { stdio: "ignore" });
  if (result.status === 0) {
    console.log(`Opened ${webBuilderUrl}`);
    return true;
  }
  console.log(`Open the web builder: ${webBuilderUrl}`);
  return false;
}

async function configureInteractively(prompter: InteractivePrompter & { close(): void }): Promise<StarterConfigV2 | null> {
  try {
    const mode = await prompter.select("configurationMode", "Where do you want to configure Start?", [
      { value: "terminal", label: "In this terminal" },
      { value: "web", label: "Open the web builder" },
    ] as const, "terminal");
    if (mode === "web") {
      openWebBuilder();
      return null;
    }
    console.log("\nAnswer the same sections as bishoy.io/start. Press Enter to accept a recommendation.\n");
    const state = await collectInteractiveWizardState(prompter, targetArg);
    const resolved = resolveStarterConfig(state);
    console.log(`\nReady to create ${resolved.projectName} in ${resolved.targetDirectory}.`);
    const confirmed = await prompter.confirm("generate", "Generate this workspace now?", true);
    return confirmed ? resolved : null;
  } finally {
    prompter.close();
  }
}

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

if (args.includes("--web")) {
  openWebBuilder();
  process.exit(0);
}

let config: StarterConfigV2;
if (blueprintIndex >= 0) {
  if (!args[blueprintIndex + 1]) fail("--blueprint requires a v2 token.");
  try {
    config = decodeBlueprint(args[blueprintIndex + 1]);
  } catch (error) {
    fail(error instanceof Error ? error.message : "Invalid blueprint.");
  }
} else {
  if (!process.stdin.isTTY || !process.stdout.isTTY) fail(`Interactive setup requires a terminal. Use --blueprint <token> or open ${webBuilderUrl}.`);
  let interactiveConfig: StarterConfigV2 | null = null;
  try {
    interactiveConfig = await configureInteractively(new TerminalPrompter());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ABORT_ERR") process.exit(130);
    fail(error instanceof Error ? error.message : "Interactive setup failed.");
  }
  if (!interactiveConfig) process.exit(0);
  config = interactiveConfig;
}

const targetDirectory = targetArg ?? config.targetDirectory;
if (!isValidTargetDirectory(targetDirectory)) fail("Target folder must be a safe relative path without spaces, backslashes, or parent-directory segments.");
config = { ...config, targetDirectory };

const generationRoot = realpathSync(process.cwd());
let targetCursor = generationRoot;
for (const segment of targetDirectory === "." ? [] : targetDirectory.split("/")) {
  targetCursor = resolve(targetCursor, segment);
  if (existsSync(targetCursor) && lstatSync(targetCursor).isSymbolicLink()) fail("Target folder cannot pass through symbolic links.");
}
const target = resolve(generationRoot, targetDirectory);
if (existsSync(target) && readdirSync(target).length > 0) fail(`Refusing to overwrite non-empty folder: ${target}`);
mkdirSync(target, { recursive: true });

const write = (path: string, content: string) => {
  const absolute = resolve(target, path);
  mkdirSync(resolve(absolute, ".."), { recursive: true });
  writeFileSync(absolute, content, "utf8");
};

write("APP_BLUEPRINT.md", renderBlueprint(config));
write("AGENTS.md", renderAgents(config));
write("skills-lock.json", renderSkillsLock());

async function fetchDesign(): Promise<string> {
  if (!config.designSource) throw new Error("Cannot fetch a design without pinned provenance.");
  const designSource = config.designSource;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const url = `https://raw.githubusercontent.com/${designSource.repository}/${designSource.commit}/${designSource.path}`;
    const response = await fetch(url, { signal: controller.signal, redirect: "error", headers: { Accept: "text/plain" } });
    if (!response.ok) throw new Error(`upstream returned ${response.status}`);
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > 256_000) throw new Error("upstream file exceeds 256 KB");
    const markdown = await response.text();
    try {
      return verifyDesignMarkdown(markdown, designSource);
    } catch {
      throw new Error("upstream hash verification failed");
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown upstream failure";
    write("DESIGN_FETCH_ERROR.md", `# Recoverable design fetch error\n\nThe project folder was preserved. Retry the same command when the pinned source is available.\n\nReason: ${reason}\n\nCommit: ${designSource.commit}\n\nSHA-256: ${designSource.sha256}\n`);
    fail(`${reason}. The generated folder was preserved with recovery details.`);
  } finally {
    clearTimeout(timer);
  }
}

function agentConfig(agent: AgentId): { path: string; content: string } {
  const designDocument = config.designReference ? ", /DESIGN.md" : "";
  const body = `Read /APP_BLUEPRINT.md${designDocument}, and /AGENTS.md before editing. Use the portable workflows in /.agents/commands/. Run ${config.packageManager} run verify before shipping.`;
  const instructionFiles = config.designReference ? ["APP_BLUEPRINT.md", "DESIGN.md", "AGENTS.md"] : ["APP_BLUEPRINT.md", "AGENTS.md"];
  const files: Record<AgentId, { path: string; content: string }> = {
    codex: { path: ".codex/instructions.md", content: body },
    "claude-code": { path: "CLAUDE.md", content: body },
    cursor: { path: ".cursor/rules/start.mdc", content: `---\ndescription: Start blueprint contract\nalwaysApply: true\n---\n${body}` },
    "github-copilot": { path: ".github/copilot-instructions.md", content: body },
    "gemini-cli": { path: "GEMINI.md", content: body },
    opencode: { path: "opencode.json", content: JSON.stringify({ instructions: instructionFiles }, null, 2) },
    windsurf: { path: ".windsurf/rules/start.md", content: body },
    "grok-build": { path: ".grok/instructions.md", content: body },
  };
  return files[agent];
}

function skillInstructions(name: string, purpose: string, source: string): string {
  const designInstruction = config.designReference ? " and DESIGN.md" : "";
  const designRule = config.designReference ? " Preserve the selected design reference." : "";
  return `---\nname: ${name}\ndescription: ${purpose}\nsource: https://github.com/${source}\n---\n\n# ${name}\n\nUse this project-local capability when its description matches the task. Read APP_BLUEPRINT.md${designInstruction} first.${designRule} Preserve the selected provider choices. Verify claims with the current codebase and report concrete evidence.\n`;
}

if (config.designReference) write("DESIGN.md", await fetchDesign());
Object.entries(renderWorkspaceFiles(config)).forEach(([path, content]) => write(path, content));
Object.entries(renderWorkflows(config)).forEach(([name, content]) => write(`.agents/commands/${name}.md`, content + "\n"));
skillBundle.forEach((skill) => write(`.agents/skills/${skill.skill}/SKILL.md`, skillInstructions(skill.skill, skill.purpose, skill.source)));
[config.primaryAgent, ...config.additionalAgents].forEach((agent) => {
  const file = agentConfig(agent);
  write(file.path, file.content + "\n");
});

if (!skipInstall) {
  const commands: Record<StarterConfigV2["packageManager"], [string, string[]]> = {
    npm: ["npm", ["install"]],
    pnpm: ["pnpm", ["install"]],
    yarn: ["yarn", ["install"]],
    bun: ["bun", ["install"]],
  };
  const [executable, commandArgs] = commands[config.packageManager];
  console.log(`\nInstalling dependencies with ${config.packageManager}...`);
  const result = spawnSync(executable, commandArgs, { cwd: target, stdio: "inherit" });
  if (result.status !== 0) fail(`Dependency installation failed. The folder is intact; run ${executable} ${commandArgs.join(" ")} in ${target} to retry.`);

  const formatterCommands: Record<StarterConfigV2["packageManager"], [string, string[]]> = config.tooling === "biome"
    ? {
        npm: ["npx", ["biome", "format", "--write", "."]],
        pnpm: ["pnpm", ["exec", "biome", "format", "--write", "."]],
        yarn: ["yarn", ["exec", "biome", "format", "--write", "."]],
        bun: ["bunx", ["biome", "format", "--write", "."]],
      }
    : {
        npm: ["npx", ["prettier", "--write", "."]],
        pnpm: ["pnpm", ["exec", "prettier", "--write", "."]],
        yarn: ["yarn", ["exec", "prettier", "--write", "."]],
        bun: ["bunx", ["prettier", "--write", "."]],
      };
  const [formatter, formatterArgs] = formatterCommands[config.packageManager];
  console.log(`\nFormatting the generated workspace with ${config.tooling === "biome" ? "Biome" : "Prettier"}...`);
  const formatted = spawnSync(formatter, formatterArgs, { cwd: target, stdio: "inherit" });
  if (formatted.status !== 0) fail(`Formatting failed. The folder is intact; run ${formatter} ${formatterArgs.join(" ")} in ${target} to retry.`);

  if (config.testing.includes("playwright")) {
    const runArgs = ["run", "test:e2e:install"];
    console.log("\nInstalling the Chromium browser selected for Playwright...");
    const browserInstalled = spawnSync(config.packageManager, runArgs, { cwd: target, stdio: "inherit" });
    if (browserInstalled.status !== 0) fail(`Playwright browser installation failed. The folder is intact; run ${config.packageManager} run test:e2e:install in ${target} to retry.`);
  }
}

function initializeGit() {
  const existing = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: target, encoding: "utf8" });
  if (existing.status === 0) {
    console.log(`Using existing Git repository: ${existing.stdout.trim()}`);
    return;
  }
  if (existing.error && (existing.error as NodeJS.ErrnoException).code === "ENOENT") {
    console.warn(`Git is not installed. Initialize later with: cd ${targetDirectory} && git init --initial-branch=main`);
    return;
  }
  const initialized = spawnSync("git", ["init", "--initial-branch=main"], { cwd: target, encoding: "utf8" });
  if (initialized.status === 0) console.log("Initialized Git repository on main.");
  else console.warn(`Git initialization failed. Retry with: cd ${targetDirectory} && git init --initial-branch=main`);
}

initializeGit();

console.log(`\nCreated ${config.projectName} in ${target}`);
console.log(`Coding agents: ${[config.primaryAgent, ...config.additionalAgents].map((agent) => agentLabels[agent]).join(", ")}`);
console.log(config.designReference && config.designSource ? `Design: ${config.designReference} from ${config.designSource.repository}` : "Design: none");
console.log(`Next: ${targetDirectory === "." ? "" : `cd ${targetDirectory} && `}${config.packageManager} run dev`);
console.log(`\nAgent kickoff:\n${buildAgentKickoffPrompt(config)}`);
