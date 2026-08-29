import assert from "node:assert/strict";
import test from "node:test";
import { bootstrapEnvironment } from "./bootstrap.js";

test("pnpm shadcn bootstrap permits dependencies in its generated workspace root", () => {
  assert.deepEqual(bootstrapEnvironment("pnpm"), { npm_config_ignore_workspace_root_check: "true" });
  assert.equal(bootstrapEnvironment("npm"), undefined);
  assert.equal(bootstrapEnvironment("yarn"), undefined);
  assert.equal(bootstrapEnvironment("bun"), undefined);
});
