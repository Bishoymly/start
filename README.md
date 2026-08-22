# Start

Build an agent-ready Next.js workspace without spending the first hour reconciling tools, instructions, and verification scripts.

Start turns one reviewed blueprint into a deterministic scaffold: strict TypeScript, Tailwind CSS v4, shadcn/ui source components, agent instructions, selected services, tests, CI, and a single `verify` command.

```bash
pnpm dlx @bishoymly/start@latest
```

[Build a blueprint in the web builder](https://bishoy.io/start) · [View curated recipes](https://bishoy.io/start/recipes) · [Open the npm package](https://www.npmjs.com/package/@bishoymly/start)

## Two ways to start

Run the guided terminal flow:

```bash
pnpm dlx @bishoymly/start@latest
```

Or review the stack visually, share it with a teammate, and copy the exact command:

```bash
pnpm dlx @bishoymly/start@latest --web
```

Commands copied from the web builder are deterministic and non-interactive:

```bash
pnpm dlx @bishoymly/start@latest my-app --blueprint v2.<token>
```

## What the generated workspace includes

Start writes only the integrations selected in the blueprint. A typical project begins with:

```text
my-app/
├── app/                         Next.js App Router surface
├── components/ui/               shadcn/ui source components
├── .agents/commands/            implement, verify, review, ship-check
├── .github/workflows/verify.yml optional CI contract
├── AGENTS.md                    shared agent workflow and safety rules
├── APP_BLUEPRINT.md             portable stack and delivery contract
├── DESIGN.md                    optional pinned design reference
├── .env.example                 selected service variables only
├── README.md                    setup and architecture notes
└── package.json                 one portable verify command
```

The blueprint can add Biome or ESLint with Prettier, Vitest, Playwright, OpenTelemetry, Sentry, Better Auth, Drizzle or Prisma, storage, AI providers, and GitHub or GitLab CI. It also produces a tailored kickoff prompt for Codex, Claude Code, Cursor, GitHub Copilot, Gemini CLI, OpenCode, Windsurf, or Grok Build.

## Why Start

| Tool | Best at | Start adds |
| --- | --- | --- |
| `create-next-app` | A fast official Next.js baseline | Agent instructions, reviewed service choices, delivery workflows, and a portable blueprint |
| T3 / opinionated stacks | A proven fixed stack | Independent choices for auth, data, storage, AI, observability, testing, and CI |
| Template repositories | Reusing one known architecture | A deterministic scaffold generated from the exact choices your team reviewed |

Start is deliberately not a package installer disguised as architecture. The blueprint records why the workspace exists, what is selected, what is not selected, and how both humans and agents verify changes.

## Safety and reproducibility

- Refuses to overwrite non-empty directories.
- Rejects absolute paths and parent traversal.
- Decodes imported shadcn preset commands as data; it never executes pasted commands.
- Writes and installs only selected integrations.
- Supports `--skip-install` while still producing the complete workspace contract.
- Installs the pinned Chromium browser when Playwright is selected so `verify` is ready to run.

Blueprint v1 is intentionally unsupported in v0.4. Rebuild older configurations in the [web builder](https://bishoy.io/start).

## Development

Start requires Node.js 20 or newer.

```bash
npm install
npm test
```

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. Product direction is tracked in [ROADMAP.md](./ROADMAP.md), and release changes in [CHANGELOG.md](./CHANGELOG.md).

Start is released under the [MIT License](./LICENSE). Security reports should follow [SECURITY.md](./SECURITY.md).
