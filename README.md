# Start

Create a verified, agent-ready Next.js workspace from a portable, reviewable blueprint.

Start uses the official [shadcn CLI](https://ui.shadcn.com/docs/cli) to create the selected Next.js preset, adds every available shadcn UI component, then applies the quality, CI, documentation, agent-skill, and optional infrastructure choices in your blueprint. It creates repository foundations only—never product screens, domain models, or example data.

[Web builder](https://bishoy.io/start) · [npm](https://www.npmjs.com/package/@bishoymly/start) · [issues](https://github.com/Bishoymly/start/issues)

## Quick start

Create a blueprint in the [web builder](https://bishoy.io/start), then inspect the exact plan before it writes files:

```bash
pnpm dlx @bishoymly/start@latest my-app --blueprint v3.<token> --plan
```

Run that reviewed plan:

```bash
pnpm dlx @bishoymly/start@latest my-app --blueprint v3.<token>
```

The generated project includes:

- the chosen shadcn preset and all available shadcn components;
- pinned Node, package-manager, framework, test, and browser-tool versions;
- a `pnpm run verify` gate for format, lint, types, unit tests, browser tests, and production build;
- CI that installs the matching pnpm version before running the same gate;
- `AGENTS.md`, native agent entry points, local skills, shared agent commands, and `/docs` for the project contract; and
- optional durable plumbing for data, auth, storage, AI, observability, and deployment—only when selected.

## How it stays safe

Start rejects unsafe target paths and symbolic links. It records the exact blueprint and upstream command in `.start/` so a matching run can resume, while an unknown existing shadcn workspace stops for inspection. Start-owned configuration is replaced to match the selected blueprint; official source stays under shadcn ownership.

## Develop Start

```bash
npm install
npm test
```

Run the live, networked generation test locally:

```bash
npm run test:full-run
```

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md), keep changes focused, and include tests for changed planning or generation behavior. Security issues belong in [SECURITY.md](./SECURITY.md), not public issue trackers.

## Releases

Releases use npm trusted publishing in GitHub Actions. Update the version and changelog, merge to `main`, then create and push the matching tag:

```bash
git tag v<version>
git push origin v<version>
```

Released under the [MIT License](./LICENSE).
