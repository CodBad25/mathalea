import { describe, expect, it } from 'vitest'
import {
  buildTypstDocument,
  defaultTypstDocumentOptions,
  type TypstExerciseInput,
} from './buildTypstDocument'

const exercise = (
  overrides: Partial<TypstExerciseInput> = {},
): TypstExerciseInput => ({
  ref: '6e23-1',
  intro: '',
  questions: [],
  introCorrection: '',
  corrections: [],
  numbered: false,
  ...overrides,
})

describe('buildTypstDocument', () => {
  it('génère un document avec en-tête, exercice et correction', () => {
    const code = buildTypstDocument(
      [
        exercise({
          intro: 'Calculer.',
          questions: ['$2+2$', '$3\\times 4$'],
          corrections: ['$2+2=4$', '$3\\times 4=12$'],
          numbered: true,
        }),
      ],
      {
        ...defaultTypstDocumentOptions,
        boldQuestionNumbers: false,
        showExerciseRefs: true,
      },
    )
    expect(code).toContain('#set page(paper: "a4"')
    expect(code).toContain("Fiche d'exercices")
    // banque exercise-bank : énoncé et correction regroupés
    expect(code).toContain('#import "@preview/exercise-bank:0.5.2"')
    expect(code).toContain('#let ex1 = exo.with(')
    expect(code).toContain('id: "6e23-1",')
    expect(code).toContain('exercise: [')
    expect(code).toContain('solution: [')
    expect(code).toContain('#ex1()')
    expect(code).toContain('#exo-print-solutions(title: none)')
    expect(code).toContain('#import "@preview/taskize:0.2.5": tasks')
    expect(code).toContain('#let ex1-colonnes = 1')
    expect(code).toContain('#let interligne-questions = 1em')
    expect(code).toContain('#let ex1-gutter = interligne-questions')
    expect(code).toContain(
      '#tasks(columns: ex1-colonnes, label: "1.", row-gutter: ex1-gutter, above: 0.8em, below: 0.8em, start: 1)[\n      + $2 + 2$\n      + $3 times 4$\n    ]',
    )
    expect(code).toContain('#if corrige [')
    // les corrections démarrent sur une nouvelle page
    expect(code).toContain('#pagebreak(weak: true)')
    expect(code).toContain('$3 times 4 = 12$')
  })

  it("ne déclare pas de réglages de questions pour un exercice à question unique", () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })])
    expect(code).not.toContain('#tasks(')
    expect(code).not.toContain('ex1-colonnes')
    expect(code).not.toContain('taskize')
  })

  it('découpe une question unique à repères numAlpha en liste de sous-questions', () => {
    const marker = (letter: string) =>
      `<span style="color:#f15929; font-weight:bold">${letter})&nbsp;</span>`
    const code = buildTypstDocument(
      [
        exercise({
          questions: [
            `Voici la figure.<br>${marker('a')}Question une.<br><br>${marker('b')}Question deux.<br>`,
          ],
          numbered: false,
        }),
      ],
      { ...defaultTypstDocumentOptions, boldQuestionNumbers: false },
    )
    expect(code).toContain(
      '#tasks(columns: ex1-colonnes, label: "a)", row-gutter: ex1-gutter, above: 0.8em, below: 0.8em, start: 1)[\n      + Question une.\n      + Question deux.\n    ]',
    )
    expect(code).toContain('Voici la figure.')
    expect(code).toContain('#let ex1-colonnes = 1')
  })

  it('découpe aussi les repères stylizeItems (multiMathfield) en sous-questions', () => {
    // stylizeItems ajoute des propriétés de style après font-weight:bold
    const marker = (letter: string) =>
      `<span style="color:#216d9a; font-weight:bold; display:inline-block; margin-left:0.75em">${letter})</span>`
    const code = buildTypstDocument(
      [
        exercise({
          questions: [
            `À l'aide du graphique :<br>${marker('a')} Première question ?<br>${marker('b')} Deuxième question ?`,
          ],
          numbered: false,
        }),
      ],
      { ...defaultTypstDocumentOptions, boldQuestionNumbers: false },
    )
    expect(code).toContain(
      '#tasks(columns: ex1-colonnes, label: "a)", row-gutter: ex1-gutter, above: 0.8em, below: 0.8em, start: 1)[',
    )
    expect(code).toContain('+ Première question ?')
    expect(code).toContain('+ Deuxième question ?')
    expect(code).toContain("À l'aide du graphique :")
  })

  it('met les questions non numérotées dans un environnement tasks sans étiquette', () => {
    const code = buildTypstDocument([
      exercise({ questions: ['a) $1+1$', 'b) $2+2$'], numbered: false }),
    ])
    expect(code).toContain(
      '#tasks(columns: ex1-colonnes, label: none, row-gutter: ex1-gutter, above: 0.8em, below: 0.8em, start: 1)[\n      + a) $1 + 1$\n      + b) $2 + 2$\n    ]',
    )
    expect(code).toContain('#let ex1-colonnes = 1')
  })

  it("n'ajoute pas de section corrections quand il n'y en a pas", () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })])
    expect(code).not.toContain('#if corrige [')
  })

  it('numérote les exercices dans leur ordre via la banque', () => {
    const code = buildTypstDocument([
      exercise({ questions: ['a'] }),
      exercise({ questions: ['b'], ref: '' }),
    ])
    expect(code).toContain('#let ex1 = exo.with(')
    expect(code).toContain('#let ex2 = exo.with(')
    expect(code).toContain('#ex1()')
    expect(code).toContain('#ex2()')
  })

  it('déclare les figures SVG en tête et les référence dans le corps', () => {
    const code = buildTypstDocument([
      exercise({
        questions: ['Figure : <svg width="96"><rect/></svg>'],
        corrections: ['Corrigé : <svg><circle/></svg>'],
      }),
    ])
    expect(code).toContain('// ----- Figures (SVG embarqués) -----')
    expect(code).toContain('#let fig-1 = image(bytes(')
    expect(code).toContain('#let fig-2 = image(bytes(')
    expect(code).toContain('Figure : #mathalea-fit(fig-1)')
    expect(code).toContain('Corrigé : #mathalea-fit(fig-2)')
    // le helper mathalea-fit est déclaré dès qu'une figure est présente
    expect(code).toContain('#let mathalea-fit(body)')
    // les définitions doivent précéder les références
    expect(code.indexOf('#let fig-1')).toBeLessThan(
      code.indexOf('Figure : #mathalea-fit(fig-1)'),
    )
  })

  it('ajoute les helpers mathalea2d quand une figure contient des labels Typst', () => {
    const code = buildTypstDocument([
      exercise({
        questions: [
          '<div class="svgContainer"><div><svg class="mathalea2d" width="96" height="48"></svg><div class="divLatex" style="top: 10px; left: 20px; transform: rotate(0deg);" data-top=10 data-left=20><span class="katex"><span class="katex-mathml"><math><semantics><annotation encoding="application/x-tex">1</annotation></semantics></math></span></span></div></div></div>',
        ],
      }),
    ])
    expect(code).toContain('// ----- Figures mathalea2d -----')
    expect(code).toContain('#let mathalea-figure')
    expect(code).toContain('#mathalea-figure(72.0pt, 36.0pt, fig-1, labels: (')
    expect(code).toContain('mathalea-label(15.0pt, 7.5pt, [$1$])')
  })

  it('génère un tableau natif sans dépendance externe', () => {
    const code = buildTypstDocument([
      exercise({
        questions: [
          '$\\def\\arraystretch{1.5}\\begin{array}{|l|c|}\\hline x & 1 \\\\ \\hline\\end{array}$',
        ],
      }),
    ])
    expect(code).not.toContain('@preview/tblr')
    expect(code).toContain('#table(')
  })

  it('importe taskize et règle les colonnes quand un QCM est présent', () => {
    const code = buildTypstDocument([
      exercise({
        questions: [
          '<div class="my-3">' +
            '<div class="ex1 inline-block"><input type="checkbox" disabled><label id="labelEx1Q0R0">$1$</label></div>' +
            '<div class="ex1 inline-block"><input type="checkbox" disabled><label id="labelEx1Q0R1">$2$</label></div>' +
            '</div>',
        ],
      }),
    ])
    expect(code).toContain('#import "@preview/taskize:0.2.5": tasks')
    expect(code).toContain('#let qcm-colonnes = 2')
    expect(code).toContain('#let qcm-bonne(')
    expect(code).toContain('#tasks(columns: qcm-colonnes')
  })

  it("n'ajoute pas de section figures sans figure", () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })])
    expect(code).not.toContain('----- Figures')
    expect(code).not.toContain('mathalea-figure')
  })

  it('affiche un avertissement pour un exercice non exportable', () => {
    const code = buildTypstDocument([
      exercise({ warning: 'Exercice interactif uniquement.' }),
    ])
    expect(code).toContain('Exercice interactif uniquement.')
  })

  it('fusionne les exercices : pas de banque et numérotation continue', () => {
    const code = buildTypstDocument(
      [
        exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
        exercise({ questions: ['$3+3$', '$4+4$'], numbered: true, ref: '' }),
      ],
      { ...defaultTypstDocumentOptions, mergeExercises: true },
    )
    expect(code).not.toContain('exo.with(')
    expect(code).not.toContain('exercise-bank')
    expect(code).toContain('start: 1)')
    expect(code).toContain('start: 3)')
  })

  it('règle le nombre de colonnes du document', () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      columns: 2,
    })
    expect(code).toContain('#let colonnes = 2 // nombre de colonnes (1, 2 ou 3)')
  })

  it('règle le format et l’orientation de la page', () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      pageFormat: 'a5',
      orientation: 'landscape',
    })
    expect(code).toContain('#set page(paper: "a5", flipped: true,')
  })

  it('utilise des badges noirs par défaut', () => {
    const code = buildTypstDocument([
      exercise({ questions: ['$1+1$', '$2+2$'] }),
    ])
    expect(code).toContain('#let couleur = black')
    expect(code).toContain('badge-style: "border-accent",')
  })

  it('choisit le style de badge et compacte la colonne des styles en marge', () => {
    const borderAccent = buildTypstDocument([
      exercise({ questions: ['$1+1$'] }),
    ])
    expect(borderAccent).toContain('badge-style: "border-accent",')
    expect(borderAccent).toContain('margin: (x: 15mm, y: 15mm)')
    // style pleine largeur : pas de réglage de colonne
    expect(borderAccent).not.toContain('margin-position:')

    const box = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      badgeStyle: 'box',
    })
    expect(box).toContain('badge-style: "box",')
    // marge de page inchangée, colonne du badge compacte
    expect(box).toContain('margin: (x: 15mm, y: 15mm)')
    expect(box).toContain('label-extra: 0pt,')
    // énoncés : colonne compacte
    expect(box).toContain('margin-position: 2.2cm,')

    // corrections (plus larges) : colonne élargie avant leur affichage
    const boxWithCorr = buildTypstDocument(
      [exercise({ questions: ['$1+1$'], corrections: ['$2$'] })],
      { ...defaultTypstDocumentOptions, badgeStyle: 'box' },
    )
    expect(boxWithCorr).toContain('#exo-setup(margin-position: 2.9cm)')
  })

  it('génère les trois habillages d’en-tête et le sous-titre', () => {
    const epure = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      subtitle: 'Sixième',
    })
    expect(epure).toContain('#let titre = "Fiche d\'exercices"')
    expect(epure).toContain('#let sous-titre = "Sixième"')
    // épuré : filet sous le titre + pied avec crédit
    expect(epure).toContain('#line(length: 100%, stroke: 1.2pt + couleur)')
    expect(epure).toContain('MathALÉA — coopmaths.fr')

    const cartouche = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      headerStyle: 'cartouche',
    })
    expect(cartouche).toContain('#block(width: 100%, fill: couleur')

    const cadre = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      headerStyle: 'cadre',
    })
    expect(cadre).toContain('stroke: (top: 1pt + couleur, bottom: 1pt + couleur)')
    expect(cadre).toContain('CC BY-SA · MathALÉA')
  })

  it('règle la police, la police des maths et la taille du texte', () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      font: 'Noto Sans',
      mathFont: 'Noto Sans Math',
      fontSize: 12.5,
    })
    expect(code).toContain('#let police-texte = "Noto Sans"')
    expect(code).toContain('#let police-maths = "Noto Sans Math"')
    expect(code).toContain('#let taille-texte = 12.5pt')
    expect(code).toContain('#set text(font: police-texte, size: taille-texte')
    expect(code).toContain('#show math.equation: set text(font: police-maths)')
    expect(code).toContain('#let txt(corps) = text(font: police-texte, corps)')
  })

  it('règle la couleur des badges', () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      badgeColor: 'rgb("#f15929")',
    })
    expect(code).toContain('#let couleur = rgb("#f15929")')
  })

  it('affiche la référence (show-id) des exercices seulement si demandé', () => {
    const withRef = buildTypstDocument(
      [exercise({ ref: '6e23-1', questions: ['$1+1$'] })],
      { ...defaultTypstDocumentOptions, showExerciseRefs: true },
    )
    expect(withRef).toContain('id: "6e23-1",')
    expect(withRef).toContain('show-id: true,')

    // masquée par défaut
    const withoutRef = buildTypstDocument([
      exercise({ ref: '6e23-1', questions: ['$1+1$'] }),
    ])
    expect(withoutRef).toContain('show-id: false,')
  })
})
