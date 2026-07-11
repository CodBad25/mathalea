import {
  MATHALEA_FIGURE_HELPERS,
  MATHALEA_FIT_HELPER,
  MATHALEA_QCM_HELPERS,
  MATHALEA_SCHEMA_HELPER,
  TASKIZE_IMPORT,
  escapeTypstText,
  htmlToTypst,
} from './latexToTypst'

/** Import du paquet exercise-bank (badges Exercice/Correction, banque) */
export const EXERCISE_BANK_IMPORT =
  '#import "@preview/exercise-bank:0.5.2": exo, exo-setup, exo-print-solutions'

/**
 * Repère invisible pour la palette de mise en page de l'aperçu : publie la
 * position du point d'insertion (page, x et y en pt) dans une métadonnée,
 * interrogée après compilation (`query(<mathalea-anchor>)`) pour placer les
 * contrôles (colonnes/espacement des questions, insertions) sur l'aperçu.
 * Aucun impact sur la mise en page : une métadonnée n'occupe aucune place.
 */
export const MATHALEA_ANCHOR_HELPER = `#let mathalea-anchor(kind, num) = context {
  let position = here().position()
  [#metadata((kind: kind, num: num, page: position.page, x: position.x.pt(), y: position.y.pt())) <mathalea-anchor>]
}`

/** Marqueur de fin de ligne des insertions faites via la palette */
export const INSERTION_TAG = '// mathalea:insertion'

/**
 * Saut de page insérable entre deux exercices : `#pagebreak` est interdit
 * dans un conteneur (`columns`), la ligne ferme donc le bloc `en-colonnes`
 * courant, saute la page au niveau du document, puis rouvre le bloc.
 * Fonctionne aussi en une colonne (`en-colonnes` rend alors son corps tel quel).
 */
export const PAGE_BREAK_SNIPPET = '] #pagebreak(weak: true) #en-colonnes['

/** Saut de colonne insérable entre deux exercices (page suivante en 1 colonne) */
export const COLUMN_BREAK_SNIPPET = '#colbreak(weak: true)'

/**
 * Réglages repris du code courant lors d'une régénération : les ajustements
 * faits via la palette de mise en page (colonnes/espacement des questions par
 * exercice, textes et sections insérés entre les exercices) survivent ainsi
 * aux changements de réglages et aux « Nouvelles données ».
 */
export interface TypstCarryOver {
  /**
   * Valeurs de `#let exN-colonnes`/`#let exN-gutter` divergeant des défauts,
   * par préfixe d'exercice (`ex1`). Expressions Typst brutes.
   */
  tasksLayout?: Record<string, { columns?: string; gutter?: string }>
  /**
   * Lignes de code Typst insérées entre les exercices (sans le marqueur
   * `// mathalea:insertion`), par numéro de l'exercice qui les précède.
   */
  insertions?: Record<number, string[]>
}

/** Extrait du code Typst courant les réglages de la palette à conserver */
export function harvestCarryOver(code: string): TypstCarryOver {
  const tasksLayout: Record<string, { columns?: string; gutter?: string }> = {}
  for (const match of code.matchAll(
    /^#let (ex\d+(?:-corr)?)-colonnes = (.+?)\s*$/gm,
  )) {
    if (match[2] !== '1') {
      tasksLayout[match[1]] = { ...tasksLayout[match[1]], columns: match[2] }
    }
  }
  for (const match of code.matchAll(
    /^#let (ex\d+(?:-corr)?)-gutter = (.+?)\s*$/gm,
  )) {
    if (match[2] !== 'interligne-questions') {
      tasksLayout[match[1]] = { ...tasksLayout[match[1]], gutter: match[2] }
    }
  }
  // une insertion suit le repère de gap de l'exercice qui la précède : on
  // associe chaque ligne marquée au dernier repère rencontré
  const insertions: Record<number, string[]> = {}
  let currentGap: number | null = null
  for (const line of code.split('\n')) {
    const gap = line.match(/#mathalea-anchor\("gap", (\d+)\)/)
    if (gap != null) {
      currentGap = Number(gap[1])
      continue
    }
    const insertion = line.match(/^\s*(.*?)\s*\/\/ mathalea:insertion\s*$/)
    if (insertion != null && currentGap != null && insertion[1].length > 0) {
      ;(insertions[currentGap] ??= []).push(insertion[1])
    }
  }
  return { tasksLayout, insertions }
}

/**
 * Construction du document Typst complet (fiche d'exercices + corrections)
 * à partir du contenu HTML des exercices, pour la vue Typst.
 */

/** Contenu d'un exercice, au format HTML de MathALÉA (formules en `$...$`) */
export interface TypstExerciseInput {
  /** Référence affichée à côté du titre (ex : 6e23-1) */
  ref: string
  /** Consigne et introduction, déjà concaténées */
  intro: string
  questions: string[]
  /** Consigne propre à la correction */
  introCorrection: string
  corrections: string[]
  /** Numéroter les questions (et les corrections) */
  numbered: boolean
  /** Message affiché à la place du contenu (exercice non imprimable) */
  warning?: string
}

export interface TypstDocumentOptions {
  title: string
  /** Sous-titre affiché à côté du titre (niveau, classe…) */
  subtitle: string
  headerLine: string
  /** Style de l'en-tête et du pied de page */
  headerStyle: HeaderStyle
  /** Police du texte (nom d'une police libre embarquée dans le compilateur) */
  font: string
  /** Police des formules mathématiques */
  mathFont: string
  /** Taille du texte en points */
  fontSize: number
  /** Interligne des paragraphes, en em (0.65 = valeur par défaut de Typst) */
  lineSpacing: number
  /** Espacement entre les mots, en % de sa valeur normale (100 = défaut) */
  wordSpacing: number
  /** Espace au-dessus du titre de chaque exercice, en em */
  exerciseSpacing: number
  /** Numéros des questions (et sous-questions) en gras */
  boldQuestionNumbers: boolean
  /** Affiche la référence du référentiel à côté de la numérotation */
  showExerciseRefs: boolean
  /** Nombre de colonnes du document (1, 2 ou 3) */
  columns: number
  /** Format de page */
  pageFormat: 'a4' | 'a5'
  /** Orientation de la page */
  orientation: 'portrait' | 'landscape'
  /**
   * Fusionne tous les exercices en un seul : les questions sont numérotées
   * à la suite (le numéro ne se réinitialise pas à chaque exercice) et les
   * titres « Exercice N » disparaissent.
   */
  mergeExercises: boolean
  /** Style des badges du paquet exercise-bank */
  badgeStyle: BadgeStyle
  /**
   * Couleur des badges d'exercice, de correction et des titres
   * (expression Typst, ex : `black`). La correction suit la même couleur.
   */
  badgeColor: string
}

/** Habillage de l'en-tête et du pied de page */
export const HEADER_STYLES = ['epure', 'cartouche', 'cadre'] as const
export type HeaderStyle = (typeof HEADER_STYLES)[number]

/**
 * Polices de texte libres embarquées dans le compilateur Typst (rendu
 * identique dans l'aperçu du navigateur et dans le PDF exporté).
 */
export const TEXT_FONTS = [
  'Libertinus Serif',
  'New Computer Modern',
  'Noto Serif',
  'Lora',
  'Noto Sans',
  'Source Sans 3',
  'Luciole',
  'Ubuntu',
  'OpenDyslexic',
] as const

/**
 * Polices mathématiques (embarquée + libres servies par MathALÉA).
 * Noto Sans Math n'a pas de lettres latines accentuées dans sa table cmap
 * (é, à, ê… absents) : un caractère accentué isolé en mode maths doit se
 * dessiner en un seul glyphe, et Noto Sans Math le décompose en base + accent
 * (2 glyphes), ce que Typst refuse. `latexToTypst.ts` protège désormais tout
 * mot accentué en mode maths dans une chaîne Typst rendue via `#txt()`
 * (police de texte explicite, jamais celle des maths) — voir le commentaire
 * « Mot comportant une lettre latine accentuée » dans `preprocessTex`.
 */
export const MATH_FONTS = [
  'New Computer Modern Math',
  'Libertinus Math',
  'STIX Two Math',
  'Noto Sans Math',
] as const

/**
 * Styles de badge proposés par le paquet exercise-bank.
 * Le style « margin » du paquet est volontairement absent : il réserve une
 * colonne de titre figée à 3,35 cm (non réglable), ce qui décale trop le
 * contenu ; `border-accent` couvre le besoin d'un titre en marge.
 */
export const BADGE_STYLES = [
  'border-accent',
  'box',
  'rounded-box',
  'header-card',
  'underline',
  'pill',
  'tag',
  'circled',
  'filled-circle',
] as const
export type BadgeStyle = (typeof BADGE_STYLES)[number]

/**
 * Styles où le badge est placé dans une colonne à gauche du contenu.
 * Par défaut le paquet réserve une colonne large (dimensionnée sur
 * « Correction 100 ») et décale le bloc dans la marge de la page, ce qui
 * rend le contenu beaucoup trop étroit. On fixe donc une largeur de
 * colonne compacte par style (`margin-position`) et on annule le décalage
 * (`label-extra: 0pt`). Les autres styles occupent toute la largeur.
 */
/**
 * Largeur de la colonne du badge, par style. Les énoncés (« Exercice N »)
 * demandent moins de place que les corrections (« Correction N ») ; comme
 * ils sont rendus dans des sections séparées, on rétrécit la colonne pour
 * les énoncés et on l'élargit juste avant les corrections.
 */
const MARGIN_BADGE_WIDTH: Partial<
  Record<BadgeStyle, { exo: string; corr: string }>
> = {
  box: { exo: '2.2cm', corr: '2.9cm' },
  pill: { exo: '2.5cm', corr: '3.2cm' },
  tag: { exo: '2.7cm', corr: '3.5cm' },
  circled: { exo: '1.4cm', corr: '1.4cm' },
  'filled-circle': { exo: '1.4cm', corr: '1.4cm' },
}

export const defaultTypstDocumentOptions: TypstDocumentOptions = {
  title: "Fiche d'exercices",
  subtitle: '',
  headerStyle: 'epure',
  font: 'Libertinus Serif',
  mathFont: 'Libertinus Math',
  fontSize: 11,
  headerLine:
    'Nom : ______________________ Prénom : ______________________ Classe : ______',
  lineSpacing: 0.65,
  wordSpacing: 100,
  exerciseSpacing: 1.6,
  boldQuestionNumbers: true,
  showExerciseRefs: false,
  columns: 1,
  pageFormat: 'a4',
  orientation: 'portrait',
  mergeExercises: false,
  badgeStyle: 'underline',
  badgeColor: 'black',
}

/**
 * Étiquette de numérotation d'un environnement `tasks` : un littéral Typst
 * (`"1."`, `"a)"`, `none`). En gras, elle devient une fonction qui délègue
 * le motif à `numbering()` puis met en forme le résultat.
 */
function boldableLabel(pattern: string, bold: boolean): string {
  if (pattern === 'none' || !bold) return pattern
  return `(..n) => strong(numbering(${pattern}, ..n))`
}

/**
 * Repères de sous-questions produits par `numAlpha`/`numAlphaNum`
 * (`<span style="color:...; font-weight:bold">a)&nbsp;</span>`) ou par
 * `stylizeItems` (multiMathfield), qui ajoute d'autres propriétés de style
 * après `font-weight:bold` (`display:inline-block; margin-left:...`). Le
 * style peut donc contenir des propriétés supplémentaires ; on exige
 * seulement `font-weight:bold` et un contenu limité au repère `X)`.
 */
const SUB_QUESTION_MARKER =
  /<span[^>]*\bstyle="[^"]*font-weight:\s*bold[^"]*"[^>]*>\s*([a-z]|\d{1,2})\)(?:&nbsp;|\s)*<\/span>/gi

/**
 * Découpe une question unique contenant ses propres repères (`a)`, `b)`...)
 * en une liste de sous-questions, pour la mettre dans un environnement
 * `tasks`. Renvoie `null` quand la question n'a pas cette structure.
 */
function splitSubQuestions(
  html: string,
): { head: string; items: string[]; label: string } | null {
  const matches = [...html.matchAll(SUB_QUESTION_MARKER)]
  if (matches.length < 2) return null
  const first = matches[0][1].toLowerCase()
  if (first !== 'a' && first !== '1') return null
  const head = html.slice(0, matches[0].index).replace(/(<br\s*\/?>\s*)+$/i, '')
  const items = matches.map((match, i) => {
    const start = match.index! + match[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : html.length
    // les <br> de fin d'item servaient à séparer les sous-questions :
    // l'espacement est maintenant assuré par l'environnement tasks
    return html.slice(start, end).replace(/(<br\s*\/?>\s*)+$/i, '')
  })
  return { head, items, label: first === 'a' ? '"a)"' : '"1)"' }
}

/** Corps d'un exercice (ou de sa correction), et nombre de questions numérotées qu'il contient */
interface ExerciseBodyResult {
  code: string
  /** Nombre de questions affichées dans un environnement `tasks` (0 si aucune) */
  itemCount: number
}

/** Corps d'un exercice (ou de sa correction) : intro puis questions */
function exerciseBody(
  intro: string,
  questions: string[],
  numbered: boolean,
  figures: string[],
  /** Préfixe des variables de mise en page (ex : `ex1`) pour les questions numérotées */
  tasksPrefix?: string,
  boldQuestionNumbers = false,
  /** Numéro de la première question (exercices fusionnés : la numérotation continue) */
  startNumber = 1,
): ExerciseBodyResult {
  const parts: string[] = []
  if (intro.trim().length > 0) {
    parts.push(htmlToTypst(intro, figures))
  }
  let questionList = questions
  let label = numbered ? '"1."' : 'none'
  // une question unique portant ses propres repères (`a)`, `b)`...) est
  // découpée : ses sous-questions deviennent la liste de premier niveau
  if (questions.length === 1) {
    const split = splitSubQuestions(questions[0])
    if (split != null) {
      if (split.head.trim().length > 0) {
        const head = htmlToTypst(split.head, figures)
        if (head.length > 0) parts.push(head)
      }
      questionList = split.items
      label = split.label
    }
  }
  const converted = questionList
    .map((question) => htmlToTypst(question, figures))
    .filter((question) => question.length > 0)
  // une liste d'au moins deux questions est mise dans un environnement
  // `tasks` : le nombre de colonnes et l'espacement sont réglables par
  // exercice (`#let ex1-colonnes = ...` en tête de document) ; les
  // questions non numérotées (l'exercice écrit ses propres repères)
  // gardent l'environnement mais sans étiquette
  if (tasksPrefix != null && converted.length > 1) {
    // les items d'une même liste doivent se suivre sans ligne vide, sinon
    // la numérotation repart à 1 ; les lignes suivantes d'un item restent
    // indentées à l'intérieur de celui-ci
    const items = converted.map(
      (question) => `  + ${question.split('\n').join('\n    ')}`,
    )
    // `above`/`below` : sans eux, la liste colle au texte qui la précède et
    // la suit (les fractions dfrac, plus hautes, rendent ce collage très
    // visible : le dernier item peut chevaucher le paragraphe suivant)
    // Le repère `mathalea-anchor` (invisible) permet à la palette de mise en
    // page de l'aperçu de placer ses contrôles à côté de l'environnement ;
    // les corrections (préfixe `exN-corr`) ont leurs propres réglages
    const anchorKind = tasksPrefix.endsWith('-corr') ? 'tasks-corr' : 'tasks'
    parts.push(
      `#mathalea-anchor("${anchorKind}", ${parseInt(tasksPrefix.slice(2), 10)})\n#tasks(columns: ${tasksPrefix}-colonnes, label: ${boldableLabel(label, boldQuestionNumbers)}, row-gutter: ${tasksPrefix}-gutter, above: 1.2em, below: 0.8em, start: ${startNumber})[\n${items.join('\n')}\n]`,
    )
    return { code: parts.join('\n\n'), itemCount: converted.length }
  }
  parts.push(...converted)
  return { code: parts.join('\n\n'), itemCount: 0 }
}

/**
 * Génère le code Typst complet de la fiche.
 * Le préambule expose des variables (`colonnes`, `corrige`...) que
 * l'utilisateur peut modifier directement dans l'éditeur.
 */
export function buildTypstDocument(
  exercises: TypstExerciseInput[],
  options: TypstDocumentOptions = defaultTypstDocumentOptions,
  carryOver: TypstCarryOver = {},
): string {
  /** Insertions de la palette à réémettre après l'exercice `num` */
  const insertionLines = (num: number, indent: string): string[] =>
    (carryOver.insertions?.[num] ?? []).map(
      (line) => `${indent}${line} ${INSERTION_TAG}`,
    )
  // Les corps sont convertis d'abord : les figures SVG rencontrées sont
  // collectées pour être déclarées (`#let fig-N = image(...)`) en tête
  // de document, ce qui garde le corps du code lisible.
  const figures: string[] = []
  // Banque d'exercices (paquet exercise-bank) : chaque exercice regroupe
  // son énoncé et sa correction dans un `#let exN = exo.with(...)`, puis
  // la section Énoncés appelle `#exN()` — réordonnez-les librement.
  const bankLines: string[] = []
  // en mode fusionné, les questions sont numérotées à la suite d'un
  // exercice à l'autre plutôt que de repartir à 1
  let nextStart = 1
  let nextCorrectionStart = 1
  let hasCorrections = false
  interface BuiltExercise {
    enonce: string
    correction: string | null
  }
  const built: BuiltExercise[] = exercises.map((exercise, k) => {
    if (exercise.warning != null) {
      return {
        enonce: `#text(fill: gray)[_${escapeTypstText(exercise.warning)}_]`,
        correction: null,
      }
    }
    const enonce = exerciseBody(
      exercise.intro,
      exercise.questions,
      exercise.numbered,
      figures,
      `ex${k + 1}`,
      options.boldQuestionNumbers,
      options.mergeExercises ? nextStart : 1,
    )
    if (options.mergeExercises) nextStart += enonce.itemCount
    let correction: string | null = null
    if (exercise.corrections.length > 0) {
      hasCorrections = true
      // préfixe distinct : la mise en page de la correction (colonnes,
      // espacement) se règle indépendamment de celle de l'énoncé
      const body = exerciseBody(
        exercise.introCorrection,
        exercise.corrections,
        exercise.numbered,
        figures,
        `ex${k + 1}-corr`,
        options.boldQuestionNumbers,
        options.mergeExercises ? nextCorrectionStart : 1,
      )
      if (options.mergeExercises) nextCorrectionStart += body.itemCount
      correction = body.code
    }
    return { enonce: enonce.code, correction }
  })

  const renderLines: string[] = []
  if (options.mergeExercises) {
    // pas de banque : les contenus sont fusionnés en un seul exercice
    renderLines.push('// ----- Énoncés -----')
    renderLines.push('#en-colonnes[')
    // le repère 0 permet une insertion avant le premier exercice
    renderLines.push('  #mathalea-anchor("gap", 0)')
    renderLines.push(...insertionLines(0, '  '))
    for (const [k, { enonce }] of built.entries()) {
      renderLines.push(`  #mathalea-anchor("exo", ${k + 1})`)
      renderLines.push(indentContentBlock(enonce))
      renderLines.push(`  #mathalea-anchor("gap", ${k + 1})`)
      renderLines.push(...insertionLines(k + 1, '  '))
      renderLines.push('')
    }
    renderLines.push(']')
    renderLines.push('')
    if (hasCorrections) {
      renderLines.push('// ----- Corrections -----')
      renderLines.push('#if corrige [')
      renderLines.push('  // les corrections commencent sur une nouvelle page')
      renderLines.push('  #pagebreak(weak: true)')
      renderLines.push(
        '  #align(center, text(size: 1.3em, weight: "bold", fill: couleur)[Corrections])',
      )
      renderLines.push('  #en-colonnes[')
      for (const { correction } of built) {
        if (correction == null) continue
        renderLines.push(indentContentBlock(indentContentBlock(correction)))
        renderLines.push('')
      }
      renderLines.push('  ]')
      renderLines.push(']')
      renderLines.push('')
    }
  } else {
    for (const [k, { enonce, correction }] of built.entries()) {
      bankLines.push(`// ----- Exercice ${k + 1} -----`)
      bankLines.push(`#let ex${k + 1} = exo.with(`)
      const ref = exercises[k].ref.trim()
      if (ref.length > 0) {
        bankLines.push(`  id: "${ref.replaceAll('"', '\\"')}",`)
      }
      bankLines.push('  exercise: [')
      bankLines.push(indentContentBlock(indentContentBlock(enonce)))
      bankLines.push('  ],')
      if (correction != null) {
        bankLines.push('  solution: [')
        bankLines.push(indentContentBlock(indentContentBlock(correction)))
        bankLines.push('  ],')
      }
      bankLines.push(')')
    }

    renderLines.push('// ----- Énoncés -----')
    renderLines.push('#en-colonnes[')
    // le repère 0 permet une insertion avant le premier exercice
    renderLines.push('  #mathalea-anchor("gap", 0)')
    renderLines.push(...insertionLines(0, '  '))
    for (const [k] of built.entries()) {
      // repère "exo" : contrôles de l'exercice (nombre de questions,
      // suppression) dans la palette de l'aperçu
      renderLines.push(`  #mathalea-anchor("exo", ${k + 1})`)
      renderLines.push(`  #ex${k + 1}()`)
      renderLines.push(`  #mathalea-anchor("gap", ${k + 1})`)
      renderLines.push(...insertionLines(k + 1, '  '))
    }
    renderLines.push(']')
    renderLines.push('')
    if (hasCorrections) {
      renderLines.push('// ----- Corrections -----')
      renderLines.push('#if corrige [')
      renderLines.push('  // les corrections commencent sur une nouvelle page')
      renderLines.push('  #pagebreak(weak: true)')
      renderLines.push(
        '  #align(center, text(size: 1.3em, weight: "bold", fill: couleur)[Corrections])',
      )
      // les libellés « Correction N » sont plus larges : on élargit la
      // colonne des badges juste pour cette section
      const corrWidth = MARGIN_BADGE_WIDTH[options.badgeStyle]
      if (corrWidth != null && corrWidth.corr !== corrWidth.exo) {
        renderLines.push(`  #exo-setup(margin-position: ${corrWidth.corr})`)
      }
      renderLines.push('  #en-colonnes[')
      renderLines.push('    #exo-print-solutions(title: none)')
      renderLines.push('  ]')
      renderLines.push(']')
      renderLines.push('')
    }
  }

  const allLines = [...bankLines, ...renderLines]
  const usesMathaleaFigure = allLines.some((line) =>
    line.includes('#mathalea-figure('),
  )
  const usesTasks = allLines.some((line) => line.includes('#tasks('))
  const usesQcm = allLines.some((line) => line.includes('qcm-'))
  const usesAnchors = allLines.some((line) =>
    line.includes('#mathalea-anchor('),
  )
  const usesSchema = allLines.some((line) =>
    line.includes('mathalea-schema-span'),
  )
  // variables de mise en page des questions référencées par les corps
  // (`ex1`, et `ex1-corr` pour les corrections, réglables indépendamment)
  const tasksPrefixes = [
    ...new Set(
      allLines
        .flatMap((line) => [
          ...line.matchAll(/#tasks\(columns: (ex\d+(?:-corr)?)-colonnes/g),
        ])
        .map((m) => m[1]),
    ),
  ].sort(
    (a, b) =>
      parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10) ||
      a.length - b.length,
  )

  const lines: string[] = []
  lines.push('// Fiche générée par MathALÉA — https://coopmaths.fr/alea')
  lines.push("// Ce code est modifiable : l'aperçu se met à jour tout seul.")
  lines.push('')
  const usesExerciseBank = !options.mergeExercises
  if (usesTasks || usesExerciseBank) {
    lines.push('// ----- Paquets -----')
    if (usesExerciseBank) lines.push(EXERCISE_BANK_IMPORT)
    if (usesTasks) lines.push(TASKIZE_IMPORT)
    lines.push('')
  }
  if (usesAnchors) {
    lines.push(
      '// ----- Repères invisibles de la palette de mise en page -----',
    )
    lines.push(MATHALEA_ANCHOR_HELPER)
    lines.push('')
  }
  if (usesSchema) {
    lines.push('// ----- Schémas en barres (accolades/flèches étirées) -----')
    lines.push(MATHALEA_SCHEMA_HELPER)
    lines.push('')
  }
  // mathalea-fit (adaptation de la largeur des figures) est requis dès
  // qu'une figure est présente ; mathalea-figure l'utilise pour ses figures
  // à labels, il doit donc être défini avant.
  if (figures.length > 0) {
    lines.push('// ----- Figures : adaptation à la largeur -----')
    lines.push(MATHALEA_FIT_HELPER)
    lines.push('')
  }
  if (usesMathaleaFigure) {
    lines.push('// ----- Figures mathalea2d -----')
    lines.push(MATHALEA_FIGURE_HELPERS)
    lines.push('')
  }
  lines.push('// ----- Réglages -----')
  lines.push(
    `#let colonnes = ${options.columns} // nombre de colonnes (1, 2 ou 3)`,
  )
  lines.push('#let corrige = true // afficher les corrections')
  lines.push(
    `#let couleur = ${options.badgeColor} // couleur des badges d'exercice et des titres`,
  )
  lines.push(`#let titre = ${typstString(options.title)}`)
  lines.push(`#let sous-titre = ${typstString(options.subtitle)}`)
  lines.push(`#let entete = ${typstString(options.headerLine)}`)
  lines.push(`#let police-texte = ${typstString(options.font)}`)
  lines.push(`#let police-maths = ${typstString(options.mathFont)}`)
  lines.push(`#let taille-texte = ${options.fontSize}pt`)
  if (usesQcm) {
    lines.push('#let qcm-colonnes = 2 // colonnes des propositions de QCM')
  }
  if (tasksPrefixes.length > 0) {
    lines.push(
      '// espacement vertical entre les questions (défaut de tous les exercices)',
    )
    lines.push('#let interligne-questions = 1.2em')
    lines.push(
      '// Nombre de colonnes et espacement des questions, par exercice',
    )
    lines.push(
      '// (les corrections, préfixe exN-corr, se règlent indépendamment) :',
    )
    lines.push(
      '// remplacez interligne-questions par une valeur pour en dévier.',
    )
    for (const prefix of tasksPrefixes) {
      const layout = carryOver.tasksLayout?.[prefix]
      lines.push(`#let ${prefix}-colonnes = ${layout?.columns ?? '1'}`)
      lines.push(
        `#let ${prefix}-gutter = ${layout?.gutter ?? 'interligne-questions'}`,
      )
    }
  }
  lines.push('')
  lines.push(
    `#set page(paper: "${options.pageFormat}", flipped: ${options.orientation === 'landscape'}, margin: (x: 15mm, y: 15mm),`,
  )
  lines.push(...pageFooter(options.headerStyle).map((line) => `  ${line}`))
  lines.push(')')
  lines.push(
    `#set text(font: police-texte, size: taille-texte, lang: "fr", spacing: ${options.wordSpacing}%)`,
  )
  lines.push(`#set par(leading: ${options.lineSpacing}em)`)
  lines.push('#set enum(numbering: "1.", spacing: 1.2em)')
  // police des formules ; les nombres et symboles restent en police maths
  lines.push('#show math.equation: set text(font: police-maths)')
  // #txt : texte inséré dans une formule mais rendu avec la police du texte
  // (unités, mots) — le parseur convertit \text{…} en #txt("…")
  lines.push('#let txt(corps) = text(font: police-texte, corps)')
  // \dfrac plutôt que \frac : les fractions gardent leur taille normale
  // (« display ») même au milieu d'une phrase, comme dans la version LaTeX
  lines.push('#show math.frac: it => math.display(it)')
  lines.push('')
  lines.push(
    '// mise en colonnes d’une section (les sauts de page restent possibles',
    '// entre les sections, contrairement à une mise en colonnes globale)',
  )
  lines.push('#let en-colonnes(corps) = if colonnes > 1 {')
  lines.push('  columns(colonnes, gutter: 8mm, corps)')
  lines.push('} else { corps }')
  lines.push(
    '// titre de section, insérable entre les exercices : #section[Fractions]',
  )
  lines.push(
    '#let section(titre) = block(width: 100%, above: 1.2em, below: 0.9em,',
  )
  lines.push(
    '  grid(columns: (1fr, auto, 1fr), align: horizon, column-gutter: 8pt,',
  )
  lines.push('    line(length: 100%, stroke: 0.8pt + couleur),')
  lines.push(
    '    text(weight: "bold", fill: couleur, size: 1.15em, smallcaps(titre)),',
  )
  lines.push('    line(length: 100%, stroke: 0.8pt + couleur),')
  lines.push('  ))')
  if (usesExerciseBank) {
    lines.push(
      '// réglages du paquet exercise-bank (badges Exercice/Correction)',
    )
    lines.push('#exo-setup(')
    lines.push('  exercise-label: "Exercice",')
    lines.push('  solution-label: "Correction",')
    lines.push('  // les corrections sont regroupées en fin de fiche')
    lines.push('  corr-loc: "end-chapter",')
    lines.push('  display: if corrige { "both" } else { "ex" },')
    lines.push(`  badge-style: "${options.badgeStyle}",`)
    lines.push('  badge-color: couleur,')
    // le corrigé est placé dans le champ `solution` (étiquette « Correction ») :
    // sa couleur suit donc `solution-color`, réglée sur la couleur des badges
    lines.push('  solution-color: couleur,')
    lines.push('  correction-color: couleur,')
    lines.push(`  show-id: ${options.showExerciseRefs},`)
    lines.push(`  exercise-above: ${options.exerciseSpacing}em,`)
    // styles « en marge » : colonne compacte pour ne pas étrangler le
    // contenu (le paquet dimensionne sinon la colonne sur « Correction 100 »).
    // On règle ici la largeur des énoncés ; celle des corrections est
    // élargie juste avant leur affichage.
    const marginWidth = MARGIN_BADGE_WIDTH[options.badgeStyle]
    if (marginWidth != null) {
      lines.push('  label-extra: 0pt,')
      lines.push(`  margin-position: ${marginWidth.exo},`)
    }
    lines.push(')')
  }
  if (usesQcm) {
    lines.push('// ----- QCM (case à cocher) -----')
    lines.push(MATHALEA_QCM_HELPERS)
  }
  lines.push('')
  if (figures.length > 0) {
    lines.push('// ----- Figures (SVG embarqués) -----')
    for (const [index, figure] of figures.entries()) {
      lines.push(`#let fig-${index + 1} = ${figure}`)
    }
    lines.push('')
  }
  lines.push(...bankLines)
  lines.push('')
  lines.push('// ----- En-tête -----')
  // repère du bloc de titre : la palette de l'aperçu propose d'y modifier
  // les variables titre, sous-titre et entete
  lines.push('#mathalea-anchor("header", 0)')
  lines.push(...headerBlock(options.headerStyle))
  lines.push('')
  lines.push(...renderLines)

  return lines.join('\n')
}

/** Chaîne littérale Typst (échappe backslash et guillemets) */
function typstString(text: string): string {
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/**
 * Bloc de titre de la fiche (`titre`, `sous-titre`, `entete` déclarés dans
 * les réglages), selon l'habillage choisi.
 */
function headerBlock(style: HeaderStyle): string[] {
  if (style === 'cadre') {
    return [
      '#block(width: 100%, stroke: (top: 1pt + couleur, bottom: 1pt + couleur), inset: (y: 8pt))[',
      '  #set align(center)',
      '  #text(size: 1.4em, weight: "bold", fill: couleur, tracking: 0.5pt)[#smallcaps(titre)]',
      '  #if sous-titre != "" [',
      '    #v(2pt)',
      '    #text(size: 0.85em, fill: gray, style: "italic")[#sous-titre]',
      '  ]',
      ']',
      '#if entete != "" [ #v(3pt) #align(center, text(fill: gray.darken(20%))[#entete]) ]',
      '#v(8pt)',
    ]
  }
  if (style === 'cartouche') {
    // carte à fond très clair (peu d'encre) avec un filet d'accent à gauche
    return [
      '#block(width: 100%, fill: couleur.transparentize(90%), stroke: (left: 3pt + couleur),',
      '  inset: 9pt, radius: (right: 4pt))[',
      '  #text(size: 1.5em, weight: "bold", fill: couleur)[#titre]',
      '  #if sous-titre != "" [',
      '    #h(1fr)',
      '    #box(baseline: 30%, stroke: 0.6pt + couleur, inset: (x: 6pt, y: 2pt), radius: 3pt,',
      '      text(fill: couleur, weight: "bold", size: 0.85em)[#sous-titre])',
      '  ]',
      ']',
      '#if entete != "" [',
      '  #v(4pt)',
      '  #block(width: 100%, stroke: 0.6pt + couleur.lighten(40%), radius: 3pt, inset: 6pt,',
      '    text(fill: gray.darken(20%))[#entete])',
      ']',
      '#v(6pt)',
    ]
  }
  // style « épuré » (défaut)
  return [
    '#block(width: 100%, inset: (y: 4pt))[',
    '  #text(size: 1.5em, weight: "bold", fill: couleur)[#titre]',
    '  #if sous-titre != "" [ #h(1fr) #text(fill: gray)[#sous-titre] ]',
    '  #v(-3pt)',
    '  #line(length: 100%, stroke: 1.2pt + couleur)',
    ']',
    '#if entete != "" [ #v(2pt) #text(fill: gray.darken(20%))[#entete] ]',
    '#v(6pt)',
  ]
}

/**
 * Pied de page (crédit MathALÉA, pagination, titre) selon l'habillage.
 * Renvoie l'argument `footer: ...` du `#set page(...)`.
 */
function pageFooter(style: HeaderStyle): string[] {
  const pagination = '#counter(page).display("1 / 1", both: true)'
  if (style === 'cadre') {
    return [
      'footer: context [',
      '  #set text(size: 8pt, style: "italic")',
      '  #line(length: 100%, stroke: 0.4pt)',
      '  #v(-2pt)',
      '  #grid(columns: (1fr, auto, 1fr),',
      '    align(left)[CC BY-SA · MathALÉA],',
      `    align(center)[${pagination}],`,
      '    align(right)[#if sous-titre != "" { sous-titre } else { titre }],',
      '  )',
      '],',
    ]
  }
  if (style === 'cartouche') {
    return [
      'footer: context [',
      '  #set text(size: 8pt, fill: couleur)',
      '  #line(length: 100%, stroke: 0.6pt + couleur.lighten(30%))',
      '  #v(-2pt)',
      '  #grid(columns: (1fr, auto, 1fr),',
      '    align(left)[MathALÉA · coopmaths.fr],',
      `    align(center)[${pagination}],`,
      '    align(right)[#emph(titre)],',
      '  )',
      '],',
    ]
  }
  return [
    'footer: context [',
    '  #set text(size: 8pt, fill: gray)',
    '  #line(length: 100%, stroke: 0.4pt + gray.lighten(30%))',
    '  #v(-2pt)',
    '  #grid(columns: (1fr, auto, 1fr),',
    '    align(left)[MathALÉA — coopmaths.fr],',
    `    align(center)[${pagination}],`,
    '    align(right)[#emph(titre)],',
    '  )',
    '],',
  ]
}

/** Indente un bloc pour l'inscrire dans le `#if corrige [...]` */
function indentContentBlock(content: string): string {
  return content
    .split('\n')
    .map((line) => (line.length > 0 ? `  ${line}` : line))
    .join('\n')
}
