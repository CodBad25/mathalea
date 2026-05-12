import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IntercalerDecimalEntre2Decimaux from '../../src/exercices/6e/6N1M-1'
import { context } from '../../src/modules/context'

vi.mock('../../src/lib/components/version', () => ({
  checkForServerUpdate: vi.fn(() => 'mocked value'),
}))

describe('IntercalerDecimalEntre2Decimaux', () => {
  const initialIsHtml = context.isHtml

  beforeEach(() => {
    context.isHtml = initialIsHtml
  })

  afterEach(() => {
    context.isHtml = initialIsHtml
  })

  it('Répète 1000 fois nouvelleVersion avec choix mélange et 10 questions/corrections/autocorrections en interactif html', () => {
    const instance = new IntercalerDecimalEntre2Decimaux()
    instance.nbQuestions = 10
    const dureesNouvelleVersionMs: number[] = []

    expect(instance.consigne).toBe('Compléter avec un nombre décimal.')
    expect(instance.nbQuestions).toBe(10)
    expect(instance.nbCols).toBe(2)
    expect(instance.nbColsCorr).toBe(2)
    expect(instance.sup).toBe('11')

    context.isHtml = true
    instance.interactif = true

    for (let i = 0; i < 1000; i++) {
      const start = performance.now()
      instance.nouvelleVersion()
      const dureeMs = performance.now() - start
      dureesNouvelleVersionMs.push(dureeMs)

      expect(instance.nbQuestions).toBe(10)
      expect(instance.nbCols).toBe(2)
      expect(instance.nbColsCorr).toBe(2)
      expect(instance.sup).toBe('11')

      expect(instance.listeQuestions).toHaveLength(10)
      expect(instance.listeCorrections).toHaveLength(10)
      expect(instance.autoCorrection).toHaveLength(10)

      // Garde-fou de performance: chaque generation doit rester tres rapide.
      expect(dureeMs).toBeLessThan(200)
    }

    expect(dureesNouvelleVersionMs).toHaveLength(1000)
  })
})
