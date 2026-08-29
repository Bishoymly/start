# Changelog

All notable changes to Start are documented here.

## [0.6.10] - 2026-08-29

- Correct the shadcn bulk-component flag to `--overwrite`, which the current CLI accepts.

## [0.6.9] - 2026-08-29

- Lead the project README with the interactive `npx` workflow and link the web wizard for portable blueprints.
- Show the three consolidated project-skill install commands in plan review, install each for every selected agent, and overwrite the starter component file when adding all shadcn components.
- Expand generated README and agent instructions with environment setup, build/test/Playwright commands, Next.js guidance, project structure, verification, shadcn blocks, and a clear distinction between the completed generation record and future work.
- Commit the verified generated baseline automatically in newly initialized Git repositories.

## [0.6.8] - 2026-08-29

- Install every available shadcn UI component through the official CLI and keep its upstream component source out of application linting.
- Add concise Karpathy-inspired agent rules, project-local skills guidance, shared agent commands, hooks, and operational documentation under `/docs`.
- Pin the generated Node, pnpm, framework, test, and browser-tool versions; add `.nvmrc`, `packageManager`, engines, Husky, and lint-staged.
- Make `.env.example` trackable, ignore browser artifacts in Git, and make generated GitHub Actions install the pinned pnpm release before verification.
- Replace the project README with open-source contributor documentation and remove the obsolete launch pack.

## [0.6.7] - 2026-08-29

- Resolve current Next.js, React, Vitest, and Playwright releases in fresh generated workspaces.
- Remove unused upstream ESLint/Prettier packages for Biome projects, migrate Biome's deprecated rule setting, and format the initial source before verification.
- Keep repeated verification clean by ignoring generated Playwright output and Next-managed TypeScript configuration.
- Report the exact hidden project-local skill paths when skills are installed or reused, and allow Playwright's local Next origin without warnings.

## [0.6.6] - 2026-08-29

- Fixed the generated Vitest contract so it checks files that exist before readiness verification runs.

## [0.6.5] - 2026-08-29

- Allow the initial pnpm install to update the lockfile in CI after Start adds its selected tooling.

## [0.6.4] - 2026-08-29

- Added a required CI full-generation job that creates, verifies, and builds a fresh workspace.
- Fixed the live blueprint test's app-name mismatch and generated Vitest readiness test.
- Updated generated Biome configuration for shadcn Tailwind directives.

## [0.6.3] - 2026-08-29

- Automatically overwrite Start-owned configuration to match the selected blueprint without prompts.
- Group project skill installation into one command and use light-blue execution progress indicators.
- Ensure selected quality tooling, including Playwright, is applied before dependencies and browser installation run.

## [0.6.2] - 2026-08-29

- Fixed the published package allowlist so the CLI includes its pnpm bootstrap helper.

## [0.6.1] - 2026-08-29

- Added a filled, gradient START splash plus colored wizard prompts and a compact terminal plan review.
- Added numbered execution progress lines before every external command.
- Fixed pnpm shadcn bootstrap when the generated app is a workspace root.

## [0.4.0] - 2026-08-21

- Added a complete guided terminal builder aligned with the web blueprint flow.
- Added deterministic blueprint v2 commands and intentionally removed blueprint v1 support.
- Added shadcn preset importing and minimal, top-navigation, and sidebar starting surfaces.
- Added tailored kickoff prompts for the selected coding agent.
- Added optional Better Auth, database, storage, AI, observability, testing, and CI integrations.
- Added Playwright browser installation and a generated portable `verify` contract.

[0.4.0]: https://github.com/bishoymly/start/releases/tag/v0.4.0
[0.6.10]: https://github.com/bishoymly/start/releases/tag/v0.6.10
[0.6.9]: https://github.com/bishoymly/start/releases/tag/v0.6.9
[0.6.8]: https://github.com/bishoymly/start/releases/tag/v0.6.8
[0.6.7]: https://github.com/bishoymly/start/releases/tag/v0.6.7
[0.6.1]: https://github.com/bishoymly/start/releases/tag/v0.6.1
[0.6.2]: https://github.com/bishoymly/start/releases/tag/v0.6.2
[0.6.3]: https://github.com/bishoymly/start/releases/tag/v0.6.3
[0.6.4]: https://github.com/bishoymly/start/releases/tag/v0.6.4
[0.6.5]: https://github.com/bishoymly/start/releases/tag/v0.6.5
[0.6.6]: https://github.com/bishoymly/start/releases/tag/v0.6.6
