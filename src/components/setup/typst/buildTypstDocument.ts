import {
  MATHALEA_FIGURE_HELPERS,
  MATHALEA_QCM_HELPERS,
  TASKIZE_IMPORT,
  escapeTypstText,
  htmlToTypst,
} from './latexToTypst'

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
  headerLine: string
}

export const defaultTypstDocumentOptions: TypstDocumentOptions = {
  title: "Fiche d'exercices",
  headerLine:
    'Nom : ______________________ Prénom : ______________________ Classe : ______',
}

/**
 * Repères de sous-questions produits par `numAlpha`/`numAlphaNum`
 * (`<span style="color:...; font-weight:bold">a)&nbsp;</span>`).
 */
const SUB_QUESTION_MARKER =
  /<span style="color:[^"]*;\s*font-weight:\s*bold">\s*([a-z]|\d{1,2})\)(?:&nbsp;|\s)*<\/span>/gi

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

/** Corps d'un exercice (ou de sa correction) : intro puis questions */
function exerciseBody(
  intro: string,
  questions: string[],
  numbered: boolean,
  figures: string[],
  /** Préfixe des variables de mise en page (ex : `ex1`) pour les questions numérotées */
  tasksPrefix?: string,
): string {
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
    parts.push(
      `#tasks(columns: ${tasksPrefix}-colonnes, label: ${label}, row-gutter: ${tasksPrefix}-gutter)[\n${items.join('\n')}\n]`,
    )
  } else {
    parts.push(...converted)
  }
  return parts.join('\n\n')
}

/**
 * Génère le code Typst complet de la fiche.
 * Le préambule expose des variables (`colonnes`, `corrige`...) que
 * l'utilisateur peut modifier directement dans l'éditeur.
 */
export function buildTypstDocument(
  exercises: TypstExerciseInput[],
  options: TypstDocumentOptions = defaultTypstDocumentOptions,
): string {
  // Les corps sont convertis d'abord : les figures SVG rencontrées sont
  // collectées pour être déclarées (`#let fig-N = image(...)`) en tête
  // de document, ce qui garde le corps du code lisible.
  const figures: string[] = []
  const exerciseLines: string[] = []
  for (const [k, exercise] of exercises.entries()) {
    exerciseLines.push(`// ----- Exercice ${k + 1} -----`)
    const ref =
      exercise.ref.trim().length > 0
        ? ` #reference("${exercise.ref.trim().replaceAll('"', '\\"')}")`
        : ''
    exerciseLines.push(`#titre-exercice[Exercice ${k + 1}${ref}]`)
    if (exercise.warning != null) {
      exerciseLines.push(
        `#text(fill: gray)[_${escapeTypstText(exercise.warning)}_]`,
      )
    } else {
      exerciseLines.push(
        exerciseBody(
          exercise.intro,
          exercise.questions,
          exercise.numbered,
          figures,
          `ex${k + 1}`,
        ),
      )
    }
    exerciseLines.push('')
  }

  const correctionLines: string[] = []
  const corrected = exercises
    .map((exercise, k) => ({ exercise, k }))
    .filter(({ exercise }) => exercise.corrections.length > 0)
  if (corrected.length > 0) {
    correctionLines.push('// ----- Corrections -----')
    correctionLines.push('#if corrige [')
    correctionLines.push(
      '  // saut de page (ou de colonne si le document est en colonnes)',
    )
    correctionLines.push(
      '  #if colonnes > 1 { colbreak(weak: true) } else { pagebreak(weak: true) }',
    )
    correctionLines.push(
      '  #align(center, text(size: 1.3em, weight: "bold", fill: couleur)[Corrections])',
    )
    for (const { exercise, k } of corrected) {
      correctionLines.push('')
      correctionLines.push(`  #titre-exercice[Exercice ${k + 1}]`)
      const body = exerciseBody(
        exercise.introCorrection,
        exercise.corrections,
        exercise.numbered,
        figures,
        `ex${k + 1}`,
      )
      correctionLines.push(indentContentBlock(body))
    }
    correctionLines.push(']')
    correctionLines.push('')
  }

  const allLines = [...exerciseLines, ...correctionLines]
  const usesMathaleaFigure = allLines.some((line) =>
    line.includes('#mathalea-figure('),
  )
  const usesTasks = allLines.some((line) => line.includes('#tasks('))
  const usesQcm = allLines.some((line) => line.includes('qcm-'))
  // variables de mise en page des questions référencées par les corps
  const tasksPrefixes = [...new Set(
    allLines
      .flatMap((line) => [...line.matchAll(/#tasks\(columns: (ex\d+)-colonnes/g)])
      .map((m) => m[1]),
  )].sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)))

  const lines: string[] = []
  lines.push('// Fiche générée par MathALÉA — https://coopmaths.fr/alea')
  lines.push("// Ce code est modifiable : l'aperçu se met à jour tout seul.")
  lines.push('')
  if (usesTasks) {
    lines.push('// ----- Paquets -----')
    lines.push(TASKIZE_IMPORT)
    lines.push('')
  }
  if (usesMathaleaFigure) {
    lines.push('// ----- Figures mathalea2d -----')
    lines.push(MATHALEA_FIGURE_HELPERS)
    lines.push('')
  }
  lines.push('// ----- Réglages -----')
  lines.push('#let colonnes = 1 // nombre de colonnes (1, 2 ou 3)')
  lines.push('#let corrige = true // afficher les corrections')
  lines.push('#let couleur = rgb("#f15929") // couleur des titres')
  if (usesQcm) {
    lines.push('#let qcm-colonnes = 2 // colonnes des propositions de QCM')
  }
  if (tasksPrefixes.length > 0) {
    lines.push('// Questions de chaque exercice : nombre de colonnes et')
    lines.push('// espacement vertical entre les questions')
    for (const prefix of tasksPrefixes) {
      lines.push(`#let ${prefix}-colonnes = 1`)
      lines.push(`#let ${prefix}-gutter = 1em`)
    }
  }
  lines.push('')
  lines.push(
    '#set page(paper: "a4", margin: (x: 15mm, y: 15mm), numbering: "1/1")',
  )
  lines.push('#set text(size: 11pt, lang: "fr")')
  lines.push('#set enum(numbering: "1.", spacing: 1.2em)')
  lines.push('')
  lines.push('#let titre-exercice(corps) = block(above: 1.6em, below: 0.9em,')
  lines.push('  text(weight: "bold", fill: couleur, size: 1.1em, corps))')
  lines.push('#let reference(ref) = text(size: 0.75em, fill: gray, ref)')
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
  lines.push('// ----- En-tête -----')
  lines.push(
    `#align(center, text(size: 1.4em, weight: "bold")[${escapeTypstText(options.title)}])`,
  )
  lines.push('#v(0.4em)')
  lines.push(escapeTypstText(options.headerLine))
  lines.push('#line(length: 100%, stroke: 0.5pt + gray)')
  lines.push('')
  lines.push('#show: corps => if colonnes > 1 {')
  lines.push('  columns(colonnes, gutter: 8mm, corps)')
  lines.push('} else { corps }')
  lines.push('')
  lines.push(...exerciseLines, ...correctionLines)

  return lines.join('\n')
}

/** Indente un bloc pour l'inscrire dans le `#if corrige [...]` */
function indentContentBlock(content: string): string {
  return content
    .split('\n')
    .map((line) => (line.length > 0 ? `  ${line}` : line))
    .join('\n')
}
