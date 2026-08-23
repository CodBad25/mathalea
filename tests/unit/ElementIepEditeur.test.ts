import { describe, expect, it } from 'vitest'
import {
  construireAnimation,
  ElementIepEditeur,
} from '../../src/lib/customElements/ElementIepEditeur'
import CreateurAnimationInstruments from '../../src/exercices/profs/P025'
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

  it('intersects a line with a perpendicular bisector', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'droite', p1: 'A', p2: 'B' },
      { type: 'mediatrice', p1: 'A', p2: 'B' },
      { type: 'intersection', nom: 'M', etape1: 2, etape2: 3, choix: 1 },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /texte="\$M\$"[\s\S]*<action abscisse="300" ordonnee="315" couleur="black" id="\d+" mouvement="creer" objet="point" tempo="5"\/>/,
    )
  })

  it('intersects a line with an angle bisector', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 4, y: 0 },
      { type: 'point', nom: 'B', x: 0, y: 0 },
      { type: 'point', nom: 'C', x: 0, y: 4 },
      { type: 'point', nom: 'D', x: 2, y: -1 },
      { type: 'point', nom: 'E', x: 2, y: 3 },
      { type: 'droite', p1: 'D', p2: 'E' },
      { type: 'bissectrice', p1: 'A', p2: 'B', p3: 'C' },
      { type: 'intersection', nom: 'I', etape1: 5, etape2: 6, choix: 1 },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /texte="\$I\$"[\s\S]*<action abscisse="180" ordonnee="240" couleur="black" id="\d+" mouvement="creer" objet="point" tempo="5"\/>/,
    )
  })

  it('intersects a line with a protractor ray', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'point', nom: 'C', x: 2, y: -1 },
      { type: 'point', nom: 'D', x: 2, y: 3 },
      { type: 'droite', p1: 'C', p2: 'D' },
      { type: 'demiDroiteAngle', p1: 'A', p2: 'B', angle: 45 },
      { type: 'intersection', nom: 'J', etape1: 4, etape2: 5, choix: 1 },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /texte="\$J\$"[\s\S]*<action abscisse="180" ordonnee="348" couleur="black" id="\d+" mouvement="creer" objet="point" tempo="5"\/>/,
    )
  })
})

describe('ElementIepEditeur direction objects', () => {
  it('uses a custom pencil color for a segment instruction', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'segment', p1: 'A', p2: 'B', couleur: 'red' },
    ])

    const xml = animation.script()
    expect(xml).toMatch(/couleur="red" mouvement="tracer" objet="crayon"/)
  })

  it('extends a point-direction ray from its origin', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'demiDroitePointDirection', p1: 'A', angle: 0 },
      { type: 'prolongerObjet', etape: 1, longueur: 20 },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /objet="crayon" mouvement="translation" abscisse="720" ordonnee="90"[\s\S]*abscisse="120" ordonnee="90" epaisseur="2" couleur="#216D9A" mouvement="tracer" objet="crayon"/,
    )
    expect(xml).toMatch(
      /mouvement="modifier_longueur" objet="regle" longueur="20"[\s\S]*mouvement="modifier_longueur" objet="regle" longueur="15"/,
    )
    expect(xml).not.toMatch(/mouvement="zoom" objet="regle"/)
  })

  it('draws a parallel to a perpendicular bisector', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'point', nom: 'C', x: 3, y: 0 },
      { type: 'mediatrice', p1: 'A', p2: 'B' },
      { type: 'paralleleAObjet', etape: 3, p1: 'C' },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /abscisse="210" ordonnee="315" epaisseur="2" couleur="#216D9A" mouvement="tracer" objet="crayon"/,
    )
  })

  it('draws a perpendicular to an angle bisector', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 4, y: 0 },
      { type: 'point', nom: 'B', x: 0, y: 0 },
      { type: 'point', nom: 'C', x: 0, y: 4 },
      { type: 'point', nom: 'D', x: 2, y: 2 },
      { type: 'bissectrice', p1: 'A', p2: 'B', p3: 'C' },
      { type: 'perpendiculaireAObjet', etape: 4, p1: 'D' },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /abscisse="268" ordonnee="238" epaisseur="2" couleur="#216D9A" mouvement="tracer" objet="crayon"/,
    )
  })

  it('draws a parallel to a protractor ray', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'point', nom: 'C', x: 0, y: 2 },
      { type: 'demiDroiteAngle', p1: 'A', p2: 'B', angle: 0 },
      { type: 'paralleleAObjet', etape: 3, p1: 'C' },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /abscisse="300" ordonnee="90" epaisseur="2" couleur="#216D9A" mouvement="tracer" objet="crayon"/,
    )
  })

  it('draws a perpendicular to a protractor ray', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'point', nom: 'C', x: 2, y: 0 },
      { type: 'demiDroiteAngle', p1: 'A', p2: 'B', angle: 0 },
      { type: 'perpendiculaireAObjet', etape: 3, p1: 'C' },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /abscisse="180" ordonnee="300" epaisseur="2" couleur="#216D9A" mouvement="tracer" objet="crayon"/,
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

describe('ElementIepEditeur compass arc instructions', () => {
  it('draws an arc from two extremities and a center', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'O', x: 0, y: 0 },
      { type: 'point', nom: 'A', x: 4, y: 0 },
      { type: 'point', nom: 'B', x: 0, y: 4 },
      { type: 'arcPointPointCentre', p1: 'O', p2: 'A', p3: 'B' },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /debut="0" fin="-90" mouvement="tracer" objet="compas"/,
    )
  })

  it('reports a length from two points to a directed compass arc', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'point', nom: 'C', x: 1, y: 1 },
      { type: 'reporterLongueurCompas', p1: 'A', p2: 'B', p3: 'C', angle: 0 },
    ])

    const xml = animation.script()
    expect(xml).toMatch(/mouvement="ecarter" objet="compas"/)
    expect(xml).toMatch(
      /objet="compas" mouvement="rotation_translation" angle="10" abscisse="150" ordonnee="90"/,
    )
    expect(xml).toMatch(
      /abscisse="150" ordonnee="90"[\s\S]*debut="10" fin="-10" mouvement="tracer" objet="compas"/,
    )
  })

  it('intersects a reported compass length with a ray', () => {
    const animation = construireAnimation([
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'point', nom: 'C', x: 1, y: 1 },
      { type: 'reporterLongueurCompas', p1: 'A', p2: 'B', p3: 'C', angle: 0 },
      { type: 'demiDroitePointDirection', p1: 'C', angle: 0 },
      { type: 'intersection', nom: 'D', etape1: 3, etape2: 4, choix: 1 },
    ])

    const xml = animation.script()
    expect(xml).toMatch(
      /texte="\$D\$"[\s\S]*<action abscisse="120" ordonnee="90" couleur="black" id="\d+" mouvement="creer" objet="point" tempo="5"\/>/,
    )
  })

  it('keeps the compass out between two reported lengths separated by an intersection', () => {
    const animation = construireAnimation(
      [
        { type: 'point', nom: 'A', x: 0, y: 0 },
        { type: 'point', nom: 'B', x: 4, y: 0 },
        { type: 'point', nom: 'C', x: 1, y: 1 },
        { type: 'demiDroitePointDirection', p1: 'C', angle: 0 },
        {
          type: 'reporterLongueurCompas',
          p1: 'A',
          p2: 'B',
          p3: 'C',
          angle: 30,
        },
        { type: 'intersection', nom: 'D', etape1: 3, etape2: 4, choix: 1 },
        {
          type: 'reporterLongueurCompas',
          p1: 'A',
          p2: 'B',
          p3: 'D',
          angle: 60,
        },
      ],
      0,
      { rangerInstruments: true },
    )

    const xml = animation.script()
    const rangementsCompas = xml.match(
      /objet="compas" mouvement="rotation_translation" angle="0"[\s\S]*?sens="100000"/g,
    )
    expect(rangementsCompas).toHaveLength(1)
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

  it('draws immediate ray extensions quickly without instrument resizing', () => {
    const animation = construireAnimation(
      [
        { type: 'point', nom: 'A', x: 0, y: 0 },
        { type: 'demiDroitePointDirection', p1: 'A', angle: 0 },
        { type: 'prolongerObjet', etape: 1, longueur: 20 },
      ],
      3,
      { rangerInstruments: true },
    )

    const xml = animation.script()
    expect(xml).toMatch(/mouvement="tracer" objet="crayon" tempo="0" vitesse="10000"/)
    expect(xml).not.toMatch(/mouvement="modifier_longueur" objet="regle"/)
    expect(xml).not.toMatch(/mouvement="zoom" objet="regle"/)
    expect(xml).not.toMatch(/objet="regle" mouvement="rotation_translation"/)
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

describe('P025 editor identity', () => {
  it('keeps the same editor id when the exercise number changes', () => {
    const htmlContextAvantTest = context.isHtml
    context.isHtml = true
    const exercice = new CreateurAnimationInstruments()

    exercice.numeroExercice = 0
    exercice.nouvelleVersion()
    const premierId = exercice.listeQuestions[0].match(/id="([^"]+)"/)?.[1]

    exercice.numeroExercice = 3
    exercice.nouvelleVersion()
    const secondId = exercice.listeQuestions[0].match(/id="([^"]+)"/)?.[1]

    expect(secondId).toBe(premierId)
    expect(secondId).toMatch(/^editeur-iep-p025-\d+$/)
    context.isHtml = htmlContextAvantTest
  })
})
