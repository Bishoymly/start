import { createInterface, type Interface as ReadlineInterface } from "node:readline/promises";
import { stdin as defaultInput, stdout as defaultOutput } from "node:process";
import type { Readable, Writable } from "node:stream";
import type { ExecutionPlanV3 } from "./core.js";
import {
  agents,
  agentLabels,
  createDefaultState,
  databaseOptionsByHosting,
  isValidProjectName,
  parseShadcnPresetInput,
  recomputeRecommendationsV3,
  setV3UserDecision,
  storageOptionsByHosting,
  type AgentId,
  type AiProvider,
  type AuthMethod,
  type CodeHost,
  type DatabaseProvider,
  type HostingChoice,
  type OrmChoice,
  type PackageManager,
  type ShadcnPreset,
  type StorageChoice,
  type ToolingChoice,
  type UiFoundation,
  type WizardStateV3,
} from "./core.js";

export type PromptChoice<T extends string> = { value: T; label: string };

export interface InteractivePrompter {
  text(id: string, message: string, defaultValue: string): Promise<string>;
  select<T extends string>(id: string, message: string, choices: readonly PromptChoice<T>[], defaultValue: T): Promise<T>;
  multiSelect<T extends string>(id: string, message: string, choices: readonly PromptChoice<T>[], defaultValues: readonly T[]): Promise<T[]>;
  confirm(id: string, message: string, defaultValue: boolean): Promise<boolean>;
  note(message: string): void;
  section?(title: string): void;
}

export const interactiveQuestionIds = [
  "projectName", "packageManager", "tooling", "agents", "uiFoundation", "shadcnPreset",
  "hosting", "codeHost",
  "authentication", "authMethods", "databaseRequired", "databaseProvider", "orm", "storage", "aiProviders",
  "ciEnabled", "vitest", "playwright", "opentelemetry", "sentry",
] as const;

const choices = <T extends string>(values: readonly T[], labels: Partial<Record<T, string>> = {}): PromptChoice<T>[] => values.map((value) => ({ value, label: labels[value] ?? value }));

const reset = "\u001B[0m";
const paint = (code: string, value: string) => `\u001B[${code}m${value}${reset}`;
const bold = (value: string) => paint("1", value);
const blue = (value: string) => paint("38;5;81", value);
const cyan = (value: string) => paint("38;5;45", value);
const green = (value: string) => paint("38;5;78", value);
const yellow = (value: string) => paint("38;5;221", value);
const muted = (value: string) => paint("38;5;245", value);
const stripAnsi = (value: string) => value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");

function logoLine(line: string, color: [number, number, number]): string {
  return `\u001B[38;2;${color.join(";")}m${line}${reset}`;
}

async function validText(prompter: InteractivePrompter, id: string, message: string, defaultValue: string, validate: (value: string) => boolean, error: string): Promise<string> {
  while (true) {
    const value = (await prompter.text(id, message, defaultValue)).trim();
    if (validate(value)) return value;
    prompter.note(error);
  }
}

async function nonEmptySelection<T extends string>(prompter: InteractivePrompter, id: string, message: string, options: readonly PromptChoice<T>[], defaults: readonly T[]): Promise<T[]> {
  while (true) {
    const selected = await prompter.multiSelect(id, message, options, defaults);
    if (selected.length) return selected;
    prompter.note("Select at least one option.");
  }
}

/**
 * Collect only durable workspace decisions. Presentation and product questions
 * intentionally belong in the PRD that follows workspace creation.
 */
export async function collectInteractiveWizardState(prompter: InteractivePrompter, initialProjectName?: string): Promise<WizardStateV3> {
  let state = createDefaultState();

  prompter.section?.("Project");
  const projectName = await validText(prompter, "projectName", "What should we call your app?", initialProjectName ?? state.projectName.value, isValidProjectName, "Use 1–50 lowercase letters, numbers, or hyphens.");
  state = setV3UserDecision(state, "projectName", projectName).state;

  state = setV3UserDecision(state, "packageManager", await prompter.select<PackageManager>("packageManager", "Which package manager do you use?", choices(["pnpm", "bun", "npm", "yarn"], { yarn: "Yarn", bun: "Bun" }), state.packageManager.value)).state;
  state = setV3UserDecision(state, "tooling", await prompter.select<ToolingChoice>("tooling", "Which code-quality setup should we configure?", choices(["biome", "eslint-prettier"], { biome: "Biome", "eslint-prettier": "ESLint + Prettier" }), state.tooling.value)).state;

  prompter.section?.("Agents & UI");
  const selectedAgents = await nonEmptySelection(prompter, "agents", "Which coding agents should get project skills?", choices(agents, agentLabels), [state.primaryAgent.value, ...state.additionalAgents.value]);
  state = setV3UserDecision(state, "primaryAgent", selectedAgents[0] as AgentId).state;
  state = setV3UserDecision(state, "additionalAgents", selectedAgents.slice(1) as AgentId[]).state;
  state.stage = "agents";

  state.stage = "preset";

  state = setV3UserDecision(state, "uiFoundation", await prompter.select<UiFoundation>("uiFoundation", "Which shadcn component foundation do you prefer?", choices(["base-ui", "radix-ui"], { "base-ui": "Base UI", "radix-ui": "Radix UI" }), state.uiFoundation.value)).state;
  while (true) {
    const presetInput = await prompter.text("shadcnPreset", "Paste a shadcn preset code, URL, or init command", state.shadcnPreset.value.code);
    try {
      const imported = parseShadcnPresetInput(presetInput);
      state = setV3UserDecision(state, "shadcnPreset", imported.preset as ShadcnPreset).state;
      if (imported.foundation) state = setV3UserDecision(state, "uiFoundation", imported.foundation).state;
      break;
    } catch (error) {
      prompter.note(error instanceof Error ? error.message : "That preset could not be imported.");
    }
  }
  state.stage = "infrastructure";

  prompter.section?.("Infrastructure");
  state = setV3UserDecision(state, "hosting", await prompter.select<HostingChoice>("hosting", "Where will this app run?", choices(["vercel", "cloudflare", "azure", "aws", "gcp", "docker"], { vercel: "Vercel", cloudflare: "Cloudflare", azure: "Azure", aws: "AWS", gcp: "GCP", docker: "Docker" }), state.hosting.value)).state;
  state = setV3UserDecision(state, "codeHost", await prompter.select<CodeHost>("codeHost", "Where will the repository live?", choices(["github", "gitlab", "azure-devops", "undecided"], { github: "GitHub", gitlab: "GitLab", "azure-devops": "Azure DevOps", undecided: "Undecided" }), state.codeHost.value)).state;

  state = setV3UserDecision(state, "authentication", await prompter.select<"none" | "better-auth">("authentication", "Authentication", choices(["none", "better-auth"], { none: "No authentication", "better-auth": "Better Auth" }), state.authentication.value)).state;
  if (state.authentication.value === "better-auth") {
    const methods = await nonEmptySelection<AuthMethod>(prompter, "authMethods", "Sign-in methods", choices(["email-password", "github", "google", "microsoft"], { "email-password": "Email & password", github: "GitHub", google: "Google", microsoft: "Microsoft" }), state.authMethods.value);
    state = setV3UserDecision(state, "authMethods", methods).state;
  }

  while (true) {
    const databaseRequired = await prompter.confirm("databaseRequired", "Include a Postgres database?", state.databaseRequired.value);
    if (state.authentication.value === "better-auth" && !databaseRequired) {
      prompter.note("Better Auth requires a database.");
      continue;
    }
    state = setV3UserDecision(state, "databaseRequired", databaseRequired).state;
    break;
  }
  if (state.databaseRequired.value) {
    const databaseOptions = databaseOptionsByHosting[state.hosting.value];
    state = setV3UserDecision(state, "databaseProvider", await prompter.select<DatabaseProvider>("databaseProvider", "Postgres provider", choices(databaseOptions, { neon: "Neon", supabase: "Supabase", docker: "Docker", "existing-url": "Existing URL", "azure-postgresql": "Azure PostgreSQL", "aws-rds": "AWS RDS", "gcp-cloud-sql": "GCP Cloud SQL" }), state.databaseProvider.value)).state;
    state = setV3UserDecision(state, "orm", await prompter.select<OrmChoice>("orm", "ORM", choices(["drizzle", "prisma"], { drizzle: "Drizzle", prisma: "Prisma" }), state.orm.value)).state;
  }
  const storageOptions = storageOptionsByHosting[state.hosting.value];
  state = setV3UserDecision(state, "storage", await prompter.select<StorageChoice>("storage", "Object storage", choices(storageOptions, { none: "None", "vercel-blob": "Vercel Blob", s3: "Amazon S3", r2: "Cloudflare R2", "azure-blob": "Azure Blob", gcs: "Google Cloud Storage", "supabase-storage": "Supabase Storage" }), state.storage.value)).state;
  state = setV3UserDecision(state, "aiProviders", await prompter.multiSelect<AiProvider>("aiProviders", "AI providers", choices(["openai", "anthropic", "google", "azure-openai", "bedrock", "vertex", "vercel-ai-gateway"], { openai: "OpenAI", anthropic: "Anthropic", google: "Google", "azure-openai": "Azure OpenAI", bedrock: "Amazon Bedrock", vertex: "Google Vertex", "vercel-ai-gateway": "Vercel AI Gateway" }), state.aiProviders.value)).state;

  state.stage = "quality";
  prompter.section?.("Quality & delivery");
  state = setV3UserDecision(state, "ciEnabled", await prompter.confirm("ciEnabled", "Include continuous integration?", state.ciEnabled.value)).state;
  state = setV3UserDecision(state, "vitest", await prompter.confirm("vitest", "Include Vitest?", state.vitest.value)).state;
  state = setV3UserDecision(state, "playwright", await prompter.confirm("playwright", "Include Playwright?", state.playwright.value)).state;
  state = setV3UserDecision(state, "opentelemetry", await prompter.confirm("opentelemetry", "Include OpenTelemetry?", state.opentelemetry.value)).state;
  state = setV3UserDecision(state, "sentry", await prompter.confirm("sentry", "Include Sentry?", state.sentry.value)).state;

  state.stage = "review";
  return recomputeRecommendationsV3(state).state;
}

export class TerminalPrompter implements InteractivePrompter {
  readonly #readline: ReadlineInterface;
  readonly #output: Writable;

  constructor(input: Readable = defaultInput, output: Writable = defaultOutput) {
    this.#output = output;
    this.#readline = createInterface({ input, output });
  }

  close(): void {
    this.#readline.close();
  }

  note(message: string): void {
    this.#output.write(`  ${yellow("!")} ${yellow(message)}\n`);
  }

  section(title: string): void {
    this.#output.write(`\n${cyan("━━")} ${bold(cyan(title.toUpperCase()))}\n`);
  }

  #resolved(value: string): void {
    this.#output.write(`  ${green("✓")} ${green(value)}\n`);
  }

  async text(_id: string, message: string, defaultValue: string): Promise<string> {
    this.#output.write(`\n${cyan("?")} ${bold(message)}\n`);
    const suffix = defaultValue ? ` [${defaultValue}]` : "";
    const answer = await this.#readline.question(`  ${blue("›")} ${muted(`Enter a value${suffix}`)} `);
    const value = answer.trim() || defaultValue;
    this.#resolved(value);
    return value;
  }

  async select<T extends string>(_id: string, message: string, options: readonly PromptChoice<T>[], defaultValue: T): Promise<T> {
    const defaultIndex = Math.max(0, options.findIndex((option) => option.value === defaultValue));
    while (true) {
      this.#output.write(`\n${cyan("?")} ${bold(message)}\n`);
      options.forEach((option, index) => {
        const selected = index === defaultIndex;
        this.#output.write(`  ${selected ? cyan("●") : muted("○")} ${muted(`${index + 1}.`)} ${selected ? bold(option.label) : option.label}${selected ? ` ${muted("(recommended)")}` : ""}\n`);
      });
      const answer = (await this.#readline.question(`  ${blue("›")} ${muted(`Select [${defaultIndex + 1}]`)} `)).trim();
      if (!answer) {
        this.#resolved(options[defaultIndex].label);
        return options[defaultIndex].value;
      }
      const index = Number(answer) - 1;
      if (Number.isInteger(index) && options[index]) {
        this.#resolved(options[index].label);
        return options[index].value;
      }
      this.note(`Enter a number from 1 to ${options.length}.`);
    }
  }

  async multiSelect<T extends string>(_id: string, message: string, options: readonly PromptChoice<T>[], defaultValues: readonly T[]): Promise<T[]> {
    const defaultIndexes = defaultValues.map((value) => options.findIndex((option) => option.value === value)).filter((index) => index >= 0);
    while (true) {
      this.#output.write(`\n${cyan("?")} ${bold(message)}\n`);
      options.forEach((option, index) => {
        const selected = defaultIndexes.includes(index);
        this.#output.write(`  ${selected ? cyan("◼") : muted("◻")} ${muted(`${index + 1}.`)} ${selected ? bold(option.label) : option.label}${selected ? ` ${muted("(selected)")}` : ""}\n`);
      });
      const fallback = defaultIndexes.map((index) => index + 1).join(",");
      const prompt = `Select comma-separated values${fallback ? ` [${fallback}]` : " (Enter for none)"}`;
      const answer = (await this.#readline.question(`  ${blue("›")} ${muted(prompt)} `)).trim();
      if (!answer) {
        const selected = defaultIndexes.map((index) => options[index]);
        this.#resolved(selected.length ? selected.map((option) => option.label).join(", ") : "None");
        return selected.map((option) => option.value);
      }
      const indexes = [...new Set(answer.split(",").map((item) => Number(item.trim()) - 1))];
      if (indexes.every((index) => Number.isInteger(index) && options[index])) {
        const selected = indexes.map((index) => options[index]);
        this.#resolved(selected.map((option) => option.label).join(", "));
        return selected.map((option) => option.value);
      }
      this.note(`Enter comma-separated numbers from 1 to ${options.length}.`);
    }
  }

  async confirm(_id: string, message: string, defaultValue: boolean): Promise<boolean> {
    while (true) {
      const answer = (await this.#readline.question(`\n${cyan("?")} ${bold(message)} ${muted(defaultValue ? "[Y/n]" : "[y/N]")} ${blue("›")} `)).trim().toLowerCase();
      if (!answer) {
        this.#resolved(defaultValue ? "Yes" : "No");
        return defaultValue;
      }
      if (["y", "yes"].includes(answer)) {
        this.#resolved("Yes");
        return true;
      }
      if (["n", "no"].includes(answer)) {
        this.#resolved("No");
        return false;
      }
      this.note("Enter yes or no.");
    }
  }
}

export function renderSplash(version = "0.5.0"): string {
  return [
    "",
    logoLine(" ███████╗ ████████╗  █████╗  ██████╗  ████████╗", [127, 136, 255]),
    logoLine(" ██╔════╝ ╚══██╔══╝ ██╔══██╗ ██╔══██╗ ╚══██╔══╝", [113, 147, 255]),
    logoLine(" ███████╗    ██║    ███████║ ██████╔╝    ██║", [98, 159, 255]),
    logoLine(" ╚════██║    ██║    ██╔══██║ ██╔══██╗    ██║", [83, 170, 255]),
    logoLine(" ███████║    ██║    ██║  ██║ ██║  ██║    ██║", [68, 180, 255]),
    logoLine(" ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝    ╚═╝", [78, 168, 255]),
    `  ${bold(blue(`v${version}`))} ${muted("Build an agent-ready Next.js workspace.")}`,
    "",
  ].join("\n");
}

/** Compact terminal review; durable project records stay in START_PLAN.md. */
export function renderPlanPreview(plan: ExecutionPlanV3, useColor = true): string {
  const steps = plan.steps.map((step, index) => {
    const command = step.command ? `\n     ${muted("$ ")}${yellow(step.command.command)}` : "";
    return `  ${cyan(`${String(index + 1).padStart(2, "0")} ›`)} ${bold(step.title)}${command}`;
  });
  const warnings = plan.warnings.length ? `\n\n  ${yellow("!")} ${plan.warnings.map((warning) => muted(warning)).join(`\n  ${yellow("!")} `)}` : "";
  const preview = [
    "",
    `  ${blue("◆")} ${bold("REVIEW")}`,
    `  ${muted("Blueprint")} ${cyan("v3")}`,
    `  ${muted("────────────────────────────────────────")}`,
    steps.join("\n\n"),
    `\n  ${green("✓")} ${bold("Verify")} ${yellow(plan.verification.command)}`,
    warnings,
    "",
  ].join("\n");
  return useColor ? preview : stripAnsi(preview);
}
