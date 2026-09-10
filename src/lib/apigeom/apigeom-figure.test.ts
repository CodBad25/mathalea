import Figure from 'apigeom'
import { describe, expect, it } from 'vitest'
import { apigeomFigureToSvg } from './apigeom-figure'
import { apigeomGraduatedLine } from './apigeomGraduatedLine'

describe('apigeomFigureToSvg', () => {
  it("rend la virgule décimale des graduations sans les accolades {,} de l'espacement KaTeX", () => {
    // Reproduit une droite graduée à une décimale (cf. 5G1A-1 / 5N2E-1) :
    // apigeom `displayNumber` produit des libellés « -0{,}3 », « 0{,}1 »…
    // que `addTextElementsToSvg` pose tels quels en nœuds SVG <text>.
    const { figure } = apigeomGraduatedLine({
      xMin: -0.3001,
      xMax: 0.4001,
      scale: 10,
    })
    const svg = apigeomFigureToSvg(figure as never)
    const labels = [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(
      (match) => match[1],
    )

    expect(svg).not.toContain('{,}')
    expect(labels).toContain('-0,3')
    expect(labels).toContain('0,1')
  })

  it('rend les labels de vecteurs (repère Oij et vecteurs nommés) sans code LaTeX brut', () => {
    // Reproduit un repère `repereOij` (labels `$\vec \imath$` / `$\vec \jmath$`)
    // avec un vecteur nommé `$\vec{u}$` (cf. 2G23-2) : sans nettoyage, le code
    // KaTeX est posé tel quel en nœud SVG <text>.
    const figure = new Figure({ xMin: -3, yMin: -3, width: 300, height: 300 })
    figure.create('Grid', { repereOij: true })
    const origin = figure.create('Point', { x: 0, y: 0, isVisible: false })
    figure.create('Vector', { origin, x: 2, y: 1, label: '\\vec{u}' })

    const svg = apigeomFigureToSvg(figure as never)
    const labels = [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(
      (match) => match[1],
    )

    expect(svg).not.toContain('\\vec')
    expect(svg).not.toContain('\\imath')
    expect(svg).not.toContain('\\jmath')
    expect(labels).toContain('ı⃗')
    expect(labels).toContain('ȷ⃗')
    expect(labels).toContain('u⃗')
  })
})
