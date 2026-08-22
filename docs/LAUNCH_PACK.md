# Start launch pack

This is the operating brief for the first public launch of Start. Keep the message concrete: Start produces a repository that coding agents can understand and verify before the first feature prompt.

## Positioning

**One sentence:** Start turns a reviewed stack blueprint into a deterministic, agent-ready Next.js workspace.

**Primary user:** A solo developer or small product team already using Codex, Claude Code, Cursor, or another coding agent to ship Next.js applications.

**Pain:** The first hour of a new app disappears into reconciling a starter, service SDKs, repository instructions, tests, CI, and the commands an agent should trust.

**Promise:** Review every selected integration, generate only those choices, and begin with shared instructions plus one portable verification contract.

**Proof to show:**

- The same blueprint works in the browser and terminal.
- The generated tree includes `APP_BLUEPRINT.md`, `AGENTS.md`, portable agent commands, and `verify`.
- The CLI refuses unsafe targets and does not execute imported preset commands.
- Optional auth, data, storage, AI, tests, telemetry, and CI remain visibly opt-in.

## Activation funnel

The web builder records the following events in Google Analytics and, when enabled for the Vercel project, Vercel Web Analytics custom events:

1. `start_builder_viewed`
2. `start_builder_started`
3. `start_review_reached`
4. `start_command_copied`

Supporting signals are `start_recipe_opened`, `start_blueprint_shared`, and `start_kickoff_copied`. Event properties contain only a source, stage, package manager, recipe slug, or agent name. Blueprint content and credentials are never sent.

### First 30-day targets

Use these as working targets, not claims about market fit:

- 300 qualified builder views.
- 35% view-to-start conversion.
- 50% start-to-review conversion.
- 30% review-to-command-copy conversion.
- 25 total copied scaffold commands.
- 10 pieces of specific user feedback.
- 3 recipe or integration changes traceable to that feedback.

Review the funnel weekly. If view-to-start is weak, fix the promise and recipe entry points. If review-to-copy is weak, fix trust, output clarity, or missing integrations before adding channels.

## 60-second demo storyboard

| Time | Screen | Voiceover |
| --- | --- | --- |
| 0–6s | Empty terminal, then `pnpm dlx @bishoymly/start@latest --web` | “A new app should not begin with an hour of starter cleanup.” |
| 6–15s | Open the Agent-ready SaaS recipe | “Start begins with a reviewed blueprint, not a mystery template.” |
| 15–28s | Scan agents, auth, data, AI, testing, and CI choices | “Every integration is visible and independently removable.” |
| 28–38s | Show generated files and environment surfaces | “Before anything runs, you can see the files, dependencies, and credentials the workspace will need.” |
| 38–48s | Copy and run the deterministic scaffold command | “The blueprint becomes one deterministic local command.” |
| 48–57s | Open `APP_BLUEPRINT.md`, `AGENTS.md`, and package scripts | “Humans and coding agents get the same architecture and one verification contract.” |
| 57–60s | End card with URL and install command | “Try it at bishoy.io/start.” |

Record at 1440×900 or 1920×1080. Keep the pointer deliberate, enlarge terminal text, and show real generated output rather than a slideshow.

## LinkedIn launch draft

I kept losing the first hour of a Next.js project before writing any product code.

Not to the framework—to all the decisions around it: agent instructions, UI defaults, auth and data providers, tests, CI, environment variables, and the command that proves the repo is healthy.

So I built Start.

Start lets you review those choices in a web builder or terminal, then generates the exact workspace locally. The result includes a portable blueprint, shared agent instructions, selected integrations only, and one `verify` command.

It is intentionally strict about safety: it refuses non-empty targets, rejects unsafe paths, and treats imported preset commands as data rather than executable input.

The project is open source. I would especially value feedback from people starting real Next.js products with Codex, Claude Code, Cursor, or Copilot.

Web builder: https://bishoy.io/start

CLI: `pnpm dlx @bishoymly/start@latest`

GitHub: https://github.com/bishoymly/start

## X launch thread

**1/5** I built Start because a new Next.js app kept costing me an hour before the first product change: stack glue, agent instructions, tests, CI, and service setup.

**2/5** Start turns one reviewed blueprint into a deterministic local scaffold. Use the web builder or answer the same questions in the terminal.

**3/5** The generated repo includes `APP_BLUEPRINT.md`, `AGENTS.md`, portable agent workflows, selected integrations only, and one `verify` command.

**4/5** It also refuses non-empty targets, rejects unsafe paths, and never executes imported shadcn preset commands. The agent-ready claim has to include safety and verification.

**5/5** Open source: https://github.com/bishoymly/start

Try the builder: https://bishoy.io/start

Run it: `pnpm dlx @bishoymly/start@latest`

## Product Hunt listing

**Name:** Start

**Tagline:** A better starting repo for coding agents

**Short description:** Review your Next.js stack in the browser or terminal, then generate a deterministic workspace with agent instructions, selected services, tests, CI, and one verification command.

**Maker comment:**

I built Start after noticing that new projects were repeatedly paying the same setup tax before the first real feature. Existing starters solved parts of it, but the coding agent still needed a clear architecture, repository rules, and a trustworthy way to verify changes.

Start makes those decisions explicit. The web builder and CLI share one blueprint model; the scaffold writes only selected integrations; and the generated repository gives both humans and agents the same source of truth.

I am looking for feedback on missing workflows and places where the generated contract is too opinionated or not opinionated enough.

**Media order:**

1. Social card with the product promise.
2. 60-second end-to-end demo.
3. Web builder review screen.
4. Generated repository tree.
5. `AGENTS.md` and `verify` contract close-up.

## Show HN preparation

Hacker News asks submitters to write launch text personally. Do not paste a prepared marketing post. Write the submission in your own words from these facts:

- What repeatedly went wrong in your own new-project workflow.
- Why a blueprint is different from a fixed template.
- One or two concrete safety decisions in the CLI.
- The generated files that materially help an agent work.
- What remains incomplete and the feedback you want.

Use a plain title such as “Show HN: Start – generate an agent-ready Next.js workspace.” Link directly to the GitHub repository or working builder, stay in the comments, and answer technical questions candidly.

## Design-partner outreach

Send this individually to 10 developers who actively use coding agents. Personalize the first sentence and do not automate the message.

> I built a small open-source tool for the setup step you mentioned. It reviews a Next.js stack and generates the repo with agent instructions, selected integrations, and a verification contract. Would you be willing to run one real project through it and tell me where the generated workspace gets in your way? No testimonial needed—I am looking for specific friction.

For each session, record the application type, chosen recipe, first point of confusion, missing choice, command-copy outcome, and whether the generated repo reached a passing `verify` command.

## Four-week operating plan

### Week 1 — Foundation

- Ship the repository trust layer, recipes, analytics, and social card.
- Record the demo using one real generated workspace.
- Ask three design partners to complete the flow without coaching.
- Fix any blocker that prevents command copy or a healthy generated baseline.

### Week 2 — Focused launch

- Publish the LinkedIn post and X thread on separate days.
- Respond to every substantive reply within 24 hours.
- Publish the Product Hunt page only after the demo and screenshots are ready.
- Submit Show HN only with a personally written introduction and time reserved for discussion.

### Week 3 — Recipe-led proof

- Publish one short build log using the most-opened recipe.
- Show the generated tree, first feature prompt, and exact verification results.
- Turn recurring setup questions into README changes or recipe adjustments.

### Week 4 — Close the loop

- Review the full funnel and ten feedback conversations.
- Rank problems by lost activations, not request count.
- Ship the highest-impact recipe or generator change.
- Publish a concise “what changed after launch” note with actual numbers.

## Launch gate

Do not schedule public posts until all of these are true:

- `npm test` passes in the Start package.
- The website typecheck and production build pass.
- Each recipe opens at review and produces a valid command.
- Command, share, and kickoff copy actions work in a real browser.
- The Start social image renders at 1200×630.
- The demo shows a generated workspace reaching `verify`.
- GitHub description, homepage, topics, issue templates, and release notes are current.
