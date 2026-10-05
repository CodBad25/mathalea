import seedrandom from 'seedrandom'
import { describe, expect, it } from 'vitest'
import { sortRandomlyLikeV8 } from '../../src/lib/outils/arrayOutils'

/**
 * Les exercices publiés (4A12-1, 4C20-2, 5G1A, 6G2B-1, 6G2C-2…) ont été tirés avec le tri natif de V8.
 * Ce test garantit que `sortRandomlyLikeV8` produit le même résultat et consomme le même nombre
 * de `Math.random` : toute différence décalerait les tirages des liens déjà partagés.
 */
describe('sortRandomlyLikeV8', () => {
  it('donne le même résultat et la même consommation de Math.random que le tri natif', () => {
    for (let n = 0; n <= 70; n++) {
      for (let graine = 1; graine <= 100; graine++) {
        const base = Array.from({ length: n }, (_, i) => i)

        seedrandom(String(graine), { global: true })
        const natif = [...base].sort(() => Math.random() - 0.5)
        const suiteNatif = Math.random()

        seedrandom(String(graine), { global: true })
        const stable = sortRandomlyLikeV8([...base])
        const suiteStable = Math.random()

        expect(stable, `n=${n} graine=${graine}`).toEqual(natif)
        expect(suiteStable, `n=${n} graine=${graine}`).toBe(suiteNatif)
      }
    }
  })

  it('trie en place et renvoie le même tableau', () => {
    const tableau = [1, 2, 3, 4]
    expect(sortRandomlyLikeV8(tableau)).toBe(tableau)
  })
})
