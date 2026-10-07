import { expect, it, vi } from 'vitest'
import Consommation from '../../../../src/exercices/1e/1A-C15-5'
import * as arrayOutils from '../../../../src/lib/outils/arrayOutils'

it('conserver les fractions jusqu’au coût exact dans la version originale', () => {
  const exercice = new Consommation()
  exercice.sup3 = false
  exercice.versionOriginale()
  expect(exercice.correction).toContain(
    '\\dfrac{6}{5}\\times \\dfrac{1}{6}=\\dfrac{1}{5}',
  )
  expect(exercice.correction).toContain(
    '\\dfrac{1}{5}\\times \\dfrac{1}{5}=\\dfrac{1}{25}',
  )
  expect(exercice.correction).toContain('0,04')
  expect(exercice.correction).not.toContain('valeur approchée')
})

it('signaler l’arrondi lorsque le coût n’a pas d’écriture décimale finie', () => {
  const exercice = new Consommation()
  exercice.sup3 = false
  const tirage = vi.spyOn(arrayOutils, 'choice')
  tirage.mockReturnValueOnce({ puissance: 1000, duree: 10 })
  try {
    exercice.versionAleatoire()
    expect(exercice.correction).toContain(
      '\\dfrac{1}{6}\\times \\dfrac{1}{5}=\\dfrac{1}{30}',
    )
    expect(exercice.correction).toContain(
      "valeur approchée arrondie au centième d'euro",
    )
    expect(exercice.correction).not.toMatch(/=0(?:\{,\}|,)03/)
  } finally {
    tirage.mockRestore()
  }
})
