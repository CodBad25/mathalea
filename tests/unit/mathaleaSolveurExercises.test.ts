import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('mathlive', () => {
  class MockMathfieldElement extends HTMLElement {
    value = ''
    readOnly = false
  }
  if (customElements.get('math-field') == null)
    customElements.define('math-field', MockMathfieldElement)
  return { MathfieldElement: MockMathfieldElement }
})

import InequationsPasAPas from '../../src/exercices/2e/2L30-0'
import EquationsPasAPas from '../../src/exercices/4e/4L20-1'
import { setOutputHtml } from '../../src/modules/context'

describe('exercices modèles de mathalea-solveur', () => {
  beforeEach(() => {
    setOutputHtml()
  })

  it('génère 4L20-1 avec une équation finale attendue par question', () => {
    const exercice = new EquationsPasAPas()
    exercice.numeroExercice = 2
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.listeQuestions).toHaveLength(4)
    exercice.listeQuestions.forEach((question, index) => {
      expect(question).toContain('<mathalea-solveur')
      expect(question).toContain('mode="evaluation"')
      expect(exercice.autoCorrection[index].formatInteractif).toBe(
        'mathalea-solveur',
      )
      expect(
        String(exercice.autoCorrection[index].valeur?.reponse?.value),
      ).toMatch(/^x=-?\d+$/)
      expect(exercice.listeCorrections[index]).toContain('\\begin{aligned}')
      expect(exercice.listeCorrections[index]).not.toContain('\\iff')
    })
  })

  it('pilote la droite graduée de 2L30-0 avec la case à cocher', () => {
    const avecDroite = new InequationsPasAPas()
    avecDroite.numeroExercice = 3
    avecDroite.interactif = true
    avecDroite.sup = true
    avecDroite.nouvelleVersion()
    expect(
      avecDroite.listeQuestions.every((question) =>
        question.includes('show-interval="true"'),
      ),
    ).toBe(true)
    expect(
      avecDroite.listeCorrections.every(
        (correction) =>
          correction.includes('\\begin{aligned}') &&
          !correction.includes('\\iff'),
      ),
    ).toBe(true)

    const sansDroite = new InequationsPasAPas()
    sansDroite.numeroExercice = 4
    sansDroite.interactif = true
    sansDroite.sup = false
    sansDroite.nouvelleVersion()
    expect(
      sansDroite.listeQuestions.every((question) =>
        question.includes('show-interval="false"'),
      ),
    ).toBe(true)

    const entrainement = new InequationsPasAPas()
    entrainement.numeroExercice = 5
    entrainement.interactif = false
    entrainement.nouvelleVersion()
    expect(
      entrainement.listeQuestions.every(
        (question) =>
          question.includes('<mathalea-solveur') &&
          question.includes('mode="entrainement"') &&
          question.includes('interactivity-on="true"'),
      ),
    ).toBe(true)
  })
})
