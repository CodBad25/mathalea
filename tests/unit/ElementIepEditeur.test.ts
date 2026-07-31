import { describe, expect, it } from 'vitest'
import { construireAnimation } from '../../src/lib/customElements/ElementIepEditeur'

describe('ElementIepEditeur intersections', () => {
  it('intersects a line with a perpendicular at the orthogonal projection', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'point', nom: 'C', x: 2, y: 3 },
      { type: 'droite', p1: 'A', p2: 'B' },
      { type: 'perpendiculaire', p1: 'A', p2: 'B', p3: 'C' },
      { type: 'intersection', nom: 'H', etape1: 3, etape2: 4, choix: 1 },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /texte="\$H\$"[\s\S]*<action abscisse="300" ordonnee="198" couleur="black" id="\d+" mouvement="creer" objet="point" tempo="5"\/>/,
    )
    expect(xml).not.toMatch(
      /texte="\$H\$"[\s\S]*<action abscisse="360" ordonnee="198" couleur="black" id="\d+" mouvement="creer" objet="point" tempo="5"\/>/,
    )
  })
})
