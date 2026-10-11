import { afterEach, expect, it, vi } from 'vitest'
import SymetrieProprietesArchive from '../../src/exercices/5e/5G3B-2-old'
import SymetrieProprietes from '../../src/exercices/5e/5G3B-2'

const originalRandom = Math.random

afterEach(() => {
  Math.random = originalRandom
  vi.unstubAllGlobals()
})

it.each([
  ['version courante', SymetrieProprietes],
  ['version archivée', SymetrieProprietesArchive],
] as const)(
  'générer la graine e906e sans intersection impossible (%s)',
  (_, Exercise) => {
    const notify = vi.fn()
    vi.stubGlobal('notify', notify)
    const exercice = new Exercise()
    exercice.seed = 'e906e'
    exercice.nbQuestions = 4
    exercice.nouvelleVersionWrapper()

    expect(exercice.listeQuestions).toHaveLength(4)
    expect(notify).not.toHaveBeenCalled()
  },
)
