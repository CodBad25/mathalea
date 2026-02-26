import seedrandom from 'seedrandom'
import { afterEach, beforeAll, describe, it, vi } from 'vitest'
import { clearDOM } from './helpers/domSimulator'
import { discoverExercises, loadExercise } from './helpers/exerciseLoader'
import { verifyAllQuestions, verifyComparisonOnly } from './helpers/verifier'

vi.mock('../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))

vi.mock('../../src/lib/components/version', () => ({
  checkForServerUpdate: vi.fn(() => 'mocked value'),
}))

beforeAll(() => {
  window.notify = vi.fn()
  window.notifyLocal = vi.fn()
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

  const mockContext: Partial<CanvasRenderingContext2D> = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    rect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
    transform: vi.fn(),
    drawImage: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 }) as TextMetrics),
    getImageData: vi.fn(
      () =>
        ({
          data: new Uint8ClampedArray(0),
          colorSpace: 'srgb',
          height: 0,
          width: 0,
        }) as ImageData,
    ),
    putImageData: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
    canvas: { width: 300, height: 150 } as HTMLCanvasElement,
  }
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: vi.fn(() => mockContext),
    writable: true,
    configurable: true,
  })
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
            exercice.nouvelleVersion(exercice.numeroExercice)
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
          // Note: this only works reliably for formats where the stored answer
          // string matches what compare() expects. Exercises using `unite` option
          // store plain-text Grandeur strings but compare() expects LaTeX input
          // from MathLive, so comparison-only may give false negatives.
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
          // DOM-only failures (where comparison passed or was skipped) are often
          // caused by mock limitations (no real MathLive element).
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
