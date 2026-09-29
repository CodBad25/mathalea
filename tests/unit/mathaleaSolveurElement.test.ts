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

import Exercice from '../../src/exercices/Exercice'
import {
  addMathaleaSolveur,
  MathaleaSolveurElement,
} from '../../src/lib/customElements/MathaleaSolveurElement'
import {
  listOfCustomElements,
  mathaleaCustomElementsRegistry,
} from '../../src/lib/customElements/MathaleaCustomElement'
import { isEquivalentInequality } from '../../src/lib/interactif/checks/inequalityChecks'
import { setOutputHtml } from '../../src/modules/context'

describe('MathaleaSolveurElement', () => {
  let exercice: Exercice

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    setOutputHtml()
    document.body.innerHTML = ''
    exercice = new Exercice()
    exercice.numeroExercice = 4
    exercice.autoCorrection[0] = {}
  })

  it('enregistre le composant dans les registres MathALÉA', () => {
    expect(customElements.get('mathalea-solveur')).toBe(MathaleaSolveurElement)
    expect(listOfCustomElements).toContain('mathalea-solveur')
    expect(mathaleaCustomElementsRegistry.get('mathalea-solveur')).toBe(
      MathaleaSolveurElement,
    )
  })

  it('ajoute une ligne après une transformation équivalente', () => {
    document.body.innerHTML = addMathaleaSolveur(exercice, 0, {
      initial: '2x+4=10',
    })
    const solver = document.querySelector(
      'mathalea-solveur',
    ) as MathaleaSolveurElement
    const input = solver.querySelectorAll('math-field')[1] as
      (HTMLElement & { value: string }) | undefined
    if (input == null) throw new Error('Champ de saisie absent')
    input.value = '2x=6'
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
    const button = solver.querySelector<HTMLButtonElement>('.evaluate')
    expect(button).not.toBeNull()
    solver.evaluate()

    expect(solver.value).toBe('2x=6')
    expect({
      count: solver.querySelectorAll('math-field').length,
      message: solver.querySelector('.message')?.textContent,
    }).toEqual({ count: 3, message: expect.stringContaining('équivalente') })
  })

  it('fige une étape fausse en mode évaluation', () => {
    document.body.innerHTML = addMathaleaSolveur(exercice, 0, {
      initial: '2x+4=10',
      mode: 'evaluation',
    })
    const solver = document.querySelector(
      'mathalea-solveur',
    ) as MathaleaSolveurElement
    const input = solver.querySelectorAll('math-field')[1] as
      (HTMLElement & { value: string }) | undefined
    if (input == null) throw new Error('Champ de saisie absent')
    input.value = '2x=5'
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
    solver.querySelector<HTMLButtonElement>('.evaluate')?.click()

    expect(solver.interactivityOn).toBe(false)
    expect(solver.querySelector('.message')?.textContent).toContain(
      "n'est pas équivalente",
    )
  })

  it('conserve une étape fausse en rouge et reprend depuis la dernière étape correcte', () => {
    document.body.innerHTML = addMathaleaSolveur(exercice, 0, {
      initial: '2x+4=10',
      mode: 'entrainement',
    })
    const solver = document.querySelector(
      'mathalea-solveur',
    ) as MathaleaSolveurElement
    const firstAttempt = solver.querySelectorAll('math-field')[1] as
      (HTMLElement & { value: string }) | undefined
    if (firstAttempt == null) throw new Error('Champ de saisie absent')
    firstAttempt.value = '2x=5'
    firstAttempt.dispatchEvent(new InputEvent('input', { bubbles: true }))
    solver.evaluate()

    expect(solver.querySelectorAll('.line.invalid')).toHaveLength(1)
    expect(solver.querySelector('.line.invalid')?.textContent).toContain(
      'Étape incorrecte',
    )
    expect(solver.value).toBe('')
    expect(solver.querySelectorAll('math-field')).toHaveLength(3)
    expect(
      [...solver.querySelectorAll('.step')].map((step) => step.textContent),
    ).toEqual(['Énoncé', 'Étape 1', 'Étape 1'])

    const secondAttempt = solver.querySelectorAll('math-field')[2] as
      (HTMLElement & { value: string }) | undefined
    if (secondAttempt == null) throw new Error('Nouveau champ de saisie absent')
    secondAttempt.value = '2x=6'
    secondAttempt.dispatchEvent(new InputEvent('input', { bubbles: true }))
    solver.evaluate()

    expect(solver.value).toBe('2x=6')
    expect(solver.querySelectorAll('.line.invalid')).toHaveLength(1)
    expect(
      [...solver.querySelectorAll('.step')].map((step) => step.textContent),
    ).toEqual(['Énoncé', 'Étape 1', 'Étape 1', 'Étape 2'])
    expect(solver.querySelector('.message')?.textContent).toContain(
      'équivalente',
    )
  })

  it('corrige la dernière ligne avec la réponse de handleAnswers', () => {
    document.body.innerHTML = `${addMathaleaSolveur(exercice, 0, {
      initial: '2x+4=10',
    })}<span id="resultatCheckEx4Q0"></span><div id="feedbackEx4Q0"></div>`
    exercice.autoCorrection[0].valeur = { reponse: { value: 'x=3' } }
    const solver = document.querySelector(
      'mathalea-solveur',
    ) as MathaleaSolveurElement
    solver.value = 'x=3'

    expect(MathaleaSolveurElement.verifQuestion(exercice, 0)).toEqual({
      isOk: true,
      feedback: '',
      score: { nbBonnesReponses: 1, nbReponses: 1 },
    })
    expect(exercice.answers?.[solver.id]).toBe('x=3')
    expect(solver.interactivityOn).toBe(false)
  })

  it('refuse une étape équivalente qui ne présente pas encore la forme attendue', () => {
    document.body.innerHTML = addMathaleaSolveur(exercice, 0, {
      initial: '2x+4=10',
    })
    exercice.autoCorrection[0].valeur = { reponse: { value: 'x=3' } }
    const solver = document.querySelector(
      'mathalea-solveur',
    ) as MathaleaSolveurElement
    solver.value = '2x=6'

    expect(MathaleaSolveurElement.verifQuestion(exercice, 0).isOk).toBe(false)
  })
})

describe('isEquivalentInequality', () => {
  const check = isEquivalentInequality()

  it('accepte les transformations positives', () => {
    expect(check.run('x+2<5', '2x+4<10').passed).toBe(true)
  })

  it('exige de retourner le signe après multiplication par un négatif', () => {
    expect(check.run('x>2', '-2x<-4').passed).toBe(true)
    expect(check.run('x<2', '-2x<-4').passed).toBe(false)
  })

  it('distingue les inégalités strictes et larges', () => {
    expect(check.run('x\\leq2', '2x<=4').passed).toBe(true)
    expect(check.run('x\\leqslant2', '2x<=4').passed).toBe(true)
    expect(check.run('x<2', '2x<=4').passed).toBe(false)
  })
})
