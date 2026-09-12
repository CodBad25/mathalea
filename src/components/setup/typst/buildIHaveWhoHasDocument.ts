import {
  MATHALEA_FIGURE_BLOCK_HELPER,
  MATHALEA_FIGURE_HELPERS,
  MATHALEA_FIT_HELPER,
  MATHALEA_QCM_HELPERS,
  MATHALEA_SCHEMA_HELPER,
  MATHALEA_TASKS_HELPER,
  TASKIZE_IMPORT,
  htmlToTypst,
} from './latexToTypst'
import {
  BREATHER_IMPORT,
  MATHALEA_ANCHOR_HELPER,
  MATHALEA_INLINE_FORMULA_RULE,
  type TypstExerciseInput,
} from './buildTypstDocument'
import { minimalCorrection } from './minimalCorrection'

export interface IHaveWhoHasCarryOver {
  cardScales?: Record<number, number>
}

/** Relit les zooms carte par carte dans le code Typst éditable. */
export function harvestIHaveWhoHasCarryOver(
  code: string,
): IHaveWhoHasCarryOver {
  const cardScales: Record<number, number> = {}
  for (const match of code.matchAll(/^#let carte-(\d+)-taille = ([\d.]+)/gm)) {
    const value = Number(match[2])
    if (Number.isFinite(value) && value !== 1) {
      cardScales[Number(match[1])] = value
    }
  }
  return Object.keys(cardScales).length > 0 ? { cardScales } : {}
}

export interface IHaveWhoHasCard {
  answer: string
  question: string
}

/**
 * Retire une lettre majuscule servant uniquement à repérer les questions
 * d'une série (`$A=…$`, `$B = …$` ou `A = $…$`). Ces repères révèlent sinon
 * immédiatement l'ordre de la chaîne aux élèves.
 */
export function removeQuestionIndex(question: string): string {
  return question
    .replace(/^(\s*\$)\s*[A-Z]\s*=\s*/u, '$1')
    .replace(/^(\s*)[A-Z]\s*=\s*/u, '$1')
}

export interface IHaveWhoHasDocumentOptions {
  title: string
  font: string
  mathFont: string
  pageFormat: 'a4' | 'a5'
  orientation: 'portrait' | 'landscape'
  columns: number
  rows: number
  questionFontSize: number
  answerFontSize: number
  lineSpacing: number
  separatorThickness: number
  showNumbers: boolean
}

export const defaultIHaveWhoHasDocumentOptions: IHaveWhoHasDocumentOptions = {
  title: 'J’ai qui a',
  font: 'Libertinus Serif',
  mathFont: 'Libertinus Math',
  pageFormat: 'a4',
  orientation: 'portrait',
  columns: 2,
  rows: 4,
  questionFontSize: 15,
  answerFontSize: 15,
  lineSpacing: 0.7,
  separatorThickness: 0.8,
  showNumbers: false,
}

/**
 * Aplatit les questions de la fiche et ferme la chaîne : la carte i porte la
 * réponse i et l'énoncé i + 1 ; la dernière revient à la première question.
 */
export function buildIHaveWhoHasCards(
  exercises: TypstExerciseInput[],
): IHaveWhoHasCard[] {
  const pairs = exercises.flatMap((exercise) =>
    exercise.questions.flatMap((question, index) => {
      const correction = exercise.corrections[index]
      return question.trim() !== '' && correction?.trim()
        ? [
            {
              question: removeQuestionIndex(question),
              answer: minimalCorrection(correction),
            },
          ]
        : []
    }),
  )
  return pairs.map((pair, index) => ({
    answer: pair.answer,
    question: pairs[(index + 1) % pairs.length]?.question ?? pair.question,
  }))
}

/**
 * Clef de comparaison d'une réponse minimale. Les deux balisages orange
 * reconnus par `minimalCorrection` sont retirés afin que « 19 » soit détecté
 * comme doublon quelle que soit la façon dont l'exercice le met en évidence.
 */
export function minimalAnswerKey(correction: string): string {
  return minimalCorrection(correction)
    .replace(/<[^>]+>/g, '')
    .replace(/\\color\{#[0-9a-f]{6}\}/gi, '')
    .replace(/\\boldsymbol\{([^{}]*)\}/g, '$1')
    .replace(/[{}$]/g, '')
    .replace(/(?:&nbsp;|&emsp;|\s)+/gi, '')
    .trim()
    .toLocaleLowerCase('fr')
}

/** Réponses minimales apparaissant plusieurs fois dans la fiche. */
export function duplicateMinimalAnswers(
  exercises: TypstExerciseInput[],
): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const exercise of exercises) {
    for (const [index, correction] of exercise.corrections.entries()) {
      if (exercise.questions[index]?.trim() === '') continue
      if (correction.trim() === '') continue
      const key = minimalAnswerKey(correction)
      if (seen.has(key)) duplicates.add(key)
      else seen.add(key)
    }
  }
  return [...duplicates]
}

function typstString(text: string): string {
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function indent(content: string): string {
  return content
    .split('\n')
    .map((line) => (line.length > 0 ? `    ${line}` : line))
    .join('\n')
}

/** Génère une planche Typst de cartes « J'ai…, qui a… ? », recto seul. */
export function buildIHaveWhoHasDocument(
  exercises: TypstExerciseInput[],
  options: IHaveWhoHasDocumentOptions = defaultIHaveWhoHasDocumentOptions,
  carryOver: IHaveWhoHasCarryOver = {},
): string {
  const figures: string[] = []
  const cards = buildIHaveWhoHasCards(exercises).map((card) => ({
    answer: htmlToTypst(card.answer, figures),
    question: htmlToTypst(card.question, figures),
  }))
  const bodies = cards
    .flatMap((card) => [card.answer, card.question])
    .join('\n')
  const lines: string[] = [
    '// « J’ai… qui a… ? » généré par MathALÉA — https://coopmaths.fr/alea',
    '// Recto : chaîne question-réponse ; verso : motif uniforme, en miroir.',
    '',
    BREATHER_IMPORT,
    MATHALEA_ANCHOR_HELPER,
  ]
  if (bodies.includes('#tasks('))
    lines.push(TASKIZE_IMPORT, MATHALEA_TASKS_HELPER)
  if (figures.length > 0)
    lines.push(MATHALEA_FIT_HELPER, MATHALEA_FIGURE_BLOCK_HELPER)
  if (bodies.includes('mathalea-figure(')) lines.push(MATHALEA_FIGURE_HELPERS)
  if (bodies.includes('mathalea-schema-span'))
    lines.push(MATHALEA_SCHEMA_HELPER)
  lines.push(
    '',
    `#let cartes-par-ligne = ${Math.max(1, options.columns)}`,
    `#let lignes-par-page = ${Math.max(1, options.rows)}`,
    `#let numeroter = ${options.showNumbers}`,
    `#let police-texte = ${typstString(options.font)}`,
    `#let police-maths = ${typstString(options.mathFont)}`,
    `#let taille-questions = ${options.questionFontSize}pt`,
    `#let taille-reponses = ${options.answerFontSize}pt`,
    `#let epaisseur-traits = ${options.separatorThickness}pt`,
    `#set page(paper: "${options.pageFormat}", flipped: ${options.orientation === 'landscape'}, margin: (x: 10mm, y: 10mm))`,
    '#set text(font: police-texte, lang: "fr")',
    `#set par(leading: ${options.lineSpacing}em)`,
    '#show math.equation: set text(font: police-maths)',
    MATHALEA_INLINE_FORMULA_RULE,
    '#show math.frac: it => math.display(it)',
    '#show: breathe',
  )
  if (bodies.includes('qcm-')) {
    lines.push(
      '#let couleur = black',
      '#let qcm-colonnes = 2',
      MATHALEA_QCM_HELPERS,
    )
  }
  if (figures.length > 0) {
    lines.push('', '// ----- Figures (SVG embarqués) -----')
    figures.forEach((figure, index) => {
      lines.push(`#let fig-${index + 1} = ${figure}`)
      lines.push(`#let fig-${index + 1}-zoom = 1`)
      lines.push(`#let fig-${index + 1}-align = center`)
    })
  }
  lines.push(
    '',
    '#let carte(num, reponse, question, taille: 1) = box(width: 100%, height: 100%, inset: 5mm, clip: true)[',
    '  #place(top + right, mathalea-anchor("carte-recto", num))',
    '  #if numeroter { place(top + left, text(size: 8pt, fill: gray, str(num))) }',
    '  #grid(rows: (1fr, 1fr), gutter: 3mm,',
    '    align(center + horizon, text(size: taille-reponses * taille)[#strong[J’ai] #reponse]),',
    '    align(center + horizon, text(size: taille-questions * taille)[#strong[Qui a] #question]),',
    '  )',
    ']',
    '#let dos-carte = box(width: 100%, height: 100%, inset: 5mm, clip: true)[',
    '  #align(center + horizon, text(size: 18pt, weight: "bold")[',
    '    J’ai ..... \\ Qui a .... ?]',
    '  )',
    ']',
    '#let planche(..cartes) = grid(',
    '  columns: (1fr,) * cartes-par-ligne,',
    '  rows: (1fr,) * lignes-par-page,',
    '  stroke: (thickness: epaisseur-traits, paint: luma(40%), dash: "dashed"),',
    '  ..cartes,',
    ')',
    '',
  )
  cards.forEach((card, index) => {
    lines.push(
      `#let carte-${index + 1}-taille = ${carryOver.cardScales?.[index + 1] ?? 1}`,
    )
    lines.push(`#let carte-${index + 1}-reponse = [`)
    lines.push(indent(card.answer))
    lines.push(']')
    lines.push(`#let carte-${index + 1}-question = [`)
    lines.push(indent(card.question))
    lines.push(']')
  })
  const perPage = Math.max(1, options.columns * options.rows)
  const pages = Math.max(1, Math.ceil(cards.length / perPage))
  for (let page = 0; page < pages; page++) {
    if (page > 0) lines.push('#pagebreak()')
    lines.push(`// ----- Planche ${page + 1} : rectos -----`)
    lines.push('#planche(')
    for (let offset = 0; offset < perPage; offset++) {
      const num = page * perPage + offset + 1
      lines.push(
        num <= cards.length
          ? `  carte(${num}, carte-${num}-reponse, carte-${num}-question, taille: carte-${num}-taille),`
          : '  carte(0, [], []),',
      )
    }
    lines.push(')')
    lines.push('#pagebreak()')
    lines.push(
      `// ----- Planche ${page + 1} : versos (colonnes en miroir) -----`,
    )
    lines.push('#planche(')
    for (let row = 0; row < options.rows; row++) {
      for (let column = options.columns - 1; column >= 0; column--) {
        const num = page * perPage + row * options.columns + column + 1
        lines.push(num <= cards.length ? '  dos-carte,' : '  carte(0, [], []),')
      }
    }
    lines.push(')')
  }
  return lines.join('\n')
}
