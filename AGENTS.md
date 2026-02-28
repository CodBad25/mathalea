# MathALÉA Spec

## Objective

- Build an exercise generator supporting HTML (with multiple interactivity modes) and LaTeX output formats.

## Tech Stack

- Svelte 5+, Vite 7+, Vitest 4+, Tailwind CSS 4+

## Commands

- Unit Tests: `pnpm prebuild-unit-tests` (runs vitest, must pass before commit)
- TypeCheck: `pnpm check` (type checks .svelte and .ts files)

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

Codebase in english. Comments and user-displayed content in french.
