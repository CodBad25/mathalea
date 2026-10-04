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

import EquationsProduitsEnCroix2nde from '../../src/exercices/2e/2L21-3'
import EquationsPremierDegre2nde from '../../src/exercices/2e/2L21-4'
import EquationsAvecDistributivite2nde from '../../src/exercices/2e/2L21-5'
import EquationAvecQuotient from '../../src/exercices/2e/2L21-6'
import InequationsPasAPas from '../../src/exercices/2e/2L30-6'
import EquationsPremierDegre3e from '../../src/exercices/3e/3L13'
import EquationsAvecDistributivite3e from '../../src/exercices/3e/3L13-1'
import EquationsProduitsEnCroix3e from '../../src/exercices/3e/3L13-2'
import EquationsMelees from '../../src/exercices/3e/3L15-3'
import EquationsAvecDistances from '../../src/exercices/4e/4C20-3'
import EquationsProduitsEnCroix4e from '../../src/exercices/4e/4L15-1'
import EquationsPremierDegre from '../../src/exercices/4e/4L20'
import EquationsPasAPas from '../../src/exercices/4e/4L20-1'
import QuatriemeProportionnelle from '../../src/exercices/4e/4P10-2'
import EquationsPremierDegreBP from '../../src/exercices/bp2/bp2autoK1'
import { setOutputHtml, setOutputLatex } from '../../src/modules/context'

describe('exercices modèles de mathalea-solveur', () => {
  beforeEach(() => {
    setOutputHtml()
  })

  it.each([
    ['4L20', EquationsPremierDegre],
    ['2L21-4', EquationsPremierDegre2nde],
    ['3L13', EquationsPremierDegre3e],
    ['bp2autoK1', EquationsPremierDegreBP],
  ])('génère %s avec un solveur par question', (_ref, ExerciseClass) => {
    const exercice = new ExerciseClass()
    exercice.numeroExercice = 1
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.listeQuestions).toHaveLength(exercice.nbQuestions)
    exercice.listeQuestions.forEach((question, index) => {
      expect(question).toContain('<mathalea-solveur')
      expect(question).toContain('mode="evaluation"')
      expect(question).not.toContain(`champTexteEx1Q${index}`)
      expect(exercice.autoCorrection[index].formatInteractif).toBe(
        'mathalea-solveur',
      )
      expect(
        String(exercice.autoCorrection[index].valeur?.reponse?.value),
      ).toContain('=')
    })
  })

  it("n'écrit que l'équation de 4L20 hors interactivité", () => {
    const exercice = new EquationsPremierDegre()
    exercice.numeroExercice = 6
    exercice.interactif = false
    exercice.nouvelleVersion()

    exercice.listeQuestions.forEach((question) => {
      expect(question).not.toContain('<mathalea-solveur')
      expect(question).toMatch(/\$.+=.+\$/)
    })
  })

  it('transpose les identifiants du solveur de 3L13 dans 3L15-3', () => {
    const exercice = new EquationsMelees()
    exercice.numeroExercice = 7
    exercice.interactif = true
    exercice.nouvelleVersion()

    const index = exercice.listeQuestions.findIndex((question) =>
      question.includes('<mathalea-solveur'),
    )
    expect(index).toBeGreaterThanOrEqual(0)
    expect(exercice.listeQuestions[index]).toContain(
      `id="mathalea-solveurEx7Q${index}"`,
    )
    expect(exercice.listeQuestions[index]).toContain(
      `numero-exercice="7" question-index="${index}"`,
    )
    expect(exercice.autoCorrection[index].formatInteractif).toBe(
      'mathalea-solveur',
    )
  })

  it('génère 2L21-6 avec le solveur et une équation finale attendue', () => {
    const exercice = new EquationAvecQuotient()
    exercice.numeroExercice = 10
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.consigne).toBe("Résoudre l'équation suivante.")
    expect(exercice.listeQuestions[0]).toContain('<mathalea-solveur')
    expect(exercice.listeQuestions[0]).toContain('mode="evaluation"')
    expect(exercice.listeQuestions[0]).not.toContain('champTexteEx10Q0')
    expect(exercice.autoCorrection[0].formatInteractif).toBe('mathalea-solveur')
    expect(String(exercice.autoCorrection[0].valeur?.reponse?.value)).toMatch(
      /^x=/,
    )
  })

  it.each([
    ['3L13-1', EquationsAvecDistributivite3e],
    ['2L21-5', EquationsAvecDistributivite2nde],
  ])('génère %s avec un solveur par question', (_ref, ExerciseClass) => {
    const exercice = new ExerciseClass()
    exercice.numeroExercice = 11
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.listeQuestions).toHaveLength(exercice.nbQuestions)
    exercice.listeQuestions.forEach((question, index) => {
      expect(question).toContain('<mathalea-solveur')
      expect(question).toContain('mode="evaluation"')
      expect(question).not.toContain(`champTexteEx11Q${index}`)
      expect(exercice.autoCorrection[index].formatInteractif).toBe(
        'mathalea-solveur',
      )
      expect(
        String(exercice.autoCorrection[index].valeur?.reponse?.value),
      ).toMatch(/^x=/)
    })
  })

  it.each([
    ['3L13-2', EquationsProduitsEnCroix3e],
    ['2L21-3', EquationsProduitsEnCroix2nde],
    ['4L15-1', EquationsProduitsEnCroix4e],
    ['4C20-3', EquationsAvecDistances],
  ])(
    'génère %s avec un solveur de produit en croix par question',
    (_ref, ExerciseClass) => {
      const exercice = new ExerciseClass()
      exercice.numeroExercice = 12
      exercice.interactif = true
      exercice.nouvelleVersion()

      expect(exercice.listeQuestions).toHaveLength(exercice.nbQuestions)
      exercice.listeQuestions.forEach((question, index) => {
        expect(question).toContain('<mathalea-solveur')
        expect(question).not.toContain(`champTexteEx12Q${index}`)
        expect(exercice.autoCorrection[index].formatInteractif).toBe(
          'mathalea-solveur',
        )
        expect(
          String(exercice.autoCorrection[index].valeur?.reponse?.value),
        ).toContain('=')
      })
    },
  )

  it('conserve le tableau de 4P10-2 avant le solveur', () => {
    const exercice = new QuatriemeProportionnelle()
    exercice.numeroExercice = 13
    exercice.interactif = true
    exercice.nouvelleVersion()

    exercice.listeQuestions.forEach((question, index) => {
      expect(question).toContain('<svg')
      expect(question).toContain('<mathalea-solveur')
      expect(question).toContain('variable="x"')
      expect(question).not.toContain('initial="?')
      expect(exercice.autoCorrection[index].valeur?.reponse?.value).toMatch(
        /^x=/,
      )
    })
  })

  it.each([
    ['2L21-6', EquationAvecQuotient],
    ['3L13-1', EquationsAvecDistributivite3e],
    ['2L21-5', EquationsAvecDistributivite2nde],
    ['3L13-2', EquationsProduitsEnCroix3e],
    ['2L21-3', EquationsProduitsEnCroix2nde],
    ['4L15-1', EquationsProduitsEnCroix4e],
    ['4C20-3', EquationsAvecDistances],
    ['4P10-2', QuatriemeProportionnelle],
  ])(
    "n'écrit que l'équation de %s hors interactivité",
    (_ref, ExerciseClass) => {
      const exercice = new ExerciseClass()
      exercice.numeroExercice = 14
      exercice.interactif = false
      exercice.nouvelleVersion()

      expect(exercice.listeQuestions).toHaveLength(exercice.nbQuestions)
      exercice.listeQuestions.forEach((question) => {
        expect(question).not.toContain('<mathalea-solveur')
        expect(question).toContain('=')
      })
    },
  )

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

  it("conserve les équations de 4L20-1 dans l'export LaTeX", () => {
    setOutputLatex()
    const exercice = new EquationsPasAPas()
    exercice.interactif = false
    exercice.nouvelleVersion()

    expect(exercice.listeQuestions).toHaveLength(exercice.nbQuestions)
    exercice.listeQuestions.forEach((question) => {
      expect(question).toMatch(/^\$.+=.+\$$/)
      expect(question).not.toContain('<mathalea-solveur')
    })
  })

  it('pilote la droite graduée de 2L30-6 avec la case à cocher', () => {
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
          !question.includes('<mathalea-solveur') && /^\$.+\$$/.test(question),
      ),
    ).toBe(true)
  })
})
