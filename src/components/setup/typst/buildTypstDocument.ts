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
 * Indente les lignes suivantes d'un contenu pour qu'il reste à l'intérieur
 * d'un élément de liste Typst (`+ ...`).
 */
function indentListItem(content: string): string {
  return content.split('\n').join('\n  ')
}

/** Corps d'un exercice (ou de sa correction) : intro puis questions */
function exerciseBody(
  intro: string,
  questions: string[],
  numbered: boolean,
  figures: string[],
): string {
  const parts: string[] = []
  if (intro.trim().length > 0) {
    parts.push(htmlToTypst(intro, figures))
  }
  const items: string[] = []
  for (const question of questions) {
    const converted = htmlToTypst(question, figures)
    if (converted.length === 0) continue
    if (numbered) {
      // les items d'une même liste `enum` doivent se suivre sans ligne
      // vide, sinon la numérotation repart à 1
      items.push(`+ ${indentListItem(converted)}`)
    } else {
      parts.push(converted)
    }
  }
  if (items.length > 0) parts.push(items.join('\n'))
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
  const usesQcm = allLines.some((line) => line.includes('#tasks('))

  const lines: string[] = []
  lines.push('// Fiche générée par MathALÉA — https://coopmaths.fr/alea')
  lines.push("// Ce code est modifiable : l'aperçu se met à jour tout seul.")
  lines.push('')
  if (usesQcm) {
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
