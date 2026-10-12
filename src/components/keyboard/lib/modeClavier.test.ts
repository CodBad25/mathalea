import { describe, expect, it } from 'vitest'
import { keyboardBlocks, specialKeys } from '../layouts/keysBlocks'
import { choisitClavierReduit, dimensionsClavierAgrandi } from './modeClavier'

const agrandi = { largeur: 500, hauteur: 220 }
const base = {
  preference: null,
  nbPagesEnLigne: 2,
  agrandi,
  innerWidth: 900,
  innerHeight: 700,
  tactile: false,
}

describe('dimensionsClavierAgrandi', () => {
  it('estime un clavier chiffres + longueurs sur grand écran', () => {
    const { largeur, hauteur } = dimensionsClavierAgrandi(
      [specialKeys, keyboardBlocks.numbers],
      [keyboardBlocks.lengths],
      900,
    )
    // 4 rangées de touches de 40 px, espacées de 8 px, plus 32 px de padding
    expect(hauteur).toBe(4 * 40 + 3 * 8 + 32)
    expect(largeur).toBeLessThan(900)
  })

  it('ajoute la hauteur des onglets quand plusieurs blocs d’unités', () => {
    const unites = [keyboardBlocks.lengths, keyboardBlocks.areas]
    const avecOnglets = dimensionsClavierAgrandi([specialKeys], unites, 900)
    const sansOnglets = dimensionsClavierAgrandi(
      [specialKeys],
      [keyboardBlocks.lengths],
      900,
    )
    expect(avecOnglets.hauteur).toBeGreaterThan(sansOnglets.hauteur)
  })
})

describe('choisitClavierReduit', () => {
  it('respecte le dernier choix de l’élève', () => {
    expect(choisitClavierReduit({ ...base, preference: true })).toBe(true)
    expect(
      choisitClavierReduit({ ...base, preference: false, nbPagesEnLigne: 1 }),
    ).toBe(false)
  })

  it('reste réduit quand toutes les touches tiennent sur une ligne', () => {
    expect(choisitClavierReduit({ ...base, nbPagesEnLigne: 1 })).toBe(true)
    expect(
      choisitClavierReduit({ ...base, nbPagesEnLigne: 1, tactile: true }),
    ).toBe(true)
  })

  it('s’agrandit plutôt que de cacher des touches sur une autre page', () => {
    expect(choisitClavierReduit(base)).toBe(false)
  })

  it('garde les pages si le clavier agrandi est trop haut ou trop large', () => {
    expect(
      choisitClavierReduit({ ...base, agrandi: { largeur: 500, hauteur: 400 } }),
    ).toBe(true)
    expect(
      choisitClavierReduit({ ...base, agrandi: { largeur: 950, hauteur: 220 } }),
    ).toBe(true)
  })

  it('reste agrandi sur écran tactile dès qu’il y a plusieurs pages', () => {
    expect(
      choisitClavierReduit({
        ...base,
        tactile: true,
        agrandi: { largeur: 500, hauteur: 400 },
      }),
    ).toBe(false)
  })
})
