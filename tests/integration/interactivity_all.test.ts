import seedrandom from 'seedrandom'
import { afterEach, beforeAll, describe, it, vi } from 'vitest'
import { clearDOM } from './helpers/domSimulator'
import { discoverExercises, loadExercise } from './helpers/exerciseLoader'
import { verifyAllQuestions, verifyComparisonOnly } from './helpers/verifier'

// Required mocks (same as existing unit tests)
vi.mock('../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))

vi.mock('../../src/lib/components/version', () => ({
  checkForServerUpdate: vi.fn(() => 'mocked value'),
}))

// Mock window.notify (used by gestionInteractif.ts, comparisonFunctions.ts, etc.)
beforeAll(() => {
  window.notify = vi.fn()
  window.notifyLocal = vi.fn()
})

afterEach(() => {
  clearDOM()
})

const SEEDS = ['ePxF1', 'a2b3c', 'z9y8x']
const filter = process.env.NIV?.replaceAll(' ', '') ?? undefined

const exercises = discoverExercises(filter)

if (exercises.length === 0) {
  describe('no exercises found', () => {
    it.skip(`No exercises found for filter '${filter ?? 'none'}'`, () => {})
  })
}

// Group by directory (6e, 5e, etc.) for organized output
const grouped = new Map<string, typeof exercises>()
for (const ex of exercises) {
  const dir = ex.filePath.split('/')[0]
  if (!grouped.has(dir)) grouped.set(dir, [])
  grouped.get(dir)!.push(ex)
}

for (const [dir, entries] of grouped) {
  describe(dir, () => {
    for (const entry of entries) {
      it(`${entry.filePath} — interactivity accepts its own answers`, async () => {
        const loaded = await loadExercise(entry)
        if (!loaded) return // Not interactive, skip silently

        const { ExerciseClass, titre } = loaded
        const failures: string[] = []

        for (const seed of SEEDS) {
          const exercice = new ExerciseClass()
          exercice.seed = seed
          exercice.numeroExercice = 0
          exercice.interactif = true
          seedrandom(seed, { global: true })

          try {
            exercice.nouvelleVersion()
          } catch (e) {
            failures.push(
              `seed=${seed}: nouvelleVersion() threw: ${e instanceof Error ? e.message : e}`,
            )
            continue
          }

          if (exercice.autoCorrection.length === 0) {
            continue
          }

          // Strategy 1: comparison-only (fast, no DOM)
          const compResults = verifyComparisonOnly(exercice)
          for (const r of compResults) {
            if (r.skipped) continue
            if (!r.isOk) {
              failures.push(
                `seed=${seed} Q${r.questionIndex + 1} format=${r.format}: ` +
                  `comparison rejected own answer. ${r.feedback}`,
              )
            }
          }

          // Strategy 2: full DOM verification (for mathlive, qcm, listeDeroulante)
          const domResults = verifyAllQuestions(exercice)
          for (const r of domResults) {
            if (r.skipped) continue
            if (!r.isOk) {
              failures.push(
                `seed=${seed} Q${r.questionIndex + 1} format=${r.format}: ` +
                  `verifQuestion returned isOk=false. ${r.feedback}`,
              )
            }
          }
          clearDOM()
        }

        if (failures.length > 0) {
          throw new Error(
            `${titre} (${entry.filePath}):\n` +
              failures.map((f) => `  - ${f}`).join('\n'),
          )
        }
      })
    }
  })
}
