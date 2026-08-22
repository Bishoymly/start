import assert from "node:assert/strict";
import test from "node:test";
import { resolveStarterConfig } from "./core.js";
import { collectInteractiveWizardState, interactiveQuestionIds, type InteractivePrompter, type PromptChoice } from "./interactive.js";

class RecordingPrompter implements InteractivePrompter {
  readonly asked: string[] = [];

  constructor(private readonly answers: Record<string, unknown> = {}) {}

  note(): void {}

  async text(id: string, _message: string, defaultValue: string): Promise<string> {
    this.asked.push(id);
    return String(this.answers[id] ?? defaultValue);
  }

  async select<T extends string>(id: string, _message: string, _choices: readonly PromptChoice<T>[], defaultValue: T): Promise<T> {
    this.asked.push(id);
    return (this.answers[id] ?? defaultValue) as T;
  }

  async multiSelect<T extends string>(id: string, _message: string, _choices: readonly PromptChoice<T>[], defaultValues: readonly T[]): Promise<T[]> {
    this.asked.push(id);
    return [...((this.answers[id] ?? defaultValues) as readonly T[])];
  }

  async confirm(id: string, _message: string, defaultValue: boolean): Promise<boolean> {
    this.asked.push(id);
    return Boolean(this.answers[id] ?? defaultValue);
  }
}

test("interactive defaults ask every visible web question and resolve without a design", async () => {
  const prompter = new RecordingPrompter();
  const config = resolveStarterConfig(await collectInteractiveWizardState(prompter));
  const conditional = new Set(["authMethods", "databaseProvider", "orm"]);
  assert.deepEqual(prompter.asked, interactiveQuestionIds.filter((id) => !conditional.has(id)));
  assert.equal(config.designReference, null);
  assert.equal(config.designSource, null);
  assert.equal(config.packageManager, "pnpm");
  assert.equal(config.startingSurface, "minimal");
});

test("interactive advanced choices match the web wizard conditionals", async () => {
  const prompter = new RecordingPrompter({
    projectName: "agent-console",
    targetDirectory: "apps/console",
    packageManager: "npm",
    tooling: "eslint-prettier",
    agents: ["claude-code", "codex"],
    hosting: "aws",
    codeHost: "gitlab",
    uiFoundation: "radix-ui",
    shadcnPreset: "b0",
    startingSurface: "sidebar",
    designReference: "spotify",
    theme: "dark",
    motion: "expressive",
    authentication: "better-auth",
    authMethods: ["github", "microsoft"],
    databaseRequired: true,
    databaseProvider: "aws-rds",
    orm: "prisma",
    storage: "s3",
    aiProviders: ["anthropic", "bedrock"],
    ciEnabled: true,
    vitest: false,
    playwright: true,
    opentelemetry: false,
    sentry: true,
    firstTask: "Build the authenticated console shell",
  });
  const config = resolveStarterConfig(await collectInteractiveWizardState(prompter));
  assert.deepEqual(prompter.asked, [...interactiveQuestionIds]);
  assert.equal(config.projectName, "agent-console");
  assert.equal(config.targetDirectory, "apps/console");
  assert.equal(config.primaryAgent, "claude-code");
  assert.deepEqual(config.additionalAgents, ["codex"]);
  assert.equal(config.designReference, "spotify");
  assert.equal(config.designSource?.repository, "voltagent/awesome-design-md");
  assert.equal(config.databaseProvider, "aws-rds");
  assert.equal(config.orm, "prisma");
  assert.deepEqual(config.aiProviders, ["anthropic", "bedrock"]);
  assert.deepEqual(config.testing, ["playwright"]);
  assert.deepEqual(config.observability, ["sentry"]);
  assert.equal(config.ci, "gitlab-ci");
});
