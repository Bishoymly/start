# Contributing

Thanks for helping make Start more useful and trustworthy.

## Before you begin

- Use a feedback issue for a new workflow or product direction.
- Use a bug report for incorrect, unsafe, or non-deterministic output.
- Keep integrations opt-in. A generated workspace should never contain providers the blueprint did not select.
- Preserve the safety rules around paths, existing directories, and imported commands.

## Local development

Start requires Node.js 20 or newer.

```bash
npm install
npm test
```

`npm test` compiles the TypeScript package and runs the generated JavaScript test suite.

## Pull requests

Keep changes focused and include tests for behavior changes. In the pull request description, explain:

1. The user problem being solved.
2. The generated files or blueprint behavior that change.
3. The exact verification commands you ran.
4. Any compatibility or migration impact.

Do not commit credentials, generated application dependencies, or unrelated formatting changes.
