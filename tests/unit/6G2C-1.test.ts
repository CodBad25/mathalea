import seedrandom from 'seedrandom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RegionsDuPlan from '../../src/exercices/6e/6G2C-1'
import * as cercles from '../../src/lib/2d/cercle'
import { combinaisonListes } from '../../src/lib/outils/arrayOutils'

vi.mock('../../src/lib/outils/arrayOutils', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../src/lib/outils/arrayOutils')
  >()),
  combinaisonListes: vi.fn(),
}))

const originalRandom = Math.random

afterEach(() => {
  Math.random = originalRandom
  vi.restoreAllMocks()
})

describe('6G2C-1 : régions définies par deux disques', () => {
  it.each([
    'intersectionDeuxDisques',
    'exterieurDeuxDisques',
    'interieurDisqueExterieurAutreDisque',
  ])('génère uniquement des cercles sécants pour %s', (type) => {
    vi.mocked(combinaisonListes).mockReturnValue([type])
    const cercle = vi.spyOn(cercles, 'cercle')
    for (const seed of [
      'uxb0',
      ...Array.from({ length: 50 }, (_, i) => String(i)),
    ]) {
      seedrandom(seed, { global: true })
      cercle.mockClear()
      const exercice = new RegionsDuPlan()
      exercice.nouvelleVersion()
      expect(exercice.listeQuestions).toHaveLength(1)
      expect(exercice.listeCorrections).toHaveLength(1)
      expect(cercle).toHaveBeenCalledTimes(2)
      const [[centre1, rayon1], [centre2, rayon2]] = cercle.mock.calls
      const distance = Math.hypot(centre2.x - centre1.x, centre2.y - centre1.y)
      expect(distance).toBeGreaterThan(Math.abs(rayon1 - rayon2))
      expect(distance).toBeLessThan(rayon1 + rayon2)
      expect(exercice.listeQuestions[0]).not.toMatch(/NaN|Infinity/)
    }
  })
})
