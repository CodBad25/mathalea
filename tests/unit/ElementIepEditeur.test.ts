import { describe, expect, it, vi } from 'vitest'
import {
  construireAnimation,
  decrireInstruction,
  ElementIepEditeur,
  type InstructionIep,
} from '../../src/lib/customElements/ElementIepEditeur'
import CreateurAnimationInstruments from '../../src/exercices/profs/P025'
import FormeDansLeCarreATracer from '../../src/exercices/6e/6G2B-1'
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
  it('can set point label size in the animation', () => {
    const animation = construireAnimation(
      [{ type: 'point', nom: 'A', x: 0, y: 0 }],
      0,
      { tailleLabelsPoints: 12 },
    )

    expect(animation.script()).toContain('taille="12"')
  })

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
    expect(xml).toMatch(/debut="0" fin="-90" mouvement="tracer" objet="compas"/)
  })

  const balayageArcTrace = (programme: InstructionIep[]) => {
    const xml = construireAnimation(programme).script()
    const trace = xml.match(
      /debut="(-?[\d.]+)" fin="(-?[\d.]+)" mouvement="tracer" objet="compas"/,
    )
    if (trace === null) return undefined
    return Number(trace[2]) - Number(trace[1])
  }
  const coinDuCarre: InstructionIep[] = [
    { type: 'point', nom: 'G', x: 9, y: 9 },
    { type: 'point', nom: 'H', x: 6, y: 9 },
    { type: 'point', nom: 'F', x: 9, y: 6 },
    { type: 'point', nom: 'I', x: 3, y: 9 },
    { type: 'point', nom: 'J', x: 0, y: 9 },
  ]

  it('draws the minor arc whatever the order of the extremities', () => {
    for (const [p2, p3] of [
      ['H', 'F'],
      ['F', 'H'],
    ]) {
      const balayage = balayageArcTrace([
        ...coinDuCarre,
        { type: 'arcPointPointCentre', p1: 'G', p2, p3 },
      ])
      expect(Math.abs(balayage ?? 0)).toBeCloseTo(90)
    }
  })

  it('draws a half circle counterclockwise from the first extremity', () => {
    // Le repère d'Instrumenpoche a l'axe des ordonnées vers le bas
    const xmlParLeBas = construireAnimation([
      ...coinDuCarre,
      { type: 'arcPointPointCentre', p1: 'I', p2: 'J', p3: 'H' },
    ]).script()
    expect(xmlParLeBas).toMatch(
      /debut="-180" fin="-360" mouvement="tracer" objet="compas"/,
    )
    const xmlParLeHaut = construireAnimation([
      ...coinDuCarre,
      { type: 'arcPointPointCentre', p1: 'I', p2: 'H', p3: 'J' },
    ]).script()
    expect(xmlParLeHaut).toMatch(
      /debut="0" fin="-180" mouvement="tracer" objet="compas"/,
    )
  })

  it('ignores an arc whose extremities are not at the same distance from its center', () => {
    expect(
      balayageArcTrace([
        ...coinDuCarre,
        { type: 'arcPointPointCentre', p1: 'G', p2: 'H', p3: 'I' },
      ]),
    ).toBeUndefined()
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
    expect(xml).toMatch(
      /mouvement="tracer" objet="crayon" tempo="0" vitesse="10000"/,
    )
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

describe('ElementIepEditeur static rendering', () => {
  it('renders Latex points without the TikZ cross out key', () => {
    const htmlContextAvantTest = context.isHtml
    const typstContextAvantTest = context.isTypst
    context.isHtml = false
    context.isTypst = false

    try {
      const rendu = ElementIepEditeur.create({
        programmeInitial: [
          { type: 'point', nom: 'A', x: 0, y: 0 },
          { type: 'point', nom: 'B', x: 4, y: 0 },
          { type: 'point', nom: 'C', x: 4, y: 3 },
          { type: 'segment', p1: 'A', p2: 'B' },
          { type: 'segment', p1: 'B', p2: 'C' },
          { type: 'segmentCodage', p1: 'A', p2: 'B', codage: '//' },
          { type: 'codageAngleDroit', p1: 'A', p2: 'B', p3: 'C' },
        ],
        interactivityOn: false,
      })

      expect(rendu).toContain('\\begin{tikzpicture}')
      expect(rendu).not.toContain('cross out')
      expect(rendu.match(/\\draw/g)).toHaveLength(11)
    } finally {
      context.isHtml = htmlContextAvantTest
      context.isTypst = typstContextAvantTest
    }
  })

  it('renders a Latex arc instead of a full circle', () => {
    const htmlContextAvantTest = context.isHtml
    const typstContextAvantTest = context.isTypst
    context.isHtml = false
    context.isTypst = false

    try {
      const rendu = ElementIepEditeur.create({
        programmeInitial: [
          { type: 'point', nom: 'G', x: 9, y: 9 },
          { type: 'point', nom: 'H', x: 6, y: 9 },
          { type: 'point', nom: 'F', x: 9, y: 6 },
          { type: 'arcPointPointCentre', p1: 'G', p2: 'F', p3: 'H' },
        ],
        interactivityOn: false,
      })

      expect(rendu).not.toContain('circle')
      expect(rendu).toContain(
        '\\draw (9,6) arc[start angle=-90, end angle=-180, radius=3];',
      )
    } finally {
      context.isHtml = htmlContextAvantTest
      context.isTypst = typstContextAvantTest
    }
  })

  it('renders Typst without constructing the custom element directly', () => {
    const htmlContextAvantTest = context.isHtml
    const typstContextAvantTest = context.isTypst
    context.isHtml = false
    context.isTypst = true

    try {
      const rendu = ElementIepEditeur.create({
        programmeInitial: [
          { type: 'point', nom: 'A', x: 0, y: 0 },
          { type: 'point', nom: 'B', x: 4, y: 0 },
          { type: 'segment', p1: 'A', p2: 'B' },
        ],
        interactivityOn: false,
      })

      expect(rendu).toContain('<mathalea-typst>')
      expect(rendu).toContain('#image')
    } finally {
      context.isHtml = htmlContextAvantTest
      context.isTypst = typstContextAvantTest
    }
  })
})

describe('ElementIepEditeur instruction selection', () => {
  it('uses decimal number fields for numeric parameters', () => {
    const editor = document.createElement(
      ElementIepEditeur.elementTag,
    ) as ElementIepEditeur
    editor.setAttribute(
      'instructions-disponibles',
      JSON.stringify(['pointADistance']),
    )
    editor.setAttribute(
      'programme-initial',
      JSON.stringify([
        { type: 'point', nom: 'A', x: 0, y: 0 },
        { type: 'pointADistance', nom: 'B', p1: 'A', distance: 5.5, angle: 0 },
      ]),
    )
    document.body.appendChild(editor)

    try {
      const input = editor.querySelector<HTMLInputElement>(
        '[data-cle="distance"]',
      )
      expect(input?.type).toBe('number')
      expect(input?.inputMode).toBe('decimal')
      expect(input?.step).toBe('0.1')
      expect(input?.lang).toBe('fr-FR')
      expect(input?.value).toBe('5')

      const boutonsModifier = editor.querySelectorAll<HTMLButtonElement>(
        'button[title="Modifier"]',
      )
      boutonsModifier[1]?.click()
      expect(
        editor.querySelector<HTMLInputElement>('[data-cle="distance"]')?.value,
      ).toBe('5.5')
    } finally {
      editor.remove()
    }
  })

  it('hides the category select for small instruction palettes', () => {
    const editor = document.createElement(
      ElementIepEditeur.elementTag,
    ) as ElementIepEditeur
    editor.setAttribute(
      'instructions-disponibles',
      JSON.stringify([
        'reporterLongueurCompas',
        'intersection',
        'segment',
        'point',
        'segmentCodage',
        'codageAngleDroit',
      ]),
    )
    document.body.appendChild(editor)

    try {
      const selects = editor.querySelectorAll('select')
      expect(selects[0].classList.contains('hidden')).toBe(true)
      expect([...selects[1].options].map((option) => option.value)).toEqual([
        'reporterLongueurCompas',
        'intersection',
        'segment',
        'point',
        'segmentCodage',
        'codageAngleDroit',
      ])
    } finally {
      editor.remove()
    }
  })
})

describe('ElementIepEditeur fullscreen view', () => {
  it('moves the player into a modal and restores it on close', () => {
    const showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    const close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    })
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value: showModal },
      close: { configurable: true, value: close },
    })
    const editor = document.createElement(
      ElementIepEditeur.elementTag,
    ) as ElementIepEditeur
    editor.setAttribute('allow-fullscreen', 'true')
    editor.setAttribute(
      'programme-initial',
      JSON.stringify([{ type: 'point', nom: 'A', x: 0, y: 0 }]),
    )
    document.body.appendChild(editor)

    try {
      Object.assign(editor, { animationVisible: true })
      const player = editor.querySelector<HTMLDivElement>('div.basis-full')
      const parentInitial = player?.parentNode
      ;[...editor.querySelectorAll<HTMLButtonElement>('button')]
        .find((bouton) => bouton.innerText === 'Voir en plein écran')
        ?.click()

      const modal = document.body.querySelector<HTMLDialogElement>(
        'dialog[aria-label="Animation Instrumenpoche en plein écran"]',
      )
      expect(modal?.hasAttribute('open')).toBe(true)
      expect(modal?.contains(player ?? null)).toBe(true)

      modal
        ?.querySelector<HTMLButtonElement>(
          'button[aria-label="Fermer la vue plein écran"]',
        )
        ?.click()
      expect(player?.parentNode).toBe(parentInitial)
      expect(modal?.hasAttribute('open')).toBe(false)
    } finally {
      editor.remove()
      delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal
      delete (HTMLDialogElement.prototype as { close?: unknown }).close
    }
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

  it('enables the fullscreen animation view', () => {
    const htmlContextAvantTest = context.isHtml
    context.isHtml = true
    try {
      const exercice = new CreateurAnimationInstruments()
      exercice.nouvelleVersion()

      expect(exercice.listeQuestions[0]).toContain('allow-fullscreen="true"')
    } finally {
      context.isHtml = htmlContextAvantTest
    }
  })
})

describe('ElementIepEditeur step numbering', () => {
  it('numbers initial steps and added steps separately', () => {
    const programme: InstructionIep[] = [
      { type: 'point', nom: 'A', x: 0, y: 0 },
      { type: 'point', nom: 'B', x: 4, y: 0 },
      { type: 'droite', p1: 'A', p2: 'B' },
      { type: 'point', nom: 'C', x: 2, y: 3 },
      { type: 'perpendiculaire', p1: 'A', p2: 'B', p3: 'C' },
      { type: 'intersection', nom: 'H', etape1: 2, etape2: 4, choix: 1 },
    ]
    expect(decrireInstruction(programme[5], programme, 3)).toBe(
      'Placer le point H, intersection de la droite de l’étape initiale 3 et de la perpendiculaire de l’étape 2.',
    )
  })
})

describe('6G2B-1 forme avec des arcs de cercle', () => {
  const renduQuestion = (interactif: boolean) => {
    const htmlContextAvantTest = context.isHtml
    context.isHtml = true
    try {
      const exercice = new FormeDansLeCarreATracer()
      exercice.interactif = interactif
      exercice.nouvelleVersion()
      return exercice
    } finally {
      context.isHtml = htmlContextAvantTest
    }
  }

  it('masque les étapes initiales dans l’éditeur interactif', () => {
    const exercice = renduQuestion(true)
    expect(exercice.listeQuestions[0]).toContain('<alea-iep-editeur')
    expect(exercice.listeQuestions[0]).toContain(
      'masquer-etapes-initiales="true"',
    )
  })

  it('n’affiche pas l’éditeur dans l’énoncé non interactif', () => {
    const exercice = renduQuestion(false)
    expect(exercice.listeQuestions[0]).not.toContain('<alea-iep-editeur')
    expect(exercice.listeQuestions[0]).toContain('<svg')
    expect(exercice.listeCorrections[0]).toContain('<alea-iep-editeur')
  })
})

describe('6G2B-1 version « Reproduire la forme »', () => {
  type ArcProgramme = { p1: string; p2: string; p3: string }

  const creerExercice = () => {
    const htmlContextAvantTest = context.isHtml
    context.isHtml = true
    try {
      const exercice = new FormeDansLeCarreATracer()
      exercice.interactif = true
      exercice.sup = 2
      exercice.nouvelleVersion()
      return exercice
    } finally {
      context.isHtml = htmlContextAvantTest
    }
  }

  const programmeAttendu = (exercice: FormeDansLeCarreATracer) =>
    JSON.parse(
      (
        exercice.listeCorrections[0].match(
          /programme-initial="([^"]*)"/,
        )?.[1] ?? '[]'
      )
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '&'),
    ) as ArcProgramme[]

  const pointsFigure = (exercice: FormeDansLeCarreATracer) => {
    const elements = [...exercice.figuresApiGeom![0].elements.values()]
    return (nom: string) =>
      elements.find(
        (e) => e.type === 'Point' && (e as { label?: string }).label === nom,
      ) as unknown as { x: number; y: number }
  }

  const tracerArcs = (
    exercice: FormeDansLeCarreATracer,
    arcs: ArcProgramme[],
  ) => {
    const point = pointsFigure(exercice)
    for (const { p1, p2, p3 } of arcs) {
      exercice.figuresApiGeom![0].create('ArcByCenterAndTwoPoints', {
        center: point(p1) as never,
        start: point(p2) as never,
        end: point(p3) as never,
      })
    }
  }

  it('remplace l’éditeur de programme par une figure apiGeom', () => {
    const exercice = creerExercice()
    expect(exercice.listeQuestions[0]).not.toContain('<alea-iep-editeur')
    expect(exercice.figuresApiGeom).toHaveLength(1)
  })

  it('valide la forme tracée, quel que soit le sens de tracé des quarts de cercle', () => {
    const exercice = creerExercice()
    const point = pointsFigure(exercice)
    tracerArcs(
      exercice,
      programmeAttendu(exercice).map(({ p1, p2, p3 }) => {
        const [centre, debut, fin] = [point(p1), point(p2), point(p3)]
        const estUnDemiCercle =
          debut.x + fin.x === 2 * centre.x && debut.y + fin.y === 2 * centre.y
        return estUnDemiCercle ? { p1, p2, p3 } : { p1, p2: p3, p3: p2 }
      }),
    )
    expect(exercice.correctionInteractive(0)).toBe('OK')
  })

  it('refuse une forme incomplète ou avec un arc en trop', () => {
    const incomplete = creerExercice()
    tracerArcs(incomplete, programmeAttendu(incomplete).slice(1))
    expect(incomplete.correctionInteractive(0)).toBe('KO')

    const enTrop = creerExercice()
    tracerArcs(enTrop, [
      ...programmeAttendu(enTrop),
      // N n'est jamais une extrémité des arcs de la forme
      { p1: 'M', p2: 'L', p3: 'N' },
    ])
    expect(enTrop.correctionInteractive(0)).toBe('KO')
  })
})
