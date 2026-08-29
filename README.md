# Start

Start turns an empty folder into a verified, agent-ready Next.js repository in one reviewable run.

It is a repository-readiness orchestrator, not a product template. Start calls the official shadcn CLI, preserves the chosen preset, and then adds only the durable tooling and infrastructure selected in a portable blueprint. It never invents a product page, navigation, database entities, dashboards, uploads, chats, or a first task.

```bash
pnpm dlx @bishoymly/start@latest --web
```

[Build a blueprint](https://bishoy.io/start) · [View the source](https://github.com/Bishoymly/start) · [Open the npm package](https://www.npmjs.com/package/@bishoymly/start)

## Review before writing

Every v3 blueprint resolves to the same ordered execution plan in the web builder and CLI. Inspect it without changing a directory:

```bash
pnpm dlx @bishoymly/start@latest my-app --blueprint v3.<token> --plan
```

The plan distinguishes official commands from Start-owned configuration, and lists:

- The selected shadcn preset and official initialization command.
- Project-local skills and the selected coding agents.
- Environment-variable contracts and capability requirements.
- Quality, browser, CI, and production-build verification steps.
- Compatibility warnings and any unavailable capabilities.

Run the reviewed plan when you are ready:

```bash
pnpm dlx @bishoymly/start@latest my-app --blueprint v3.<token>
```

Fresh runs intentionally use current upstream tools. The generated readiness report records the versions actually resolved, the steps executed or skipped, warnings, and verification results.

## What Start owns

Start orchestrates the official [shadcn CLI](https://ui.shadcn.com/docs/cli) rather than copying its templates. After the official template is in place, Start can configure a focused baseline:

- strict TypeScript; Biome or ESLint with Prettier
- Vitest, Playwright with Chromium, and one `verify` command that includes the production build
- CI that runs that exact verification command
- `AGENTS.md`, native entry points for selected agents, and project-local design, `next-dev-loop`, and `agent-browser` skills
- optional database/migration, authentication, storage, AI-provider, observability, and deployment plumbing

Conditional capabilities create durable framework layers, dependencies, commands, and environment contracts only. Unselected capabilities do not leak files, dependencies, or variables into the result.

## Convergent and safe

Start checks a command or capability's postcondition on reruns:

1. Missing state is applied.
2. Matching state is skipped.
3. Differing state becomes one coherent conflict decision.

The official template is resumable only when `.start/v3-state.json` matches the exact v3 blueprint; an existing official-looking directory without that marker is a conflict, never a silent skip. Interactive runs can preserve or explicitly overwrite one scoped configuration step. In non-interactive mode, authorize only the exact step, for example `--overwrite start-quality`; there is no global overwrite. Path traversal and symbolic-link escapes are rejected for every output path and ancestor before writing.

When the readiness report is clean, the generated repository is ready for product work—but the agent instructions deliberately say to await a PRD or requirements before implementing product behavior.

## Development

Start requires Node.js 20 or later.

```bash
npm install
npm test
```

The CLI and planner tests cover the portable v3 contract. An opt-in release suite runs baseline, Vercel full-stack, and Azure alternative blueprints through the live CLI, install, browser verification, and generated baseline evidence:

```bash
START_LIVE_GOLDEN=1 npm test
```

## Releasing

Releases use npm trusted publishing through GitHub Actions, so the workflow does not need an npm token or a manual one-time password.

After the npm trusted publisher is configured for this repository, merge a version and changelog update to `main`, then either run **Publish package** from the Actions tab on `main` or create and push the matching tag:

```bash
git tag v<version>
git push origin v<version>
```

The workflow rejects manual runs outside `main` and tags that do not match the package version.

Start is released under the [MIT License](./LICENSE).
