import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  coupsPossibles,
  JuniperGreenElement,
  raisonDuRefus,
  type ReglesJuniperGreen,
} from '../../src/lib/customElements/JuniperGreenElement'
import {
  context,
  setOutputHtml,
  setOutputLatex,
} from '../../src/modules/context'

const reglesLibres: ReglesJuniperGreen = {
  max: 40,
  debutPremierInterdit: false,
}
const reglesSansPremierAuDepart: ReglesJuniperGreen = {
  max: 40,
  debutPremierInterdit: true,
}

afterEach(() => {
  setOutputHtml()
  context.isTypst = false
})

describe('règles du Juniper Green', () => {
  it('accepte n’importe quel nombre au premier coup', () => {
    expect(raisonDuRefus([], 23, reglesLibres)).toBeNull()
  })

  it('refuse un nombre premier au premier coup quand c’est interdit', () => {
    expect(raisonDuRefus([], 23, reglesSansPremierAuDepart)).toContain(
      'nombre premier',
    )
    // 1 n'est pas premier, il reste donc jouable.
    expect(raisonDuRefus([], 1, reglesSansPremierAuDepart)).toBeNull()
    expect(raisonDuRefus([], 24, reglesSansPremierAuDepart)).toBeNull()
  })

  it('n’accepte ensuite qu’un multiple ou un diviseur du dernier nombre', () => {
    expect(raisonDuRefus([12], 24, reglesLibres)).toBeNull()
    expect(raisonDuRefus([12], 4, reglesLibres)).toBeNull()
    expect(raisonDuRefus([12], 5, reglesLibres)).toContain(
      'ni un multiple ni un diviseur de 12',
    )
  })

  it('refuse un nombre déjà utilisé ou hors de la grille', () => {
    expect(raisonDuRefus([12, 24], 12, reglesLibres)).toContain(
      'déjà été utilisé',
    )
    expect(raisonDuRefus([12], 48, reglesLibres)).toContain(
      'pas dans la grille',
    )
  })

  it('ne laisse aucun coup après un grand nombre premier suivant le 1', () => {
    // 23 n'a que 1 pour diviseur et 46 sort de la grille.
    expect(coupsPossibles([1, 23], reglesLibres)).toEqual([])
    expect(coupsPossibles([23], reglesLibres)).toEqual([1])
  })

  it('exclut les nombres premiers des premiers coups possibles', () => {
    expect(coupsPossibles([], reglesSansPremierAuDepart)).not.toContain(7)
    expect(coupsPossibles([], reglesSansPremierAuDepart)).toContain(8)
  })
})

describe('rendus du composant juniper-green', () => {
  it('rejoue la partie reçue et colorie les nombres utilisés en HTML', () => {
    setOutputHtml()
    document.body.innerHTML = JuniperGreenElement.create({
      max: 12,
      nombresParLigne: 5,
      suite: [4, 8, 1, 5],
      interactivityOn: false,
    })
    const element = document.querySelector(
      'juniper-green',
    ) as JuniperGreenElement
    expect(element.value).toEqual([4, 8, 1, 5])
    expect(element.textContent).toContain(
      'Suite des nombres choisis : 4 → 8 → 1 → 5.',
    )
  })

  it('dévoile la partie une seconde par nombre quand l’animation est demandée', () => {
    vi.useFakeTimers()
    try {
      setOutputHtml()
      document.body.innerHTML = JuniperGreenElement.create({
        max: 12,
        nombresParLigne: 5,
        suite: [4, 8, 1, 5],
        animation: true,
        interactivityOn: false,
      })
      const element = document.querySelector(
        'juniper-green',
      ) as JuniperGreenElement
      // La partie complète reste l'état métier, seul l'affichage progresse.
      expect(element.value).toEqual([4, 8, 1, 5])
      expect(element.textContent).toContain('Suite des nombres choisis : 4.')
      vi.advanceTimersByTime(1000)
      expect(element.textContent).toContain(
        'Suite des nombres choisis : 4 → 8.',
      )
      vi.advanceTimersByTime(2000)
      expect(element.textContent).toContain(
        'Suite des nombres choisis : 4 → 8 → 1 → 5.',
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('dimensionne la grille en em pour suivre le zoom des vues', () => {
    setOutputHtml()
    document.body.innerHTML = JuniperGreenElement.create({
      max: 10,
      nombresParLigne: 5,
    })
    const element = document.querySelector(
      'juniper-green',
    ) as JuniperGreenElement
    const grille = element.querySelector('div > div') as HTMLElement
    // Le zoom pose une font-size en rem sur le conteneur de l'énoncé : une
    // taille en rem ou en pixels ne la suivrait pas.
    expect(grille.style.gridTemplateColumns).toBe('repeat(5, 2.25em)')
    expect(grille.style.gap).toBe('0.25em')
    const cellule = element.querySelector(
      '[data-nombre="1"]',
    ) as HTMLButtonElement
    expect(cellule.style.fontSize).toBe('1em')
    expect(cellule.style.width).toBe('2.25em')
    expect(cellule.style.height).toBe('2.25em')
  })

  it('tronque une partie reçue au premier coup illicite', () => {
    setOutputHtml()
    document.body.innerHTML = JuniperGreenElement.create({
      max: 12,
      nombresParLigne: 5,
      suite: [4, 8, 5],
    })
    const element = document.querySelector(
      'juniper-green',
    ) as JuniperGreenElement
    expect(element.value).toEqual([4, 8])
  })

  it('imprime une grille vide en LaTeX pour l’énoncé', () => {
    setOutputLatex()
    const latex = JuniperGreenElement.create({ max: 10, nombresParLigne: 5 })
    expect(latex).toContain('\\begin{tabular}{|c|c|c|c|c|}')
    expect(latex).not.toContain('color')
    expect(latex).not.toContain('Suite des nombres choisis')
  })

  it('met en évidence la partie exemple en LaTeX pour la correction', () => {
    setOutputLatex()
    const latex = JuniperGreenElement.create({
      max: 10,
      nombresParLigne: 5,
      suite: [4, 8, 1],
    })
    expect(latex).toContain('\\boldsymbol{4}')
    expect(latex).toContain('Suite des nombres choisis : $4 \\to 8 \\to 1$.')
  })

  it('produit une table Typst encadrée par le marqueur mathalea-typst', () => {
    setOutputHtml()
    context.isTypst = true
    const typst = JuniperGreenElement.create({
      max: 10,
      nombresParLigne: 5,
      suite: [4, 8],
    })
    expect(typst.startsWith('<mathalea-typst>')).toBe(true)
    expect(typst).toContain('table(columns: 5')
    expect(typst).toContain('Suite des nombres choisis : 4 → 8.')
  })
})
