import {
  BREATHER_CALL,
  BREATHER_IMPORT,
  MATHALEA_ANCHOR_HELPER,
  MATHALEA_INLINE_FORMULA_RULE,
  type TypstExerciseInput,
} from './buildTypstDocument'
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
import { minimalCorrection } from './minimalCorrection'

/** Chemin du verso dans le fichier `.typ` et dans le système virtuel. */
export const I_HAVE_WHO_HAS_BACK_IMAGE = 'versoGKiA.jpg'
export const I_HAVE_WHO_HAS_BACK_IMAGE_VIRTUAL_PATH = `/${I_HAVE_WHO_HAS_BACK_IMAGE}`

export interface IHaveWhoHasCarryOver {
  cardScales?: Record<number, number>
  cardCodes?: Record<number, string>
}

/** Relit les zooms carte par carte dans le code Typst éditable. */
export function harvestIHaveWhoHasCarryOver(
  code: string,
): IHaveWhoHasCarryOver {
  const cardScales: Record<number, number> = {}
  const cardCodes: Record<number, string> = {}
  for (const match of code.matchAll(/^#let carte-(\d+)-taille = ([\d.]+)/gm)) {
    const value = Number(match[2])
    if (Number.isFinite(value) && value !== 1) {
      cardScales[Number(match[1])] = value
    }
  }
  for (const match of code.matchAll(/^#let code-carte-(\d+) = "([A-Z]\d)"/gm)) {
    cardCodes[Number(match[1])] = match[2]
  }
  const carryOver: IHaveWhoHasCarryOver = {}
  if (Object.keys(cardScales).length > 0) carryOver.cardScales = cardScales
  if (Object.keys(cardCodes).length > 0) carryOver.cardCodes = cardCodes
  return carryOver
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

/**
 * Retire le signe égal final utilisé comme blanc de réponse dans certains
 * calculs (`$20\\times70=$`). Une égalité complète telle que `$x=2$` ne
 * correspond pas au motif et reste intacte.
 */
export function removeTrailingCompletionEquals(question: string): string {
  return question.replace(/=\s*\$(\s*)$/u, '$$$1')
}

/** Ajoute une seule ponctuation finale, après une éventuelle formule. */
function withFinalPunctuation(text: string, punctuation: '.' | '?'): string {
  const withoutTrailingBreaks = text.trim().replace(/(?:<br\s*\/?>\s*)+$/gi, '')
  const escaped = punctuation === '?' ? '\\?' : '\\.'
  const content = withoutTrailingBreaks.replace(
    new RegExp(`(?:&nbsp;|\\s)*${escaped}\\s*$`),
    '',
  )
  return punctuation === '?' ? `${content}&nbsp;?` : `${content}.`
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
  orientation: 'landscape',
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
              question: withFinalPunctuation(
                removeTrailingCompletionEquals(removeQuestionIndex(question)),
                '?',
              ),
              answer: withFinalPunctuation(minimalCorrection(correction), '.'),
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

function makeCardCodes(count: number, preserved: Record<number, string> = {}) {
  const candidates = Array.from({ length: 26 }, (_, letter) =>
    Array.from(
      { length: 10 },
      (_, digit) => `${String.fromCharCode(65 + letter)}${digit}`,
    ),
  ).flat()
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const used = new Set(Object.values(preserved))
  const available = candidates.filter((code) => !used.has(code))
  return Array.from(
    { length: count },
    (_, index) => preserved[index + 1] ?? available.shift() ?? `X${index % 10}`,
  )
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function codeWheelSvg(
  codes: string[],
  title: string,
  mirrored = false,
): string {
  const center = 300
  const radius = 280
  const labelRadius = 220
  const count = Math.max(1, codes.length)
  const parts = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">',
    '<rect width="100%" height="100%" fill="white"/>',
    `<circle cx="300" cy="300" r="${radius}" fill="white" stroke="black" stroke-width="3"/>`,
    '<path d="M 288 23 L 312 23 L 300 2 Z" fill="black"/>',
  ]
  const direction = mirrored ? -1 : 1
  for (let index = 0; index < count; index++) {
    const boundary =
      -Math.PI / 2 + (direction * (index - 0.5) * 2 * Math.PI) / count
    parts.push(
      `<line x1="${center + 170 * Math.cos(boundary)}" y1="${center + 170 * Math.sin(boundary)}" x2="${center + radius * Math.cos(boundary)}" y2="${center + radius * Math.sin(boundary)}" stroke="#777"/>`,
    )
    const angle = -Math.PI / 2 + (direction * index * 2 * Math.PI) / count
    parts.push(
      `<text x="${center + labelRadius * Math.cos(angle)}" y="${center + labelRadius * Math.sin(angle)}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="${count > 40 ? 14 : 20}" font-weight="bold">${escapeXml(codes[index])}</text>`,
    )
  }
  parts.push(
    '<circle cx="300" cy="300" r="9" fill="white" stroke="black" stroke-width="2"/>',
    `<text x="300" y="282" text-anchor="middle" font-family="sans-serif" font-size="25" font-weight="bold">${escapeXml(title)}</text>`,
    '<text x="300" y="322" text-anchor="middle" font-family="sans-serif" font-size="15">Assembler les repères noirs</text>',
    '</svg>',
  )
  return parts.join('')
}

function coverWheelSvg(title: string, codeCount: number): string {
  // À 15 h, les codes voisins se séparent verticalement. La fenêtre reste
  // plus basse que la corde séparant deux positions, même avec une grande
  // série, afin de ne jamais dévoiler deux codes à la fois.
  const verticalGap = 2 * 220 * Math.sin(Math.PI / Math.max(2, codeCount))
  const windowHeight = Math.max(20, Math.min(48, verticalGap * 0.68))
  const windowY = 300 - windowHeight / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="100%" height="100%" fill="white"/><circle cx="300" cy="300" r="280" fill="#f2f2f2" stroke="black" stroke-width="3"/><path d="M 288 23 L 312 23 L 300 2 Z" fill="black"/><rect x="452" y="${windowY}" width="90" height="${windowHeight}" rx="7" fill="white" stroke="black" stroke-width="3" stroke-dasharray="8 5"/><!-- Encoche semi-elliptique pour saisir la roue intérieure --><path d="M 220 580 C 220 510 380 510 380 580 Z" fill="white" stroke="black" stroke-width="3" stroke-dasharray="8 5"/><circle cx="300" cy="300" r="9" fill="white" stroke="black" stroke-width="2"/><text x="300" y="280" text-anchor="middle" font-family="sans-serif" font-size="31" font-weight="bold">${escapeXml(title)}</text><text x="300" y="320" text-anchor="middle" font-family="sans-serif" font-size="16">Découper la fenêtre et l’encoche en pointillés</text></svg>`
}

/** Génère les cartes recto-verso, les roues de décodage et leurs caches. */
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
  const codes = makeCardCodes(cards.length, carryOver.cardCodes)
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
    BREATHER_CALL,
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
    '#let carte(num, code, reponse, question, taille: 1) = box(width: 100%, height: 100%, inset: 5mm, clip: true)[',
    '  #place(bottom + right, mathalea-anchor("carte-recto", num))',
    '  #place(top + right, text(size: 11pt, weight: "bold", code))',
    '  #if numeroter { place(bottom + left, text(size: 8pt, fill: gray, str(num))) }',
    '  #grid(rows: (1fr, 1fr), gutter: 3mm,',
    '    align(left + horizon, text(size: taille-reponses * taille)[#strong[J’ai] #reponse]),',
    '    align(left + horizon, text(size: taille-questions * taille)[#strong[Qui a] #question]),',
    '  )',
    ']',
    `#let dos-carte = box(width: 100%, height: 100%, inset: 3mm, clip: true, image(${typstString(I_HAVE_WHO_HAS_BACK_IMAGE)}, width: 100%, height: 100%, fit: "contain"))`,
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
    lines.push(`#let code-carte-${index + 1} = ${typstString(codes[index])}`)
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
          ? `  carte(${num}, code-carte-${num}, carte-${num}-reponse, carte-${num}-question, taille: carte-${num}-taille),`
          : '  carte(0, "", [], []),',
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
        lines.push(
          num <= cards.length ? '  dos-carte,' : '  carte(0, "", [], []),',
        )
      }
    }
    lines.push(')')
  }
  const whoHasCodes = codes
  const iHaveCodes = codes.map((_, index) => codes[(index + 1) % codes.length])
  lines.push('#pagebreak()')
  lines.push('// ----- Planche d’assemblage des roues et des caches -----')
  lines.push('#set page(paper: "a4", flipped: true, margin: 8mm)')
  lines.push(
    '#grid(columns: (1fr, 1fr), rows: (82mm, 82mm), gutter: 5mm, align: center + horizon,',
  )
  const assemblyPart = (svg: string) =>
    `  image(bytes(${typstString(svg)}), format: "svg", width: 82mm, height: 82mm, fit: "contain"),`
  // Deux roues au-dessus, puis leurs deux caches en dessous.
  lines.push(assemblyPart(codeWheelSvg(iHaveCodes, 'J’ai', true)))
  lines.push(assemblyPart(codeWheelSvg(whoHasCodes, 'Qui a ?')))
  lines.push(assemblyPart(coverWheelSvg('J’ai', iHaveCodes.length)))
  lines.push(assemblyPart(coverWheelSvg('Qui a ?', whoHasCodes.length)))
  lines.push(')')
  return lines.join('\n')
}
