import type { PackageManager } from "./core.js";

/**
 * shadcn's generated pnpm project declares itself as a workspace, then runs
 * `pnpm add` for its starter dependencies. That add belongs to the generated
 * app root, so pass pnpm's explicit opt-in through to the child process.
 */
export function bootstrapEnvironment(packageManager: PackageManager): NodeJS.ProcessEnv | undefined {
  return packageManager === "pnpm" ? { npm_config_ignore_workspace_root_check: "true" } : undefined;
}
