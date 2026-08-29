import assert from "node:assert/strict";
import test from "node:test";
import { resolveV3Config } from "./core.js";
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

test("interactive defaults collect only v3 workspace decisions", async () => {
  const prompter = new RecordingPrompter();
  const state = await collectInteractiveWizardState(prompter);
  const config = resolveV3Config(state);
  const conditional = new Set(["authMethods", "databaseProvider", "orm"]);
  assert.deepEqual(prompter.asked, interactiveQuestionIds.filter((id) => !conditional.has(id)));
  assert.equal(state.version, 3);
  assert.equal(state.stage, "review");
  assert.equal(config.packageManager, "pnpm");
  assert.equal("startingSurface" in state, false);
  assert.equal("designReference" in state, false);
  assert.equal("theme" in config, false);
  assert.equal("firstTask" in config, false);
});

test("interactive advanced v3 choices preserve conditional infrastructure and delivery settings", async () => {
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
  });
  const config = resolveV3Config(await collectInteractiveWizardState(prompter));
  assert.deepEqual(prompter.asked, [...interactiveQuestionIds]);
  assert.equal(config.projectName, "agent-console");
  assert.equal(config.targetDirectory, "apps/console");
  assert.equal(config.primaryAgent, "claude-code");
  assert.deepEqual(config.additionalAgents, ["codex"]);
  assert.equal(config.databaseProvider, "aws-rds");
  assert.equal(config.orm, "prisma");
  assert.deepEqual(config.aiProviders, ["anthropic", "bedrock"]);
  assert.deepEqual(config.testing, ["playwright"]);
  assert.deepEqual(config.observability, ["sentry"]);
  assert.equal(config.ci, "gitlab-ci");
});

test("interactive keeps a Better Auth selection safe when the database confirmation is declined", async () => {
  class DatabaseRequiredPrompter extends RecordingPrompter {
    #databaseAnswers = [false, true];

    override async confirm(id: string, message: string, defaultValue: boolean): Promise<boolean> {
      if (id === "databaseRequired") {
        this.asked.push(id);
        return this.#databaseAnswers.shift() ?? true;
      }
      return super.confirm(id, message, defaultValue);
    }
  }

  const prompter = new DatabaseRequiredPrompter({ authentication: "better-auth" });
  const config = resolveV3Config(await collectInteractiveWizardState(prompter));
  assert.deepEqual(prompter.asked.filter((id) => id === "databaseRequired"), ["databaseRequired", "databaseRequired"]);
  assert.equal(config.databaseRequired, true);
  assert.equal(config.databaseProvider, "neon");
  assert.equal(config.orm, "drizzle");
});
