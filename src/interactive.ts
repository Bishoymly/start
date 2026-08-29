import { createInterface, type Interface as ReadlineInterface } from "node:readline/promises";
import { stdin as defaultInput, stdout as defaultOutput } from "node:process";
import type { Readable, Writable } from "node:stream";
import {
  agents,
  agentLabels,
  createDefaultState,
  databaseOptionsByHosting,
  isValidProjectName,
  isValidTargetDirectory,
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
}

export const interactiveQuestionIds = [
  "projectName", "targetDirectory", "packageManager", "tooling", "agents", "uiFoundation", "shadcnPreset",
  "hosting", "codeHost",
  "authentication", "authMethods", "databaseRequired", "databaseProvider", "orm", "storage", "aiProviders",
  "ciEnabled", "vitest", "playwright", "opentelemetry", "sentry",
] as const;

const choices = <T extends string>(values: readonly T[], labels: Partial<Record<T, string>> = {}): PromptChoice<T>[] => values.map((value) => ({ value, label: labels[value] ?? value }));

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
export async function collectInteractiveWizardState(prompter: InteractivePrompter, initialTargetDirectory?: string): Promise<WizardStateV3> {
  let state = createDefaultState();

  const projectName = await validText(prompter, "projectName", "Project name", state.projectName.value, isValidProjectName, "Use 1–50 lowercase letters, numbers, or hyphens.");
  state = setV3UserDecision(state, "projectName", projectName).state;
  const targetDefault = initialTargetDirectory ?? state.targetDirectory.value;
  const targetDirectory = await validText(prompter, "targetDirectory", "Target folder", targetDefault, isValidTargetDirectory, "Use a safe relative path without spaces, backslashes, or parent-directory segments.");
  state = setV3UserDecision(state, "targetDirectory", targetDirectory).state;

  state = setV3UserDecision(state, "packageManager", await prompter.select<PackageManager>("packageManager", "Package manager", choices(["pnpm", "bun", "npm", "yarn"], { yarn: "Yarn", bun: "Bun" }), state.packageManager.value)).state;
  state = setV3UserDecision(state, "tooling", await prompter.select<ToolingChoice>("tooling", "Code quality", choices(["biome", "eslint-prettier"], { biome: "Biome", "eslint-prettier": "ESLint + Prettier" }), state.tooling.value)).state;

  const selectedAgents = await nonEmptySelection(prompter, "agents", "Coding agents", choices(agents, agentLabels), [state.primaryAgent.value, ...state.additionalAgents.value]);
  state = setV3UserDecision(state, "primaryAgent", selectedAgents[0] as AgentId).state;
  state = setV3UserDecision(state, "additionalAgents", selectedAgents.slice(1) as AgentId[]).state;
  state.stage = "agents";

  state.stage = "preset";

  state = setV3UserDecision(state, "uiFoundation", await prompter.select<UiFoundation>("uiFoundation", "shadcn foundation", choices(["base-ui", "radix-ui"], { "base-ui": "Base UI", "radix-ui": "Radix UI" }), state.uiFoundation.value)).state;
  while (true) {
    const presetInput = await prompter.text("shadcnPreset", "shadcn preset code, init URL, or init command", state.shadcnPreset.value.code);
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

  state = setV3UserDecision(state, "hosting", await prompter.select<HostingChoice>("hosting", "Hosting", choices(["vercel", "cloudflare", "azure", "aws", "gcp", "docker"], { vercel: "Vercel", cloudflare: "Cloudflare", azure: "Azure", aws: "AWS", gcp: "GCP", docker: "Docker" }), state.hosting.value)).state;
  state = setV3UserDecision(state, "codeHost", await prompter.select<CodeHost>("codeHost", "Code host", choices(["github", "gitlab", "azure-devops", "undecided"], { github: "GitHub", gitlab: "GitLab", "azure-devops": "Azure DevOps", undecided: "Undecided" }), state.codeHost.value)).state;

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
    this.#output.write(`  ${message}\n`);
  }

  async text(_id: string, message: string, defaultValue: string): Promise<string> {
    const suffix = defaultValue ? ` [${defaultValue}]` : "";
    const answer = await this.#readline.question(`? ${message}${suffix}: `);
    return answer.trim() || defaultValue;
  }

  async select<T extends string>(_id: string, message: string, options: readonly PromptChoice<T>[], defaultValue: T): Promise<T> {
    const defaultIndex = Math.max(0, options.findIndex((option) => option.value === defaultValue));
    while (true) {
      this.#output.write(`\n? ${message}\n`);
      options.forEach((option, index) => this.#output.write(`  ${index + 1}) ${option.label}${index === defaultIndex ? " (recommended)" : ""}\n`));
      const answer = (await this.#readline.question(`Choose [${defaultIndex + 1}]: `)).trim();
      if (!answer) return options[defaultIndex].value;
      const index = Number(answer) - 1;
      if (Number.isInteger(index) && options[index]) return options[index].value;
      this.note(`Enter a number from 1 to ${options.length}.`);
    }
  }

  async multiSelect<T extends string>(_id: string, message: string, options: readonly PromptChoice<T>[], defaultValues: readonly T[]): Promise<T[]> {
    const defaultIndexes = defaultValues.map((value) => options.findIndex((option) => option.value === value)).filter((index) => index >= 0);
    while (true) {
      this.#output.write(`\n? ${message} (comma-separated)\n`);
      options.forEach((option, index) => this.#output.write(`  ${index + 1}) ${option.label}${defaultIndexes.includes(index) ? " (selected)" : ""}\n`));
      const fallback = defaultIndexes.map((index) => index + 1).join(",");
      const answer = (await this.#readline.question(`Choose${fallback ? ` [${fallback}]` : " (Enter for none)"}: `)).trim();
      if (!answer) return defaultIndexes.map((index) => options[index].value);
      const indexes = [...new Set(answer.split(",").map((item) => Number(item.trim()) - 1))];
      if (indexes.every((index) => Number.isInteger(index) && options[index])) return indexes.map((index) => options[index].value);
      this.note(`Enter comma-separated numbers from 1 to ${options.length}.`);
    }
  }

  async confirm(_id: string, message: string, defaultValue: boolean): Promise<boolean> {
    while (true) {
      const answer = (await this.#readline.question(`? ${message} ${defaultValue ? "[Y/n]" : "[y/N]"}: `)).trim().toLowerCase();
      if (!answer) return defaultValue;
      if (["y", "yes"].includes(answer)) return true;
      if (["n", "no"].includes(answer)) return false;
      this.note("Enter yes or no.");
    }
  }
}
