import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createDefaultState, encodeV3Blueprint, resolveV3Config, setV3UserDecision } from "./core.js";

const cli = new URL("./cli.js", import.meta.url);
const live = process.env.START_LIVE_GOLDEN === "1";
const fullRun = process.env.START_FULL_RUN === "1";

function blueprint(configure: (state: ReturnType<typeof createDefaultState>) => ReturnType<typeof createDefaultState>) {
  const configured = configure(createDefaultState());
  return encodeV3Blueprint(resolveV3Config(setV3UserDecision(configured, "projectName", "app").state));
}

test("full generation succeeds from a fresh directory", { skip: !live && !fullRun }, () => {
  const cases = [
    ["baseline", blueprint((state) => state)],
    ["vercel-full", blueprint((state) => {
      state = setV3UserDecision(state, "authentication", "better-auth").state;
      state = setV3UserDecision(state, "storage", "vercel-blob").state;
      state = setV3UserDecision(state, "aiProviders", ["vercel-ai-gateway"]).state;
      return state;
    })],
    ["azure-alternative", blueprint((state) => {
      state = setV3UserDecision(state, "hosting", "azure").state;
      state = setV3UserDecision(state, "databaseRequired", true).state;
      state = setV3UserDecision(state, "databaseProvider", "azure-postgresql").state;
      state = setV3UserDecision(state, "storage", "azure-blob").state;
      state = setV3UserDecision(state, "aiProviders", ["azure-openai"]).state;
      return state;
    })],
  ] as const;
  const selectedCases = fullRun ? cases.slice(0, 1) : cases;
  for (const [name, token] of selectedCases) {
    const root = mkdtempSync(join(tmpdir(), `start-golden-${name}-`));
    const result = spawnSync(process.execPath, [cli.pathname, "app", "--blueprint", token], { cwd: root, encoding: "utf8", env: process.env, timeout: 10 * 60_000 });
    assert.equal(result.status, 0, `${name}: ${result.stderr}\n${result.stdout}`);
    const target = join(root, "app");
    assert.equal(existsSync(join(target, "docs", "START_PLAN.md")), true);
    assert.match(readFileSync(join(target, "docs", "START_READINESS.md"), "utf8"), /Status: passed/);
  }
});
