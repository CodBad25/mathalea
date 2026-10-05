import { describe, expect, it } from 'vitest'
import { isSolvedForm } from './MathaleaSolveurElement'

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
