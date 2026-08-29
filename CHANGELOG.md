# Changelog

All notable changes to Start are documented here.

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
[0.6.1]: https://github.com/bishoymly/start/releases/tag/v0.6.1
[0.6.2]: https://github.com/bishoymly/start/releases/tag/v0.6.2
[0.6.3]: https://github.com/bishoymly/start/releases/tag/v0.6.3
[0.6.4]: https://github.com/bishoymly/start/releases/tag/v0.6.4
