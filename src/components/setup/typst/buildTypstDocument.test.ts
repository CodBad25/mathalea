import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import {
  buildStandaloneExerciseCode,
  buildTypstDocument,
  defaultTypstDocumentOptions,
  getGeneratedExerciseCode,
  harvestCarryOver,
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

const hasTypstCli = () => {
  const result = spawnSync('typst', ['--version'], { stdio: 'ignore' })
  return result.status === 0
}

const shouldRunTypstCliTests = () =>
  process.env.TYPST_CLI_TESTS === '1' ||
  (process.env.CI == null && hasTypstCli())

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
    expect(code).toContain('#import "@preview/exercise-bank:0.6.0"')
    expect(code).toContain('#let ex1 = exo.with(')
    expect(code).toContain('id: "6e23-1",')
    expect(code).toContain('exercise: [')
    expect(code).toContain('#ex1()')
    // la correction est imprimée directement (exo-solution-box), pas via
    // exo-print-solutions : elle garde ainsi un point d'insertion (palette)
    // juste avant son badge, voir buildVersionContent
    expect(code).toContain('#exo-solution-box(')
    expect(code).toContain('exercise-id: "6e23-1",')
    expect(code).toContain(
      '#import "@preview/taskize:0.2.7": tasks, tasks-setup',
    )
    expect(code).toContain(
      '#tasks-setup(columns: "auto-fit", auto-fit-mode: "uniform", max-columns: 4)',
    )
    expect(code).toContain('#let ex1-colonnes = "auto-fit"')
    expect(code).toContain('#let interligne-questions = 1.2em')
    expect(code).toContain('#let ex1-gutter = interligne-questions')
    // la correction a ses propres réglages, indépendants de l'énoncé
    expect(code).toContain('#let ex1-corr-colonnes = "auto-fit"')
    expect(code).toContain('#let ex1-corr-gutter = interligne-questions')
    expect(code).toContain('#tasks(columns: ex1-corr-colonnes')
    expect(code).toContain('#mathalea-anchor("tasks-corr", 1)')
    expect(code).toContain(
      '#tasks(columns: ex1-colonnes, label: "1.", row-gutter: ex1-gutter, above: 1.2em, below: 0.8em, start: 1)[\n      + $2 + 2$\n      + $3 times 4$\n    ]',
    )
    expect(code).toContain('#if corrige [')
    // les corrections démarrent sur une nouvelle page
    expect(code).toContain('#pagebreak(weak: true)')
    expect(code).toContain('$3 times 4 = 12$')
  })

  it('ne déclare pas de réglages de questions pour un exercice à question unique', () => {
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
      '#tasks(columns: ex1-colonnes, label: "a)", row-gutter: ex1-gutter, above: 1.2em, below: 0.8em, start: 1)[\n      + Question une.\n      + Question deux.\n    ]',
    )
    expect(code).toContain('Voici la figure.')
    expect(code).toContain('#let ex1-colonnes = "auto-fit"')
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
      '#tasks(columns: ex1-colonnes, label: "a)", row-gutter: ex1-gutter, above: 1.2em, below: 0.8em, start: 1)[',
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
      '#tasks(columns: ex1-colonnes, label: none, row-gutter: ex1-gutter, above: 1.2em, below: 0.8em, start: 1)[\n      + a) $1 + 1$\n      + b) $2 + 2$\n    ]',
    )
    expect(code).toContain('#let ex1-colonnes = "auto-fit"')
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
    expect(code).toContain('#let mathalea-fit(body, zoom: 1.0)')
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
    expect(code).toContain('#mathalea-figure-block(1, fig-1-align, fig-1-zoom,')
    expect(code).toContain('mathalea-figure(72.0pt, 36.0pt, fig-1, labels: (')
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
    expect(code).toContain(
      '#import "@preview/taskize:0.2.7": tasks, tasks-setup',
    )
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
    expect(code).toContain(
      '#let colonnes = 2 // nombre de colonnes (1, 2 ou 3)',
    )
  })

  it('règle le format et l’orientation de la page', () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      pageFormat: 'a5',
      orientation: 'landscape',
    })
    expect(code).toContain('#set page(paper: "a5", flipped: true,')
  })

  it('utilise des badges soulignés noirs par défaut', () => {
    const code = buildTypstDocument([
      exercise({ questions: ['$1+1$', '$2+2$'] }),
    ])
    expect(code).toContain('#let couleur = black')
    expect(code).toContain('badge-style: "underline",')
  })

  it('choisit le style de badge et compacte la colonne des styles en marge', () => {
    const borderAccent = buildTypstDocument(
      [exercise({ questions: ['$1+1$'] })],
      { ...defaultTypstDocumentOptions, badgeStyle: 'border-accent' },
    )
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
    expect(cadre).toContain(
      'stroke: (top: 1pt + couleur, bottom: 1pt + couleur)',
    )
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

  it('émet les repères de la palette de mise en page', () => {
    const code = buildTypstDocument([
      exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
      exercise({ questions: ['$3+3$'], ref: '' }),
    ])
    expect(code).toContain('#let mathalea-anchor(kind, num, dx: 0pt)')
    // un repère devant chaque environnement tasks
    expect(code).toContain('#mathalea-anchor("tasks", 1)\n    #tasks(')
    // un repère de gap avant le premier exercice et après chacun, et un
    // repère "exo" (contrôles de l'exercice) devant chaque exercice
    expect(code).toContain(
      '#mathalea-anchor("gap", 0)\n  #mathalea-anchor("exo", 1)\n  #ex1()',
    )
    expect(code).toContain('#ex1()\n  #mathalea-anchor("gap", 1)')
    expect(code).toContain('#ex2()\n  #mathalea-anchor("gap", 2)')
    // le helper est défini avant la banque (exo.with évalue son contenu)
    expect(code.indexOf('#let mathalea-anchor')).toBeLessThan(
      code.indexOf('#let ex1 = exo.with('),
    )
    // titre de section insérable entre les exercices
    expect(code).toContain('#let section(titre)')
    // repère du bloc de titre (édition du titre/en-tête depuis l'aperçu)
    expect(code).toContain('#mathalea-anchor("header", 0)')
  })

  it('émet les repères de gap aussi en mode fusionné', () => {
    const code = buildTypstDocument(
      [exercise({ questions: ['$1+1$', '$2+2$'], numbered: true })],
      { ...defaultTypstDocumentOptions, mergeExercises: true },
    )
    expect(code).toContain('#let mathalea-anchor(kind, num, dx: 0pt)')
    expect(code).toContain('#mathalea-anchor("gap", 1)')
  })

  it('reprend les réglages de la palette (carry-over) à la régénération', () => {
    const code = buildTypstDocument(
      [exercise({ questions: ['$1+1$', '$2+2$'], numbered: true })],
      defaultTypstDocumentOptions,
      {
        tasksLayout: { ex1: { columns: '2', gutter: '1.5em' } },
        insertions: {
          0: ['Consignes générales.'],
          1: ['#section[Monômes]', 'Un texte libre'],
        },
      },
    )
    expect(code).toContain('#let ex1-colonnes = 2')
    expect(code).toContain('#let ex1-gutter = 1.5em')
    expect(code).toContain('  #section[Monômes] // mathalea:insertion')
    expect(code).toContain('  Un texte libre // mathalea:insertion')
    // l'insertion « avant le premier exercice » précède l'exercice 1
    expect(code.indexOf('Consignes générales.')).toBeLessThan(
      code.indexOf('#ex1()'),
    )
    // les insertions suivent le repère de gap de leur exercice
    expect(code.indexOf('#mathalea-anchor("gap", 1)')).toBeLessThan(
      code.indexOf('#section[Monômes]'),
    )
  })

  it('harvestCarryOver relit colonnes, espacement et insertions du code', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['$1+1$', '$2+2$'],
          corrections: ['$2$', '$4$'],
          numbered: true,
        }),
        exercise({ questions: ['$3+3$', '$4+4$'], numbered: true, ref: '' }),
      ],
      defaultTypstDocumentOptions,
      {
        tasksLayout: { ex2: { columns: '3' }, 'ex1-corr': { gutter: '0.5em' } },
        insertions: { 0: ['Consignes générales.'], 1: ['#section[Monômes]'] },
      },
    )
    const harvested = harvestCarryOver(code)
    // les valeurs par défaut (1 colonne, interligne-questions) ne sont pas
    // reprises ; la correction (ex1-corr) est indépendante de l'énoncé
    expect(harvested.tasksLayout).toEqual({
      ex2: { columns: '3' },
      'ex1-corr': { gutter: '0.5em' },
    })
    expect(harvested.insertions).toEqual({
      0: ['Consignes générales.'],
      1: ['#section[Monômes]'],
    })
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

  it('ajoute un QR-code vers chaque exercice quand demandé', () => {
    const url = 'https://coopmaths.fr/alea?uuid=abc&alea=xyz&v=eleve&es=0211'
    const withQr = buildTypstDocument(
      [exercise({ url, questions: ['$1+1$'] })],
      { ...defaultTypstDocumentOptions, showQrCode: true },
    )
    // depuis exercise-bank 0.6.0, le QR-code est un paramètre de exo.with(...)
    // (le paquet le génère et le place lui-même, plus besoin de tiaoma)
    expect(withQr).toContain(`  qr: "${url}",`)
    expect(withQr).toContain(`  qr-size: 1.8cm,`)
    expect(withQr).not.toContain('tiaoma')
    expect(withQr).not.toContain('#place(')

    // absent par défaut
    const withoutQr = buildTypstDocument([
      exercise({ url, questions: ['$1+1$'] }),
    ])
    expect(withoutQr).not.toContain('qr:')
    expect(withoutQr).not.toContain('qr-size')

    // en mode fusionné, il n'y a pas de bloc par exercice : pas de QR-code
    const merged = buildTypstDocument(
      [exercise({ url, questions: ['$1+1$'] })],
      {
        ...defaultTypstDocumentOptions,
        showQrCode: true,
        mergeExercises: true,
      },
    )
    expect(merged).not.toContain('qr:')
  })

  it('active breather (espaces verticaux automatiques) par défaut', () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })])
    expect(code).toContain('#import "@preview/breather:0.1.0": breathe')
    expect(code).toContain('#show: breathe')

    const without = buildTypstDocument([exercise({ questions: ['$1+1$'] })], {
      ...defaultTypstDocumentOptions,
      autoVerticalSpacing: false,
    })
    expect(without).not.toContain('breather')
    expect(without).not.toContain('#show: breathe')
  })

  describe('lignes en pointillés (writingLines, réglage par exercice)', () => {
    it("n'ajoute rien par défaut", () => {
      const code = buildTypstDocument([
        exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
      ])
      expect(code).not.toContain('mathalea-lignes')
    })

    it('ajoute le bloc de lignes après cet exercice (endOfExercise)', () => {
      const code = buildTypstDocument(
        [exercise({ questions: ['$1+1$', '$2+2$'], numbered: true })],
        defaultTypstDocumentOptions,
        {
          writingLines: {
            1: { position: 'endOfExercise', count: 4, spacing: 1.5 },
          },
        },
      )
      expect(code).toContain('#let mathalea-lignes(n, gutter: 2em)')
      expect(code).toContain(
        '#mathalea-lignes(4, gutter: 1.5em) // mathalea:lignes-fin(1)',
      )
      // une seule occurrence : le bloc suit l'environnement tasks, pas chaque question
      expect(code.match(/#mathalea-lignes\(/g)).toHaveLength(1)
    })

    it("émet l'appel sans rendu visuel quand le compteur est à 0 (valeur de départ de la palette)", () => {
      const code = buildTypstDocument(
        [exercise({ questions: ['$1+1$', '$2+2$'], numbered: true })],
        defaultTypstDocumentOptions,
        {
          writingLines: {
            1: { position: 'endOfExercise', count: 0, spacing: 2 },
          },
        },
      )
      // le marqueur est émis (position retenue par la palette au round-trip)
      // mais le helper n'affiche rien tant que n vaut 0
      expect(code).toContain(
        '#mathalea-lignes(0, gutter: 2em) // mathalea:lignes-fin(1)',
      )
      expect(code).toContain('if n > 0 { block(')
      expect(harvestCarryOver(code).writingLines).toEqual({
        1: { position: 'endOfExercise', count: 0, spacing: 2 },
      })
    })

    it('ajoute le bloc de lignes après chaque question (afterEachQuestion), y compris la dernière', () => {
      const code = buildTypstDocument(
        [
          exercise({
            questions: ['$1+1$', '$2+2$', '$3+3$'],
            numbered: true,
          }),
        ],
        defaultTypstDocumentOptions,
        {
          writingLines: {
            1: { position: 'afterEachQuestion', count: 2, spacing: 0.8 },
          },
        },
      )
      // 3 questions -> 3 blocs de lignes, y compris après la 3e
      expect(
        code.match(
          /#mathalea-lignes\(2, gutter: 0\.8em\) \/\/ mathalea:lignes-apres\(1\)/g,
        ),
      ).toHaveLength(3)
      const lastLinesIndex = code.lastIndexOf('#mathalea-lignes(')
      const lastQuestionIndex = code.lastIndexOf('$3 + 3$')
      expect(lastLinesIndex).toBeGreaterThan(lastQuestionIndex)
    })

    it("n'ajoute pas de lignes dans la correction", () => {
      const code = buildTypstDocument(
        [
          exercise({
            questions: ['$1+1$', '$2+2$'],
            corrections: ['$1+1=2$', '$2+2=4$'],
            numbered: true,
          }),
        ],
        defaultTypstDocumentOptions,
        {
          writingLines: {
            1: { position: 'endOfExercise', count: 3, spacing: 1 },
          },
        },
      )
      const correctionSection = code.slice(code.indexOf('solution: ['))
      expect(correctionSection).not.toContain('mathalea-lignes(')
    })

    it("n'ajoute pas de bloc après chaque question pour un exercice à question unique", () => {
      const code = buildTypstDocument(
        [exercise({ questions: ['$1+1$'] })],
        defaultTypstDocumentOptions,
        {
          writingLines: {
            1: { position: 'afterEachQuestion', count: 3, spacing: 1 },
          },
        },
      )
      expect(code).not.toContain('mathalea-lignes')
    })

    it('règle chaque exercice indépendamment', () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
          exercise({ questions: ['$3+3$', '$4+4$'], numbered: true }),
        ],
        defaultTypstDocumentOptions,
        {
          writingLines: {
            2: { position: 'endOfExercise', count: 5, spacing: 2 },
          },
        },
      )
      expect(
        code.match(
          /#mathalea-lignes\(5, gutter: 2em\) \/\/ mathalea:lignes-fin\(2\)/g,
        ),
      ).toHaveLength(1)
      expect(code).not.toContain('mathalea:lignes-fin(1)')
    })

    it('harvestCarryOver relit les réglages par exercice (round-trip)', () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
          exercise({ questions: ['$3+3$', '$4+4$', '$5+5$'], numbered: true }),
        ],
        defaultTypstDocumentOptions,
        {
          writingLines: {
            1: { position: 'endOfExercise', count: 4, spacing: 1.5 },
            2: { position: 'afterEachQuestion', count: 2, spacing: 0.8 },
          },
        },
      )
      const harvested = harvestCarryOver(code)
      expect(harvested.writingLines).toEqual({
        1: { position: 'endOfExercise', count: 4, spacing: 1.5 },
        2: { position: 'afterEachQuestion', count: 2, spacing: 0.8 },
      })
    })
  })

  describe('fusion locale (bouton de la palette)', () => {
    it("fusionne l'exercice 2 avec le précédent : un seul exo.with, numérotation continue", () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
          exercise({
            questions: ['$3+3$', '$4+4$'],
            numbered: true,
            ref: '6e23-2',
          }),
        ],
        defaultTypstDocumentOptions,
        { merges: [2] },
      )
      // un seul #let ex1 = exo.with(...), pas de ex2
      expect(code).toContain('#let ex1 = exo.with(')
      expect(code).not.toContain('#let ex2 = exo.with(')
      expect(code).toContain('#ex1()')
      expect(code).not.toContain('#ex2()')
      // marqueurs de section pour les deux exercices dans le même groupe
      expect(code).toContain('// ----- Exercice 1 -----')
      expect(code).toContain(
        '// ----- Exercice 2 (fusionné avec le précédent) -----',
      )
      // numérotation continue : questions 1-2 puis 3-4
      expect(code).toContain('start: 1)')
      expect(code).toContain('start: 3)')
      // pas de référence affichée pour le groupe fusionné
      expect(code).not.toContain('id: "6e23-2"')
      // repère "exo" du membre fusionné, à l'intérieur du contenu
      expect(code).toContain('#mathalea-anchor("exo", 2)')
      // le repère de gap du groupe reste au niveau du document, après ex1()
      expect(code).toContain('#ex1()\n  #mathalea-anchor("gap", 2)')
    })

    it('numérote deux exercices à question unique une fois fusionnés', () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1+1$'], numbered: true }),
          exercise({ questions: ['$2+2$'], numbered: true }),
        ],
        defaultTypstDocumentOptions,
        { merges: [2] },
      )
      // sans fusion, un exercice à question unique n'est jamais dans un
      // environnement tasks ; fusionné, il doit y participer pour être
      // numéroté à la suite du groupe
      expect(code).toContain('#tasks(')
      expect(code).toContain('start: 1)')
      expect(code).toContain('start: 2)')
    })

    it('ne numérote pas une question unique restée seule dans son exercice', () => {
      const code = buildTypstDocument([
        exercise({ questions: ['$1+1$'], numbered: true }),
        exercise({ questions: ['$2+2$', '$3+3$'], numbered: true }),
      ])
      expect(code).not.toContain('#let ex1-colonnes')
    })

    it("numérote une question unique fusionnée avec l'option globale mergeExercises", () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1+1$'], numbered: true }),
          exercise({ questions: ['$2+2$'], numbered: true }),
        ],
        { ...defaultTypstDocumentOptions, mergeExercises: true },
      )
      expect(code).toContain('start: 1)')
      expect(code).toContain('start: 2)')
    })

    it('reprend la fusion locale au round-trip (harvestCarryOver)', () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
          exercise({ questions: ['$3+3$', '$4+4$'], numbered: true }),
        ],
        defaultTypstDocumentOptions,
        { merges: [2] },
      )
      expect(harvestCarryOver(code).merges).toEqual([2])
    })

    it("l'option globale mergeExercises prime sur la fusion locale", () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
          exercise({ questions: ['$3+3$', '$4+4$'], numbered: true }),
        ],
        { ...defaultTypstDocumentOptions, mergeExercises: true },
        { merges: [2] },
      )
      expect(code).not.toContain('exo.with(')
      expect(code).not.toContain('fusionné avec le précédent')
    })

    it('fusionne trois exercices à la suite (groupe de 3)', () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1$', '$2$'], numbered: true }),
          exercise({ questions: ['$3$', '$4$'], numbered: true }),
          exercise({ questions: ['$5$', '$6$'], numbered: true }),
        ],
        defaultTypstDocumentOptions,
        { merges: [2, 3] },
      )
      expect(code).toContain('#let ex1 = exo.with(')
      expect(code).not.toContain('#let ex2 = exo.with(')
      expect(code).not.toContain('#let ex3 = exo.with(')
      expect(code).toContain('#ex1()')
      // un seul appel au groupe, un seul repère de gap final (num 3)
      expect(code).toContain('#ex1()\n  #mathalea-anchor("gap", 3)')
      expect(code).toContain('start: 1)')
      expect(code).toContain('start: 3)')
      expect(code).toContain('start: 5)')
    })

    it('sans corrections dans le groupe : pas de champ solution', () => {
      const code = buildTypstDocument(
        [
          exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
          exercise({ questions: ['$3+3$'], numbered: true }),
        ],
        defaultTypstDocumentOptions,
        { merges: [2] },
      )
      expect(code).not.toContain('solution: [')
    })

    it.skipIf(!shouldRunTypstCliTests())(
      'compile avec typst : groupe fusionné valide',
      async () => {
        const code = buildTypstDocument(
          [
            exercise({
              questions: ['$1+1$', '$2+2$'],
              corrections: ['$2$', '$4$'],
              numbered: true,
            }),
            exercise({
              questions: ['$3+3$', '$4+4$'],
              corrections: ['$6$', '$8$'],
              numbered: true,
            }),
          ],
          defaultTypstDocumentOptions,
          { merges: [2] },
        )
        const { execFileSync } = await import('node:child_process')
        const { writeFileSync, mkdtempSync } = await import('node:fs')
        const { tmpdir } = await import('node:os')
        const { join } = await import('node:path')
        const dir = mkdtempSync(join(tmpdir(), 'typst-merge-'))
        const file = join(dir, 'doc.typ')
        writeFileSync(file, code, 'utf-8')
        expect(() =>
          execFileSync('typst', ['compile', file, join(dir, 'doc.pdf')], {
            stdio: 'pipe',
          }),
        ).not.toThrow()
      },
    )
  })
})

describe('mode « Course aux nombres » (canMode)', () => {
  const canOptions = { ...defaultTypstDocumentOptions, canMode: true }

  it('rassemble toutes les questions dans un seul tableau', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['$7\\times 5$', '$37+29$'],
          canAnswers: ['', '$\\ldots$ €'],
          corrections: ['$35$', '$66$'],
        }),
        exercise({
          questions: ['Combien de boules ?'],
          canAnswers: ['$\\ldots$ boules'],
          corrections: ['$12$ boules'],
        }),
      ],
      canOptions,
      {},
      [],
      { exportMode: true },
    )
    // l'aide n'est déclarée que si elle sert, comme les autres
    expect(code).toContain('#let can-tableau(')
    expect(code).toContain('#can-tableau(')
    // les questions des deux exercices se suivent dans le même tableau
    expect(code).toContain('[$7 times 5$],')
    expect(code).toContain('[Combien de boules ?],')
    expect(code).toContain('[$...$ boules],')
    // corrections numérotées à la suite, dans l'ordre des lignes, et
    // réparties en colonnes (les réponses tiennent en quelques caractères)
    expect(code).toContain('#if corrige [')
    expect(code).toContain(
      '#tasks(columns: "auto-fit", label: (..n) => strong(numbering("1.", ..n))',
    )
    expect(code).toContain('      + $35$\n      + $66$\n      + $12$ boules')
    // ni banque d'exercices ni badges : il n'y a plus de titre d'exercice
    expect(code).not.toContain('exercise-bank')
    expect(code).not.toContain('#let ex1 = exo.with(')
  })

  it('préfère les énoncés CAN (canQuestions) aux questions ordinaires', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['Calculer $7\\times 5$.'],
          canQuestions: ['$7\\times 5$'],
          canAnswers: [''],
        }),
      ],
      canOptions,
      {},
      [],
      { exportMode: true },
    )
    expect(code).toContain('[$7 times 5$],')
    expect(code).not.toContain('Calculer')
  })

  it('laisse la cellule réponse vide quand il n’y a pas de canAnswers', () => {
    const code = buildTypstDocument(
      [exercise({ questions: ['$1+1$', '$2+2$'] })],
      canOptions,
      {},
      [],
      { exportMode: true },
    )
    expect(code).toContain('#can-tableau(\n    (\n      [$1 + 1$],\n      [$2 + 2$],\n    ),\n    (\n      [],\n      [],\n    ),\n  )')
  })

  it('ne produit pas de section Corrections sans correction', () => {
    const code = buildTypstDocument(
      [exercise({ questions: ['$1+1$'] })],
      canOptions,
    )
    expect(code).not.toContain('Corrections')
  })

  it('garde les repères de la palette qui ont un sens dans un tableau', () => {
    const code = buildTypstDocument(
      [
        exercise({ questions: ['$1+1$', '$2+2$'], corrections: ['$2$', '$4$'] }),
        exercise({ questions: ['$3+3$'], corrections: ['$6$'] }),
      ],
      canOptions,
      { insertions: { 0: ['#section[Calcul mental]'], 1: ['#colbreak()'] } },
    )
    // la liste des corrections est commune à la fiche : ses colonnes se
    // règlent depuis la palette, via un repère et des variables au numéro 0
    expect(code).toContain('#mathalea-anchor("tasks-corr", 0)')
    expect(code).toContain('#tasks(columns: ex0-corr-colonnes')
    expect(code).toContain('#let ex0-corr-colonnes = "auto-fit"')
    expect(code).toContain('#let ex0-corr-gutter = interligne-questions')
    // un repère « exo » par exercice, dans sa première cellule
    expect(code).toContain('[#mathalea-anchor("exo", 1)\n      $1 + 1$],')
    expect(code).toContain('[#mathalea-anchor("exo", 2)\n      $3 + 3$],')
    // seuls les deux gaps qui encadrent le tableau existent
    expect(code).toContain('#mathalea-anchor("gap", 0)')
    expect(code).toContain('#mathalea-anchor("gap", 2)')
    expect(code).not.toContain('#mathalea-anchor("gap", 1)')
    // les insertions des gaps intermédiaires sont réémises après le tableau
    // plutôt que perdues
    expect(code).toContain('#section[Calcul mental] // mathalea:insertion')
    expect(code).toContain('#colbreak() // mathalea:insertion')
  })

  it('n’émet pas de repère hors de la première version', () => {
    const code = buildTypstDocument(
      [exercise({ questions: ['$1+1$'] })],
      { ...canOptions, nbVersions: 2 },
      {},
      [[exercise({ questions: ['$5+5$'] })]],
    )
    expect(code).toContain('Sujet A')
    expect(code).toContain('[$5 + 5$],')
    // le compteur du paquet exercise-bank n'existe pas dans ce mode
    expect(code).not.toContain('#exo-counter.update(0)')
  })

  it.skipIf(!shouldRunTypstCliTests())(
    'compile avec typst : tableau, figure et corrections',
    async () => {
      const code = buildTypstDocument(
        [
          exercise({
            questions: [
              '$7\\times 5$',
              'Combien y a-t-il de boules noires ?<br><svg width="96" height="48"><circle cx="24" cy="24" r="8"/></svg>',
            ],
            canAnswers: ['', '$\\ldots$ boules'],
            corrections: ['$35$', '$12$ boules'],
          }),
        ],
        canOptions,
      )
      const { execFileSync } = await import('node:child_process')
      const { writeFileSync, mkdtempSync } = await import('node:fs')
      const { tmpdir } = await import('node:os')
      const { join } = await import('node:path')
      const dir = mkdtempSync(join(tmpdir(), 'typst-can-'))
      const file = join(dir, 'doc.typ')
      writeFileSync(file, code, 'utf-8')
      expect(() =>
        execFileSync('typst', ['compile', file, join(dir, 'doc.pdf')], {
          stdio: 'pipe',
        }),
      ).not.toThrow()
    },
  )
})

describe('correction minimale (minimalCorrections)', () => {
  const highlight = (contenu: string) =>
    `{\\color{#F15929}\\boldsymbol{${contenu}}}`
  const minimalOptions = {
    ...defaultTypstDocumentOptions,
    minimalCorrections: true,
  }

  it('ne garde que la réponse mise en évidence', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['Calculer $3\\times 5$.'],
          corrections: [`On sait que $3\\times 5 = ${highlight('15')}$.`],
        }),
      ],
      minimalOptions,
    )
    expect(code).toContain('15')
    expect(code).not.toContain('On sait que')
  })

  it('sépare plusieurs réponses d’une même correction', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['PGCD et PPCM de $12$ et $30$ ?'],
          corrections: [
            `Le PGCD est $${highlight('6')}$ et le PPCM est $${highlight('60')}$.`,
          ],
        }),
      ],
      minimalOptions,
    )
    expect(code).not.toContain('Le PGCD est')
    // les deux réponses se suivent, séparées par un cadratin
    expect(code).toContain(
      '$text(fill: #rgb("#F15929"), upright(bold(6)))$\u2003$text(fill: #rgb("#F15929"), upright(bold(60)))$',
    )
  })

  it('laisse intacte une correction sans mise en évidence orange', () => {
    const detaillee = 'On applique la formule, donc $A = 12$.'
    const code = buildTypstDocument(
      [exercise({ questions: ['Calculer $A$.'], corrections: [detaillee] })],
      minimalOptions,
    )
    expect(code).toContain('On applique la formule')
  })

  it('ignore une mise en évidence d’une autre couleur', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['Calculer.'],
          corrections: [
            'Le signe est $ {\\color{#1d4ed8}\\boldsymbol{+}} $ donc $A = 12$.',
          ],
        }),
      ],
      minimalOptions,
    )
    expect(code).toContain('Le signe est')
  })

  it('s’applique aussi au tableau « Course aux nombres »', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['$3\\times 5$'],
          corrections: [`On a $3\\times 5 = ${highlight('15')}$.`],
        }),
      ],
      { ...minimalOptions, canMode: true },
    )
    expect(code).toContain('#can-tableau(')
    expect(code).not.toContain('On a')
  })

  it('garde la réponse d’un texteEnCouleurEtGras (QCM)', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['Coche la bonne réponse.'],
          corrections: [
            'A) six B) sept<br>$68=6\\times 10+8$, donc $68$ c’est ' +
              '<span style="color:#F15929;font-weight: bold;">$6$ fois $10$ et j’ajoute $8$</span>.',
          ],
        }),
      ],
      minimalOptions,
    )
    expect(code).not.toContain('A) six')
    expect(code).not.toContain('donc')
    expect(code).toContain('fois')
  })

  it('ignore les repères de sous-question (numAlpha), orange et gras eux aussi', () => {
    const marker = (letter: string) =>
      `<span style="color:#f15929; font-weight:bold">${letter})&nbsp;</span>`
    const detaillee = `${marker('a')}On développe.<br>${marker('b')}On factorise.`
    const code = buildTypstDocument(
      [exercise({ questions: ['Calculer.'], corrections: [detaillee] })],
      minimalOptions,
    )
    expect(code).toContain('On développe')
    expect(code).toContain('On factorise')
  })

  it('reste sans effet quand le réglage est désactivé', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['Calculer $3\\times 5$.'],
          corrections: [`On sait que $3\\times 5 = ${highlight('15')}$.`],
        }),
      ],
      defaultTypstDocumentOptions,
    )
    expect(code).toContain('On sait que')
  })
})

describe('sourceUrl (URL de régénération en commentaire)', () => {
  it("n'ajoute pas de ligne quand aucune URL n'est fournie", () => {
    const code = buildTypstDocument([exercise({ questions: ['$1+1$'] })])
    expect(code).not.toContain('Ce code est modifiable')
    expect(code).not.toContain('Pour régénérer cette fiche')
  })

  it('inscrit l’URL fournie en commentaire, à la place de la mention modifiable', () => {
    const code = buildTypstDocument(
      [exercise({ questions: ['$1+1$'] })],
      defaultTypstDocumentOptions,
      {},
      [],
      { sourceUrl: 'https://coopmaths.fr/alea/?uuid=abc12&v=typst' },
    )
    expect(code).not.toContain('Ce code est modifiable')
    expect(code).toContain(
      '// Pour régénérer cette fiche : https://coopmaths.fr/alea/?uuid=abc12&v=typst',
    )
  })
})

describe('exportMode (fichier .typ téléchargé, bouton copier)', () => {
  it('inline les colonnes/espacement des tasks, sans variables exN-colonnes/exN-gutter', () => {
    const code = buildTypstDocument(
      [
        exercise({
          questions: ['$1+1$', '$2+2$'],
          corrections: ['$2$', '$4$'],
          numbered: true,
        }),
      ],
      defaultTypstDocumentOptions,
      { tasksLayout: { ex1: { columns: '2', gutter: '0.8em' } } },
      [],
      { exportMode: true },
    )
    expect(code).toContain('#tasks(columns: 2,')
    expect(code).toContain('row-gutter: 0.8em,')
    expect(code).not.toContain('ex1-colonnes')
    expect(code).not.toContain('ex1-gutter')
    expect(code).not.toContain('interligne-questions')
    // la correction (ex1-corr), sans réglage de la palette, reprend les
    // valeurs par défaut en littéral
    expect(code).toContain('#tasks(columns: "auto-fit",')
    expect(code).toContain('row-gutter: 1.2em,')
  })

  it('ne contient ni repère mathalea-anchor ni marqueur interne (insertion/surcharge)', () => {
    const code = buildTypstDocument(
      [
        exercise({ questions: ['$1+1$', '$2+2$'], numbered: true }),
        exercise({ questions: ['$3+3$'] }),
      ],
      defaultTypstDocumentOptions,
      {
        insertions: { 0: ['#section[Fractions]'] },
        codeOverrides: { 2: '#text[Contenu personnalisé]' },
      },
      [],
      { exportMode: true },
    )
    expect(code).not.toContain('mathalea-anchor')
    expect(code).not.toContain('mathalea:insertion')
    expect(code).not.toContain('mathalea:override')
    // le contenu inséré/surchargé reste bien présent, sans son marqueur
    expect(code).toContain('#section[Fractions]')
    expect(code).toContain('#text[Contenu personnalisé]')
  })

  it.skipIf(!shouldRunTypstCliTests())(
    'compile avec typst : document export (tasks + figure avec labels + insertion)',
    async () => {
      const code = buildTypstDocument(
        [
          exercise({
            questions: [
              '<div class="svgContainer"><div><svg class="mathalea2d" width="96" height="48"></svg><div class="divLatex" style="top: 10px; left: 20px; transform: rotate(0deg);" data-top=10 data-left=20><span class="katex"><span class="katex-mathml"><math><semantics><annotation encoding="application/x-tex">1</annotation></semantics></math></span></span></div></div></div>',
              '$2+2$',
            ],
            numbered: true,
          }),
        ],
        defaultTypstDocumentOptions,
        { insertions: { 0: ['#section[Fractions]'] } },
        [],
        { exportMode: true },
      )
      const { execFileSync } = await import('node:child_process')
      const { writeFileSync, mkdtempSync } = await import('node:fs')
      const { tmpdir } = await import('node:os')
      const { join } = await import('node:path')
      const dir = mkdtempSync(join(tmpdir(), 'typst-export-'))
      const file = join(dir, 'doc.typ')
      writeFileSync(file, code, 'utf-8')
      expect(() =>
        execFileSync('typst', ['compile', file, join(dir, 'doc.pdf')], {
          stdio: 'pipe',
        }),
      ).not.toThrow()
    },
  )
})

describe('getGeneratedExerciseCode', () => {
  it('utilise des colonnes/espacement littéraux (préremplissage de la modale d’édition)', () => {
    const code = getGeneratedExerciseCode(
      [exercise({ questions: ['$1+1$', '$2+2$'], numbered: true })],
      1,
    )
    expect(code).toContain('#tasks(columns: "auto-fit",')
    expect(code).toContain('row-gutter: 1.2em,')
    expect(code).not.toContain('ex1-colonnes')
    expect(code).not.toContain('mathalea-anchor')
  })
})

describe('buildStandaloneExerciseCode', () => {
  it("n'inclut que les aides utilisées et aucun repère/variable interne", () => {
    const inputs = [exercise({ questions: ['$1+1$', '$2+2$'], numbered: true })]
    const code = buildStandaloneExerciseCode(inputs, 1)
    expect(code).toContain('#import "@preview/taskize:0.2.7"')
    expect(code).toContain('#let couleur =')
    expect(code).not.toContain('mathalea-anchor')
    expect(code).not.toContain('exercise-bank')
    expect(code).not.toContain('ex1-colonnes')
  })

  it.skipIf(!shouldRunTypstCliTests())(
    'compile seul avec typst (exercice avec figure mathalea2d à labels)',
    async () => {
      const inputs = [
        exercise({
          questions: [
            '<div class="svgContainer"><div><svg class="mathalea2d" width="96" height="48"></svg><div class="divLatex" style="top: 10px; left: 20px; transform: rotate(0deg);" data-top=10 data-left=20><span class="katex"><span class="katex-mathml"><math><semantics><annotation encoding="application/x-tex">1</annotation></semantics></math></span></span></div></div></div>',
          ],
        }),
      ]
      const code = buildStandaloneExerciseCode(inputs, 1)
      const { execFileSync } = await import('node:child_process')
      const { writeFileSync, mkdtempSync } = await import('node:fs')
      const { tmpdir } = await import('node:os')
      const { join } = await import('node:path')
      const dir = mkdtempSync(join(tmpdir(), 'typst-standalone-'))
      const file = join(dir, 'doc.typ')
      writeFileSync(file, code, 'utf-8')
      expect(() =>
        execFileSync('typst', ['compile', file, join(dir, 'doc.pdf')], {
          stdio: 'pipe',
        }),
      ).not.toThrow()
    },
  )
})
