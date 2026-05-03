import seedrandom from 'seedrandom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import QuestionsMasses from '../../src/exercices/6e/6N5-2'
import { verifQuestionMathLive } from '../../src/lib/interactif/mathLive'

// Mock avant l'import
vi.mock('../../src/lib/renderScratch', () => ({
  renderScratch: vi.fn(() => 'mocked value'),
}))

vi.mock('../../src/lib/components/version', () => ({
  checkForServerUpdate: vi.fn(() => 'mocked value'),
}))

describe('QuestionsMasses', () => {
  let exercice: QuestionsMasses

  beforeEach(() => {
    exercice = new QuestionsMasses()
    exercice.sup = 1
    exercice.sup2 = false
    exercice.sup3 = false
    exercice.sup4 = 3
    exercice.seed = 'ePxF'
    exercice.numeroExercice = 3
    exercice.interactif = true
    exercice.nbQuestions = 2

    seedrandom(exercice.seed, { global: true })
  })

  test('nouvelleVersion 6C12-1 should generate correct questions and corrections', () => {
    exercice.nouvelleVersion()

    // console.log(exercice.autoCorrection[1].valeur?.reponse?.value)

    // Simuler un champ texte dans le DOM
    document.body.innerHTML = `
      <input id="champTexteEx3Q1" value="832" />
      <span id="resultatCheckEx3Q1"></span>
    `

    const result = verifQuestionMathLive(exercice, 1)

    expect(result).toEqual({
      isOk: true,
      feedback: '',
      score: { nbBonnesReponses: 1, nbReponses: 1 },
    })
  })
})

// pnpm vitest --run tests\unit\6C12-1.test.ts
