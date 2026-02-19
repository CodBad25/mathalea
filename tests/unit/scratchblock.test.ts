import { beforeEach, describe, expect, it, vi } from 'vitest'

import { scratchblock } from '../../src/modules/scratchblock'

declare global {
  interface Window {
    notify: (...args: any[]) => void
  }
}

describe('scratchblock - garde-fous anti-boucle infinie', () => {
  beforeEach(() => {
    window.notify = vi.fn()
  })

  it('ne boucle pas indéfiniment sur une commande inconnue dans \\ovaloperator', () => {
    const malformedLatex = String.raw`\begin{scratch}[blocks]
\blocklook{dire \ovaloperator{\commandeInconnue{abc}}}
\end{scratch}`

    const start = Date.now()
    const output = scratchblock(malformedLatex)
    const durationMs = Date.now() - start

    expect(typeof output).toBe('string')
    expect(durationMs).toBeLessThan(500)
  })

  it('retourne false quand le nombre d’accolades est incohérent', () => {
    const malformedLatex = String.raw`\begin{scratch}[blocks]
\blocklook{dire \ovaloperator{1 + 2}
\end{scratch}`

    const output = scratchblock(malformedLatex)

    expect(output).toBe(false)
  })
})
