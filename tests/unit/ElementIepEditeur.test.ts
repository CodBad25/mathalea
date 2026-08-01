import { describe, expect, it } from 'vitest'
import {
  construireAnimation,
  ElementIepEditeur,
} from '../../src/lib/customElements/ElementIepEditeur'
import { context } from '../../src/modules/context'

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

describe('ElementIepEditeur trait instruction', () => {
  it('draws a quick pencil line between two points', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'trait', p1: 'A', p2: 'B' },
    ])

    const xml = animation.script()
    expect(xml).toContain(
      'mouvement="tracer" objet="crayon" tempo="0" vitesse="10000"',
    )
  })
})

describe('ElementIepEditeur unknown instructions', () => {
  it('does not crash while collecting required instruments', () => {
    expect(() =>
      construireAnimation([
        { type: 'point', nom: 'A', x: 0, y: 0 },
        { type: 'instructionInconnue' },
      ] as never),
    ).not.toThrow()
  })
})

describe('ElementIepEditeur conditions initiales', () => {
  it('plays initial conditions immediately and keeps following steps animated', () => {
    const animation = construireAnimation(
      [
        { type: 'point', nom: 'A', x: 0, y: 0 },
        { type: 'point', nom: 'B', x: 4, y: 0 },
        { type: 'segment', p1: 'A', p2: 'B' },
      ],
      2,
    )

    const xml = animation.script()
    expect(xml).toMatch(/texte="\$A\$"[\s\S]*objet="point" tempo="0"/)
    expect(xml).toMatch(/texte="\$B\$"[\s\S]*objet="point" tempo="0"/)
    expect(xml).toMatch(/objet="crayon" tempo="5"/)
  })

  it('keeps required instruments visible and puts them back in storage', () => {
    const animation = construireAnimation(
      [
        { type: 'point', nom: 'A', x: 0, y: 0 },
        { type: 'point', nom: 'B', x: 4, y: 0 },
        { type: 'segment', p1: 'A', p2: 'B' },
      ],
      0,
      { rangerInstruments: true },
    )

    const xml = animation.script()
    expect(xml).toMatch(/objet="regle" mouvement="montrer"/)
    expect(xml).toMatch(/objet="crayon" mouvement="montrer"/)
    expect(xml).toMatch(
      /objet="regle" mouvement="rotation_translation" angle="0"[\s\S]*sens="100000" vitesse="20"/,
    )
    expect(xml).toMatch(
      /objet="crayon" mouvement="rotation_translation" angle="0"[\s\S]*sens="100000" vitesse="20"/,
    )
    expect(xml).not.toMatch(/objet="regle" mouvement="masquer"/)
    expect(xml).not.toMatch(/objet="crayon" mouvement="masquer"/)
  })

  it('serializes initial conditions as a distinct attribute', () => {
    const htmlContextAvantTest = context.isHtml
    context.isHtml = true
    const html = ElementIepEditeur.create({
      id: 'editeur-iep-conditions-test',
      conditionsInitiales: [
        { type: 'point', nom: 'A', x: 0, y: 0 },
        { type: 'point', nom: 'B', x: 4, y: 0 },
      ],
      programmeInitial: [{ type: 'segment', p1: 'A', p2: 'B' }],
    })

    expect(html).toContain('conditions-initiales=')
    expect(html).toContain('programme-initial=')
    context.isHtml = htmlContextAvantTest
  })
})
