import { afterEach, expect, it, vi } from 'vitest'
import DivisionEuclidienneOppose from '../../src/exercices/TEx/TEA1-21'
import { texNombre } from '../../src/lib/outils/texNombre'
import * as outils from '../../src/modules/outils'

afterEach(() => vi.restoreAllMocks())

it.each([1, 7, 23])(
  'enchaîne les deux divisions avec un reste positif de %i',
  (r) => {
    const tirage = vi.spyOn(outils, 'randint')
    tirage
      .mockReturnValueOnce(24)
      .mockReturnValueOnce(47)
      .mockReturnValueOnce(r)
    const exercice = new DivisionEuclidienneOppose()
    exercice.nouvelleVersion()
    const a = 24 * 48 + r
    expect(exercice.nbQuestions).toBe(1)
    expect(exercice.nbQuestionsModifiable).toBe(true)
    expect(exercice.listeQuestions[0]).toContain(
      `${texNombre(a)}=47\\times 24+${24 + r}`,
    )
    expect(exercice.listeQuestions[0]).toContain(`$${texNombre(a)}$`)
    expect(exercice.listeQuestions[0]).toContain(`$${texNombre(-a)}$`)
    for (let i = 0; i < 2; i++) {
      const reponses = exercice.autoCorrection[0].valeur!
      const q = Number(reponses[i === 0 ? 'champ1' : 'champ3'].value)
      const reste = Number(reponses[i === 0 ? 'champ2' : 'champ4'].value)
      expect(24 * q + reste).toBe(i === 0 ? a : -a)
      expect(reste).toBeGreaterThanOrEqual(0)
      expect(reste).toBeLessThan(24)
      expect(q).toBe(i === 0 ? 48 : -49)
      expect(reponses.bareme!([1, 1, 1, 1])).toEqual([1, 1])
    }
  },
)

it('génère le nombre demandé de paires de questions', () => {
  const exercice = new DivisionEuclidienneOppose()
  exercice.nbQuestions = 4
  exercice.nouvelleVersion()
  expect(exercice.listeQuestions).toHaveLength(4)
  expect(exercice.listeCorrections).toHaveLength(4)
  for (let i = 0; i < 4; i++) {
    expect(exercice.listeQuestions[i]).toContain('a)')
    expect(exercice.listeQuestions[i]).toContain('b)')
    expect(exercice.autoCorrection[i].valeur?.champ4).toBeDefined()
  }
})
