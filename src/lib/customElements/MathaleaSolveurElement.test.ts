import { describe, expect, it } from 'vitest'
import { isSolvedForm } from './MathaleaSolveurElement'
import { tousLesSolveursSontTermines } from './solveurTermine'
import type { IExercice } from '../types'

describe('isSolvedForm', () => {
  it.each([
    'x=3',
    'x=-3',
    'x=2,5',
    'x=2.5',
    'x=\\dfrac{6}{5}',
    'x=-\\frac{6}{5}',
    'x=\\dfrac{-6}{5}',
    '3=x',
  ])('accepte %s', (value) => {
    expect(isSolvedForm(value, 'equation', 'x')).toBe(true)
  })

  it.each([
    'x=2\\times\\frac{3}{5}',
    'x=2\\times\\dfrac{3}{5}',
    'x=\\dfrac{6+1}{5}',
    'x=3+2',
    'x=\\dfrac{6}{2}',
    'x=\\dfrac{6}{4}',
    'x=\\dfrac{-10}{5}',
    '2x=6',
    'x=x+1',
  ])("refuse %s tant que le calcul n'est pas fini", (value) => {
    expect(isSolvedForm(value, 'equation', 'x')).toBe(false)
  })

  it('gère les inéquations', () => {
    expect(isSolvedForm('x\\leqslant\\dfrac{3}{5}', 'inequation', 'x')).toBe(
      true,
    )
    expect(isSolvedForm('x<2\\times3', 'inequation', 'x')).toBe(false)
  })
})

describe('tousLesSolveursSontTermines', () => {
  const exercice = {
    autoCorrection: [
      { formatInteractif: 'mathalea-solveur' },
      { formatInteractif: 'mathalea-solveur' },
    ],
  } as unknown as IExercice

  function conteneur(etats: boolean[]): HTMLElement {
    const div = document.createElement('div')
    for (const interactivityOn of etats) {
      const solveur = document.createElement(
        'mathalea-solveur',
      ) as HTMLElement & { interactivityOn: boolean }
      solveur.interactivityOn = interactivityOn
      div.appendChild(solveur)
    }
    return div
  }

  it('attend que tous les solveurs soient terminés', () => {
    expect(
      tousLesSolveursSontTermines(exercice, conteneur([false, true])),
    ).toBe(false)
    expect(
      tousLesSolveursSontTermines(exercice, conteneur([false, false])),
    ).toBe(true)
  })

  it("ne s'applique pas si une question n'est pas un solveur", () => {
    const mixte = {
      autoCorrection: [
        { formatInteractif: 'mathalea-solveur' },
        { formatInteractif: 'mathlive' },
      ],
    } as unknown as IExercice
    expect(tousLesSolveursSontTermines(mixte, conteneur([false]))).toBe(false)
  })
})
