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

  it('gère \\pencolor HTML et place la couleur avant :: pen', () => {
    const latex = String.raw`\begin{scratch}[blocks]
\blockpen{mettre la couleur du stylo à \pencolor{[HTML]{CB4AD4}}}
\end{scratch}`

    const output = scratchblock(latex)
    expect(typeof output).toBe('string')
    const rendered = String(output)
    expect(rendered).toContain('mettre la couleur du stylo à [#CB4AD4] :: pen')
  })

  it('traduit correctement un script complet stylo/couleur/taille', () => {
    const latex = String.raw`\begin{scratch}
\blockinit{quand \greenflag est cliqué}
\blockmove{s'orienter à \ovalnum{90}}
\blockpen{stylo en position d'écriture}
\blockpen{mettre la couleur du stylo à \pencolor{[HTML]{CB4AD4}}}
\blockrepeat{répéter \ovalnum{10} fois}
{
  \blockrepeat{répéter \ovalnum{10} fois}
  {
    \blockmove{avancer de \ovalnum{20} pas}
    \blockmove{tourner \turnright{} de \ovalnum{36} degrés}
    \blockpen{ajouter \ovalnum{10} à \selectmenu{color} du stylo}
    \blockpen{mettre la taille du stylo à \ovaloperator{\ovaloperator{\ovalmove{abscisse x} modulo \ovalnum{4}} + \ovalnum{1}}}
  }
  \blockmove{avancer de \ovalnum{5} pas}
  \blockmove{tourner \turnright{} de \ovalnum{5} degrés}
}
\end{scratch}`

    const output = scratchblock(latex)
    expect(typeof output).toBe('string')
    const rendered = String(output)

    expect(rendered).toContain('@greenFlag')
    expect(rendered).toContain("s'orienter à [90]")
    expect(rendered).toContain("mettre la couleur du stylo à [#CB4AD4] :: pen")
    expect(rendered).toContain('ajouter [10] à [color v] du stylo :: pen')
    expect(rendered).toMatch(/mettre la taille du stylo à .*:: pen/)
  })
})
