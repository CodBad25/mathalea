import { afterEach, describe, expect, it } from 'vitest'
import { setOutputHtml, setOutputLatex } from '../../src/modules/context'
import FractionEtendue from '../../src/modules/FractionEtendue'
import { tableauSignesFacteurs } from '../../src/lib/mathFonctions/etudeFonction'

describe('tableauSignesFacteurs', () => {
  afterEach(() => {
    setOutputHtml()
  })

  it('affiche les bornes et accepte des libelles directs', () => {
    setOutputLatex()

    const tableau = tableauSignesFacteurs(
      [
        {
          nom: 'x-1',
          fonction: (x: number) => x - 1,
          zero: 1,
        },
      ],
      -99,
      99,
      {
        borneInf: '-\\infty',
        borneSup: '+\\infty',
      },
    )

    expect(tableau).toContain('$-\\infty$')
    expect(tableau).toContain('$+\\infty$')
    expect(tableau).toContain('$1$')
    expect(tableau).not.toContain('$-99$')
    expect(tableau).not.toContain('$99$')
  })

  it("peut conserver l'ancien affichage sans bornes", () => {
    setOutputLatex()

    const tableau = tableauSignesFacteurs(
      [
        {
          nom: 'x',
          fonction: (x: number) => x,
          zero: 0,
        },
      ],
      -10,
      10,
      { afficherBornes: false },
    )

    expect(tableau).toContain('$0$')
    expect(tableau).not.toContain('$-10$')
    expect(tableau).not.toContain('$10$')
  })

  it('applique des libelles directs sur des bornes fractionnaires', () => {
    setOutputLatex()

    const tableau = tableauSignesFacteurs(
      [
        {
          nom: 'x',
          fonction: (x: number) => x,
          zero: 0,
        },
      ],
      new FractionEtendue(-1, 2),
      new FractionEtendue(1, 2),
      {
        fractionTex: true,
        borneInf: 'a',
        borneSup: 'b',
      },
    )

    expect(tableau).toContain('$a$')
    expect(tableau).toContain('$b$')
    expect(tableau).toContain('$0$')
  })

  it("augmente la hauteur de l'entete quand une fraction est affichee", () => {
    setOutputLatex()

    const tableau = tableauSignesFacteurs(
      [
        {
          nom: '5x-1',
          fonction: (x: number) => 5 * x - 1,
          zero: new FractionEtendue(1, 5),
        },
      ],
      -1,
      1,
      { fractionTex: true },
    )

    expect(tableau).toMatch(/\$x\$\s*\/\s*2/)
    expect(tableau).toContain('\\dfrac{1}{5}')
  })

  it('elargit automatiquement la premiere colonne pour les libelles longs', () => {
    setOutputLatex()

    const tableau = tableauSignesFacteurs(
      [
        {
          nom: '-10x+2',
          fonction: (x: number) => -10 * x + 2,
          zero: new FractionEtendue(1, 5),
        },
      ],
      -1,
      1,
      { fractionTex: true },
    )
    const lgt = Number(tableau.match(/\\tkzTabInit\[lgt=([0-9.]+)/)?.[1])

    expect(lgt).toBeGreaterThan(3)
  })
})
