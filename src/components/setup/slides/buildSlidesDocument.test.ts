import { describe, expect, it } from 'vitest'
import {
  buildSlidesDocument,
  defaultSlidesDocumentOptions,
  harvestSlidesCarryOver,
} from './buildSlidesDocument'

const slides = [
  { question: '$2+2$', correction: '$4$' },
  { question: '$3\\times 4$', correction: '$12$' },
  { question: 'Le double de 8', correction: '16' },
]

describe('buildSlidesDocument', () => {
  it('génère une page 16/9 par question, puis les corrections', () => {
    const code = buildSlidesDocument(slides)
    expect(code).toContain('#set page(paper: "presentation-16-9"')
    expect(code).toContain('#let diapo-1-question = [\n  $2 + 2$\n]')
    expect(code).toContain('#let diapo-1-correction = [\n  $4$\n]')
    expect(code).toContain('#let diapo-3-question = [\n  Le double de 8\n]')
    // toutes les questions dans l'ordre, puis toutes les corrections
    const pages = [...code.matchAll(/^#diapo\((\d+), diapo-\d+-(\w+),/gm)].map(
      (match) => `${match[1]}-${match[2]}`,
    )
    expect(pages).toEqual([
      '1-question',
      '2-question',
      '3-question',
      '1-correction',
      '2-correction',
      '3-correction',
    ])
    // une page par diapositive, précédées de la page de garde
    expect(code.match(/^#pagebreak\(\)$/gm)).toHaveLength(6)
  })

  it('intercale les corrections ou les supprime selon le contenu choisi', () => {
    const readPages = (code: string) =>
      [...code.matchAll(/^#diapo\((\d+), diapo-\d+-(\w+),/gm)].map(
        (match) => `${match[1]}-${match[2]}`,
      )
    expect(
      readPages(
        buildSlidesDocument(slides.slice(0, 2), {
          ...defaultSlidesDocumentOptions,
          content: 'alternees',
        }),
      ),
    ).toEqual(['1-question', '1-correction', '2-question', '2-correction'])
    expect(
      readPages(
        buildSlidesDocument(slides.slice(0, 2), {
          ...defaultSlidesDocumentOptions,
          content: 'questions',
        }),
      ),
    ).toEqual(['1-question', '2-question'])
    expect(
      readPages(
        buildSlidesDocument(slides.slice(0, 2), {
          ...defaultSlidesDocumentOptions,
          content: 'corrections',
        }),
      ),
    ).toEqual(['1-correction', '2-correction'])
  })

  it('émet le paquet breather et le pied de page selon les réglages', () => {
    const code = buildSlidesDocument(slides.slice(0, 1))
    expect(code).toContain('#import "@preview/breather:0.1.0": breathe')
    expect(code).toContain('#show: breathe')
    expect(code).toContain('#let pied-de-page = "MathALÉA - CC BY-SA"')
    const bare = buildSlidesDocument(slides.slice(0, 1), {
      ...defaultSlidesDocumentOptions,
      autoVerticalSpacing: false,
      footer: '',
    })
    expect(bare).not.toContain('breathe')
    expect(bare).toContain('#let pied-de-page = ""')
  })

  it('déplace le numéro quand le titre occupe le coin haut-gauche', () => {
    const code = buildSlidesDocument(slides.slice(0, 1))
    expect(code).toContain(
      '#let numero-en-haut = not (titre-en-haut and titre-position == "top-left")',
    )
    expect(code).toContain('place((if numero-en-haut { top } else { bottom }) + left')
  })

  it('réserve un bandeau pour le numéro et le titre, et ajuste le texte', () => {
    const code = buildSlidesDocument(slides.slice(0, 1))
    expect(code).toContain('#let ajustement-auto = true')
    expect(code).toContain(
      'inset: (top: bandeau(true), bottom: bandeau(false)),',
    )
    expect(code).toContain('align(aligne(alignement), ajuster(corps, taille-texte)))')
    const noFit = buildSlidesDocument(slides.slice(0, 1), {
      ...defaultSlidesDocumentOptions,
      autoFit: false,
    })
    expect(noFit).toContain('#let ajustement-auto = false')
  })

  it('ouvre toujours le diaporama par sa page de garde', () => {
    const code = buildSlidesDocument(slides.slice(0, 1))
    expect(code).toContain('#let garde-titre = "Calcul mental"')
    expect(code).toContain('#let garde-sous-titre = ""')
    // le sous-titre ne s'affiche que s'il est renseigné
    expect(code).toContain('#if garde-sous-titre.trim() != "" {')
    // la garde est bien la première page
    expect(
      code.indexOf('#garde(page-de-garde)') < code.indexOf('#diapo(1,'),
    ).toBe(true)
    expect(code).toContain('#garde(page-de-garde)\n#pagebreak()')

    const withSubtitle = buildSlidesDocument(slides.slice(0, 1), {
      ...defaultSlidesDocumentOptions,
      coverTitle: 'Course aux nombres',
      coverSubtitle: '6e B — vendredi',
    })
    expect(withSubtitle).toContain('#let garde-titre = "Course aux nombres"')
    expect(withSubtitle).toContain('#let garde-sous-titre = "6e B — vendredi"')
  })

  it('aligne le titre du bas et le pied de page sur une même ligne', () => {
    const code = buildSlidesDocument(slides.slice(0, 1), {
      ...defaultSlidesDocumentOptions,
      slideTitle: 'Thème',
      titlePosition: 'bottom-left',
      titleSize: 12,
    })
    // une seule taille pour les deux, et une seule ligne (grille du pied)
    expect(code).toContain('#let titre-taille = 12pt')
    expect(code).toContain('text(size: titre-taille, grid(columns: (1fr, 1fr, 1fr),')
    expect(code).toContain(
      '#let colonne-pied = if titre-en-bas and colonne-titre == 2 { 0 } else { 2 }',
    )
    // le titre ancré en bas n'est plus posé dans la diapositive
    expect(code).toContain('#if titre-en-haut {')
    expect(code).toContain('      top + (if titre-position.ends-with("left") { left }')
  })

  it('sépare la taille du texte des questions et des corrections', () => {
    const code = buildSlidesDocument(slides, {
      ...defaultSlidesDocumentOptions,
      questionFontSize: 44,
      correctionFontSize: 28,
    })
    expect(code).toContain('#let taille-questions = 44pt')
    expect(code).toContain('#let taille-corrections = 28pt')
    expect(code).toContain(
      '#let taille-texte = (if correction { taille-corrections } else { taille-questions }) * taille',
    )
  })

  it('réémet taille, alignement et zoom des figures relus dans le code', () => {
    const first = buildSlidesDocument(slides.slice(0, 2))
    expect(first).toContain('#let diapo-2-correction-taille = 1')
    expect(first).toContain('#let diapo-1-question-align = "center"')
    const edited = first
      .replace(
        '#let diapo-2-correction-taille = 1',
        '#let diapo-2-correction-taille = 0.8',
      )
      .replace(
        '#let diapo-1-question-align = "center"',
        '#let diapo-1-question-align = "top"',
      )
    const carryOver = harvestSlidesCarryOver(edited)
    expect(carryOver.slideScales).toEqual({ '2-correction': 0.8 })
    expect(carryOver.slideAligns).toMatchObject({ '1-question': 'top' })
    const regenerated = buildSlidesDocument(
      slides.slice(0, 2),
      defaultSlidesDocumentOptions,
      carryOver,
    )
    expect(regenerated).toContain('#let diapo-2-correction-taille = 0.8')
    expect(regenerated).toContain('#let diapo-1-question-align = "top"')
    expect(regenerated).toContain('#let diapo-1-question-taille = 1')
  })

  it('respecte l’ordre et les diapositives masquées, et ajoute les nouvelles', () => {
    const code = buildSlidesDocument(slides, defaultSlidesDocumentOptions, {
      order: [3, 1],
      hidden: [2],
    })
    expect(code).toContain('#let diapos-masquees = (2,)')
    const pages = [...code.matchAll(/^#diapo\((\d+), diapo-\d+-question,/gm)]
    expect(pages.map((match) => match[1])).toEqual(['3', '1'])
    // la diapositive masquée reste déclarée : elle peut être réaffichée
    expect(code).toContain('#let diapo-2-question = [')

    // une question apparue depuis (nouvel exercice) est ajoutée à la fin
    const withNewSlide = buildSlidesDocument(
      [...slides, { question: 'Nouvelle', correction: '?' }],
      defaultSlidesDocumentOptions,
      harvestSlidesCarryOver(code),
    )
    const newPages = [
      ...withNewSlide.matchAll(/^#diapo\((\d+), diapo-\d+-question,/gm),
    ]
    expect(newPages.map((match) => match[1])).toEqual(['3', '1', '4'])
  })

  it("n'émet les helpers de figures que lorsqu'une figure est présente", () => {
    const plain = buildSlidesDocument([
      { question: 'Texte', correction: 'Rien' },
    ])
    expect(plain).not.toContain('mathalea-fit')
    expect(plain).not.toContain('#let fig-1')
    // le repère des boutons de l'aperçu est toujours défini
    expect(plain).toContain('#let mathalea-anchor(')
    const withFigure = buildSlidesDocument(
      [
        {
          question:
            '<div class="svgContainer"><svg width="100" height="50"><line x1="0" y1="0" x2="10" y2="10" /></svg></div>',
          correction: 'Rien',
        },
      ],
      { ...defaultSlidesDocumentOptions, figureZoom: 1.5 },
    )
    expect(withFigure).toContain('#let fig-1 = ')
    expect(withFigure).toContain('#let fig-1-zoom = 1.5')
    expect(withFigure).toContain('mathalea-fit')
  })
})
