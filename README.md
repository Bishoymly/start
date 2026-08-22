# @bishoymly/start

Create a focused, agent-ready Next.js workspace from the terminal or from a blueprint made at [bishoy.io/start](https://bishoy.io/start).

```bash
pnpm dlx @bishoymly/start@latest
```

With no blueprint, the CLI asks the same project, UI, service, and delivery questions as the web builder. Its first choice can open the web builder instead, or you can open it directly:

```bash
pnpm dlx @bishoymly/start@latest --web
```

Commands copied from the web builder remain deterministic and non-interactive:

```bash
pnpm dlx @bishoymly/start@latest my-app --blueprint v2.<token>
```

Start refuses to overwrite non-empty directories and rejects absolute or parent-traversing paths.

Every generated workspace includes strict TypeScript, Tailwind CSS v4, shadcn/ui source components, an agent instruction hierarchy, a high-quality README, `.env.example`, and Git setup. A pinned design reference is optional. The UI contract carries a normalized shadcn preset plus a minimal, top-navigation, or sidebar starting surface. Preset commands pasted into either builder are decoded as data and are never executed.

The blueprint can independently add Biome or ESLint with Prettier, CI, Vitest, Playwright, OpenTelemetry, Sentry, Better Auth, Drizzle or Prisma, storage, and AI providers. Review also provides a tailored, copyable kickoff prompt for the selected coding agent after the deterministic scaffold command runs.

Only selected integrations are written or installed. `--skip-install` still produces the complete workspace contract without installing dependencies.
When Playwright is selected and installation is enabled, the CLI also installs the pinned Chromium browser so the generated `verify` command is ready to run.

Blueprint v1 is intentionally unsupported in v0.4. Rebuild older configurations at [bishoy.io/start](https://bishoy.io/start).

## Links

- [Web builder](https://bishoy.io/start)
- [npm package](https://www.npmjs.com/package/@bishoymly/start)
- [Issues](https://github.com/bishoymly/start/issues)

## Development

```bash
npm install
npm test
```

Start is released under the [MIT License](./LICENSE).
