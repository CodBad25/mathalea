# MathALÉA Spec

## Objective

- Build an exercise generator supporting HTML (with multiple interactivity modes) and LaTeX output formats.

## Tech Stack

- Svelte 5+, Vite 7+, Vitest 4+, Tailwind CSS 4+

## Commands

- Unit Tests: `pnpm prebuild-unit-tests` (runs vitest, must pass before commit)
- TypeCheck: `pnpm check` (type checks .svelte and .ts files)

⚠️: use `--pm-on-fail=ignore` option with each `pnpm`command. (i.e. `pnpm --pm-on-fail=ignore test:e2e:latex_breaks`)

## Project Structure

- `src/components` – app .svelte components
- `src/exercices` - exercise .ts files (almost all non-static exercises)
- `src/lib` - .ts helpers (mostly functions)
- `src/modules` - .ts helpers (mostly classes)
- `tests/` – unit and e2e tests
- `tasks/` – utility scripts

## State Management

- `exercicesParams` store - Current exercise list and parameters
- `globalOptions` store - Display settings (corrections, interactivity, etc.)
- URL-based state - Parameters synced to URL for sharing

## Language

Codebase in english. Comments, documentation and user-displayed content in french.

## Answering Codebase Questions

When answering a developer question about this codebase:

- Start with `documentation/README.md`, then follow the relevant documentation links.
- If documentation appears to answer the question, run a quick consistency check against the codebase before answering: verify referenced files, key symbols, scripts in `package.json`, or mentioned tests with `rg` or targeted file reads.
- Cite the documentation page(s) used in the answer and state that the relevant code references were checked.
- If documentation is missing, incomplete, or inconsistent with the code, inspect the codebase with `rg` and targeted reads before answering.
- When the answer reveals durable missing or obsolete knowledge, update or create the relevant page under `documentation/` in the same change.
- Do not document disposable investigation details, temporary state, unconfirmed bugs, or personal preferences.
