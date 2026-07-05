import { describe, expect, it } from 'vitest'
import { paginate } from './paginate'
import type { A4UnitData } from './types'

const unit = (
  exerciseIndex: number,
  kind: A4UnitData['kind'],
  index = 0,
): A4UnitData => ({
  id: `${exerciseIndex}-${kind}-${index}`,
  exerciseIndex,
  kind,
  html: '',
})

describe('paginate', () => {
  it('répartit les unités dans une colonne unique', () => {
    const units = [
      unit(0, 'question', 0),
      unit(0, 'question', 1),
      unit(0, 'question', 2),
    ]
    const pages = paginate(units, [100, 100, 100], 350, 350, 1)
    expect(pages).toEqual([[[0, 1, 2]]])
  })

  it('crée une nouvelle colonne puis une nouvelle page quand la hauteur est dépassée', () => {
    const units = [0, 1, 2, 3].map((i) => unit(0, 'question', i))
    const pages = paginate(units, [100, 100, 100, 100], 150, 150, 2)
    expect(pages).toEqual([
      [[0], [1]],
      [[2], [3]],
    ])
  })

  it('utilise une hauteur réduite pour les colonnes de la première page', () => {
    const units = [0, 1, 2].map((i) => unit(0, 'question', i))
    // première page : 100 de haut (1 unité par colonne), pages suivantes : 250
    const pages = paginate(units, [100, 100, 100], 100, 250, 1)
    expect(pages).toEqual([[[0]], [[1, 2]]])
  })

  it('garde le titre et la consigne solidaires de la première question', () => {
    const units = [
      unit(0, 'question', 0),
      unit(1, 'title'),
      unit(1, 'intro'),
      unit(1, 'question', 0),
    ]
    // le groupe titre+consigne+question (150) ne tient pas dans les 100 restants
    const pages = paginate(units, [100, 50, 50, 50], 200, 200, 1)
    expect(pages).toEqual([[[0]], [[1, 2, 3]]])
  })

  it('ne sépare pas un titre de la question suivante même en multi-colonnes', () => {
    const units = [
      unit(0, 'question', 0),
      unit(0, 'question', 1),
      unit(1, 'title'),
      unit(1, 'question', 0),
    ]
    const pages = paginate(units, [100, 100, 40, 80], 210, 210, 2)
    expect(pages).toEqual([
      [
        [0, 1],
        [2, 3],
      ],
    ])
  })

  it('place seul un groupe plus haut qu une colonne (débordement accepté)', () => {
    const units = [unit(0, 'question', 0), unit(0, 'question', 1)]
    const pages = paginate(units, [500, 100], 300, 300, 1)
    expect(pages).toEqual([[[0]], [[1]]])
  })

  it('complète les pages avec des colonnes vides', () => {
    const units = [unit(0, 'question', 0)]
    const pages = paginate(units, [50], 300, 300, 3)
    expect(pages).toEqual([[[0], [], []]])
  })

  it('retourne une page vide sans unités', () => {
    const pages = paginate([], [], 300, 300, 2)
    expect(pages).toEqual([[[], []]])
  })

  it('force un saut de colonne après une unité marquée', () => {
    const units = [0, 1, 2].map((i) => unit(0, 'question', i))
    // tout tiendrait dans une colonne, mais un saut est imposé après l'unité 0
    const pages = paginate(units, [50, 50, 50], 300, 300, 2, new Set([0]))
    expect(pages).toEqual([[[0], [1, 2]]])
  })

  it('un saut forcé en fin de page crée une nouvelle page', () => {
    const units = [0, 1].map((i) => unit(0, 'question', i))
    const pages = paginate(units, [50, 50], 300, 300, 1, new Set([0]))
    expect(pages).toEqual([[[0]], [[1]]])
  })
})
