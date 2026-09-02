import { describe, expect, it } from 'vitest'
import { defaultCoverPoints } from './coverBareme'

describe('barème proposé de la page de garde', () => {
  it('compte les items effectivement générés', () => {
    expect(
      defaultCoverPoints({
        listeQuestions: ['a', 'b', 'c'],
        nbQuestions: 10,
      }),
    ).toBe(3)
  })

  it('utilise le nombre configuré pendant la duplication', () => {
    expect(defaultCoverPoints({ listeQuestions: [], nbQuestions: 6 })).toBe(6)
  })

  it('retombe sur un point si aucun nombre exploitable n’est disponible', () => {
    expect(defaultCoverPoints(null)).toBe(1)
    expect(defaultCoverPoints({ listeQuestions: [], nbQuestions: 0 })).toBe(1)
  })
})
