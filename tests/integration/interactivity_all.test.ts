import seedrandom from 'seedrandom'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createURL } from '../../src/lib/createURL'
import { clearDOM } from './helpers/domSimulator'
import { discoverExercises, loadExercise } from './helpers/exerciseLoader'
import {
  buildParamScenarios,
  resolveParamTestLevel,
} from './helpers/parameterScenarios'
import {
  type SkippedQuestion,
  writeSkippedQuestionsLogs,
} from './helpers/skippedQuestionsLogger'
import { verifyComparisonOnly } from './helpers/verifier-comparison'
import { verifyDom } from './helpers/verifier-dom'

vi.mock('../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))

vi.mock('../../src/lib/components/version', () => ({
  checkForServerUpdate: vi.fn(() => 'mocked value'),
}))

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', {
    value: ResizeObserverMock,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverMock,
    writable: true,
    configurable: true,
  })

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
const paramLevel = resolveParamTestLevel(process.env.TEST_PARAM)
const skippedQuestions: SkippedQuestion[] = []
const skippedQuestionKeys = new Set<string>()

function recordSkippedQuestion(entry: SkippedQuestion) {
  const key = [
    entry.filePath,
    entry.scenario ?? '',
    entry.strategy,
    entry.format,
    entry.skipReason,
  ].join('|')
  if (skippedQuestionKeys.has(key)) return
  skippedQuestionKeys.add(key)
  skippedQuestions.push(entry)
}

const exercises = discoverExercises(filter)

if (exercises.length === 0) {
  describe('no exercises found', () => {
    it.skip(`No exercises found for filter '${filter ?? 'none'}'`, () => {})
  })
}

afterAll(() => {
  writeSkippedQuestionsLogs(skippedQuestions)
})

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
      it(`${entry.filePath} — l'interactivité accepte les réponses attendues`, async () => {
        const loaded = await loadExercise(entry)
        if (!loaded) return // Not interactive, skip silently

        const { ExerciseClass, titre } = loaded
        const failures: string[] = []
        const scenarioProbe = new ExerciseClass()
        const scenarios = buildParamScenarios(scenarioProbe, paramLevel)

        for (const seed of SEEDS) {
          for (const scenario of scenarios) {
            const exercice = new ExerciseClass()
            exercice.seed = seed
            exercice.numeroExercice = 0
            exercice.interactif = true
            Object.assign(exercice, scenario.overrides)
            seedrandom(seed, { global: true })
            const baseParams: { uuid: string; alea: string; interactif: '1' } =
              { uuid: entry.uuid, alea: seed, interactif: '1' }
            const params = Object.assign(baseParams, scenario.overrides)
            const url = createURL([params]).href.replace(':3000', ':5173')

            try {
              exercice.nouvelleVersion(exercice.numeroExercice)
            } catch (e) {
              failures.push(
                `${url} : Erreur déclenchée lors d'une nouvelleVersion() : ${e instanceof Error ? e.message : e}`,
              )
              continue
            }

            if (exercice.autoCorrection.length === 0) {
              continue
            }

            // Stratégie 1: On passe directement la réponse attendue à la fonction de comparaison (si disponible) sans passer par le DOM.
            const compResults = verifyComparisonOnly(exercice)
            for (const result of compResults) {
              if (result.skipped) {
                recordSkippedQuestion({
                  filePath: entry.filePath,
                  titre,
                  seed,
                  scenario: scenario.label,
                  strategy: 'comparison-only',
                  questionIndex: result.questionIndex,
                  format: result.format,
                  skipReason: result.skipReason ?? 'unknown',
                })
                continue
              }
              if (!result.isOk) {
                failures.push(
                  `${url} : la fonction de comparaison ${result.verificationFunctionName} (${result.format} - ${JSON.stringify(result.optionsComparaison)}) n'accepte pas les réponses attendues par la question ${result.questionIndex + 1}. Saisie simulée : ${result.simulatedInput}. Réponse attendue : ${result.goodAnswer}. Feedback : ${result.feedback}`,
                )
              }
            }

            // Stratégie 2 : On crée les éléments attendus par la fonction de vérification (comme verifQuestionMathlive) et on vérifie que la correction accepte ces éléments.
            const domResults = verifyDom(exercice)
            for (const result of domResults) {
              if (result.skipped) {
                recordSkippedQuestion({
                  filePath: entry.filePath,
                  titre,
                  seed,
                  scenario: scenario.label,
                  strategy: 'full-dom',
                  questionIndex: result.questionIndex,
                  format: result.format,
                  skipReason: result.skipReason ?? 'unknown',
                })
                continue
              }
              if (!result.isOk) {
                failures.push(
                  `${url} : la fonction ${result.verificationFunctionName} (${result.format}) n'accepte pas les réponses attendues par la question ${result.questionIndex + 1}. Saisie simulée : ${result.simulatedInput}. Réponse attendue : ${result.goodAnswer}. Feedback : ${result.feedback}`,
                )
              }
            }
            clearDOM()
          }
        }

        if (failures.length > 0) {
          for (const failure of failures) {
            expect.soft(false, failure).toBe(true)
          }
        }
      })
    }
  })
}
