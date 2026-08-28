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
})
