# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MathALÉA is a French mathematics exercise generator following the French mathematics curriculum. It generates random exercises with solutions, supporting multiple output formats (HTML, LaTeX, PDF) and interactive modes.

## Common Commands

```bash
# Install dependencies
pnpm install

# Development server (port 5173)
pnpm dev

# Production build
pnpm build

# Type checking
pnpm check

# Linting
pnpm lint          # JS/TS files in exercices
pnpm lintSvelte    # Svelte components

# Formatting
pnpm format        # src, test and tasks folders

# Unit tests
pnpm test:unit     # Tests in tests/unit/
pnpm test:src      # Tests in src/

# e2e test with dev server (starts server, runs test, stops server)
./tasks/run-e2e-test.sh consistency   # consistency test
./tasks/run-e2e-test.sh view          # views test
./tasks/run-e2e-test.sh interactivity # interactivity test

# Run a single test file (with a dev server already running)
pnpm vitest <path-to-test-file> --run

# Generate exercise reference JSON (auto-runs with dev/build)
pnpm run makeJson
```

## Architecture

### Core Structure

- **`src/exercices/`** - Exercise definitions organized by grade level (6e, 5e, 4e, 3e, 2e, 1e, TSpe) and type (can, beta, apps)
- **`src/lib/`** - Core libraries
  - `mathalea.ts` - Main engine for loading and rendering exercises
  - `2d/` - 2D geometry (points, segments, angles, etc.)
  - `interactif/` - Interactive answer handling (MathLive input, QCM, drag-and-drop)
  - `stores/` - Svelte stores for global state management
- **`src/modules/`** - Mathematical utilities (FractionEtendue, Grandeur, operations, etc.)
- **`src/components/`** - Svelte UI components
  - `display/` - Student/presentation views (Eleve, Can)
  - `setup/` - Teacher configuration views (Start, Latex, Amc, etc.)
  - `shared/` - Reusable components

### Exercise System

Exercises extend the base `Exercice` class (`src/exercices/Exercice.ts`). Each exercise exports:

- `uuid` - Unique identifier
- `titre` - Title in French
- `refs` - Reference codes per locale (e.g., `'fr-2016': ['6C30-1']`)
- Default export: Exercise class with `nouvelleVersion()` method

Simple exercises (single question) extend `ExerciceSimple` and set `this.question`, `this.reponse`, `this.correction`.

### Key Patterns

- **Randomization**: Uses `seedrandom` with `randint()`, `choice()`, `combinaisonListes()` from `modules/outils.ts`
- **LaTeX/HTML output**: Exercises generate content for both via `context.isHtml` checks
- **Interactive answers**: Use `handleAnswers()` and `setReponse()` from `lib/interactif/gestionInteractif.ts`
- **2D figures**: Created with primitives from `lib/2d/` and rendered via `mathalea2d()`

### State Management

- `exercicesParams` store - Current exercise list and parameters
- `globalOptions` store - Display settings (corrections, interactivity, etc.)
- URL-based state - Parameters synced to URL for sharing

## Testing

E2E tests use Playwright + Vitest. Configuration files are in `tests/e2e/vitest.config.*.js`.

## Language

The codebase and comments are primarily in French. Exercise content targets French students.
