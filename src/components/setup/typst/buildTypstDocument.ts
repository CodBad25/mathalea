import {
  MATHALEA_FIGURE_BLOCK_HELPER,
  MATHALEA_FIGURE_HELPERS,
  MATHALEA_FIT_HELPER,
  MATHALEA_QCM_HELPERS,
  MATHALEA_SCHEMA_HELPER,
  TASKIZE_IMPORT,
  escapeTypstText,
  htmlToTypst,
} from './latexToTypst'

/**
 * Import du paquet exercise-bank (badges Exercice/Correction, banque).
 * Depuis la 0.6.0, le paquet gère lui-même les QR-codes (via tiaoma en
 * interne) : plus besoin d'importer tiaoma séparément.
 */
export const EXERCISE_BANK_IMPORT =
  '#import "@preview/exercise-bank:0.6.0": exo, exo-setup, exo-print-solutions, exo-counter'

/** Hauteur (et largeur) des QR-codes placés au coin des exercices (`qr-size`) */
const QRCODE_SIZE = '1.8cm'

/**
 * Import du paquet breather (gestion automatique des espaces verticaux) :
 * `#show: breathe` écarte les lignes contenant des maths hautes (fractions
 * « display », matrices…) juste ce qu'il faut, sans toucher aux autres.
 */
export const BREATHER_IMPORT =
  '#import "@preview/breather:0.1.0": breathe'

/**
 * Repère invisible pour la palette de mise en page de l'aperçu : publie la
 * position du point d'insertion (page, x et y en pt) dans une métadonnée,
 * interrogée après compilation (`query(<mathalea-anchor>)`) pour placer les
 * contrôles (colonnes/espacement des questions, insertions) sur l'aperçu.
 * Aucun impact sur la mise en page : une métadonnée n'occupe aucune place.
 */
export const MATHALEA_ANCHOR_HELPER = `#let mathalea-anchor(kind, num, dx: 0pt) = context {
  let position = here().position()
  [#metadata((kind: kind, num: num, page: position.page, x: (position.x + dx).pt(), y: position.y.pt())) <mathalea-anchor>]
}`

/** Marqueur de fin de ligne des insertions faites via la palette */
export const INSERTION_TAG = '// mathalea:insertion'

/**
 * Lignes en pointillés insérables (fin d'exercice ou après chaque question),
 * pour que l'élève y écrive. `n` lignes espacées de `gutter` ; sans effet
 * visuel (ni espace) tant que `n` vaut 0, valeur de départ dans la palette.
 */
export const MATHALEA_WRITING_LINES_HELPER = `#let mathalea-lignes(n, gutter: 2em) = if n > 0 { block(above: 2em, below: 0.8em,
  stack(spacing: gutter, ..range(n).map(i => line(length: 100%, stroke: (paint: luma(120), thickness: 0.6pt, dash: "dotted"))))
) }`

/**
 * Saut de page insérable entre deux exercices : `#pagebreak` est interdit
 * dans un conteneur (`columns`), la ligne ferme donc le bloc `en-colonnes`
 * courant, saute la page au niveau du document, puis rouvre le bloc.
 * Fonctionne aussi en une colonne (`en-colonnes` rend alors son corps tel quel).
 */
export const PAGE_BREAK_SNIPPET = '] #pagebreak(weak: true) #en-colonnes['

/** Saut de colonne insérable entre deux exercices (page suivante en 1 colonne) */
export const COLUMN_BREAK_SNIPPET = '#colbreak(weak: true)'

/** Colonnes par défaut des blocs #tasks : taskize choisit jusqu'à 4 colonnes uniformes. */
const DEFAULT_TASKS_COLUMNS = '"auto-fit"'

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
  /**
   * Numéros (1-based) des exercices fusionnés avec le précédent (bouton de
   * la palette, indépendant de l'option globale `mergeExercises`) : ils
   * rejoignent le groupe `exo.with(...)` de leur prédécesseur (un seul
   * titre pour le groupe) et leurs questions continuent la numérotation.
   */
  merges?: number[]
  /** Zoom de chaque figure (`#let fig-N-zoom = ...`), par numéro de figure */
  figureZoom?: Record<number, number>
  /**
   * Alignement de chaque figure (`#let fig-N-align = ...`), par numéro de
   * figure. Expression Typst brute (`left`, `center` ou `right`).
   */
  figureAlign?: Record<number, string>
  /**
   * Code Typst saisi à la main (modale d'édition de la palette) qui remplace
   * l'énoncé généré d'un exercice, par numéro d'exercice. Désactive le QR-code
   * et le décompte de questions (numérotation continue en cas de fusion) de
   * cet exercice, dont le contenu échappe désormais à la génération.
   */
  codeOverrides?: Record<number, string>
  /**
   * Lignes en pointillés (pour que l'élève y écrive) réglées via la palette,
   * par numéro d'exercice (1-based) : après le corps entier de l'exercice,
   * ou après chaque question (y compris la dernière). Ne s'applique jamais
   * à la correction.
   */
  writingLines?: Record<
    number,
    { position: WritingLinesPosition; count: number; spacing: number }
  >
}

/** Repère de début d'une surcharge de code (voir `codeOverrides`) */
const CODE_OVERRIDE_START = /^([ \t]*)\/\/ mathalea:override\((\d+)\)\s*$/
/** Repère de fin d'une surcharge de code */
const CODE_OVERRIDE_END = /^[ \t]*\/\/ mathalea:override-end\s*$/

/** Enveloppe le code saisi par le professeur entre ses repères, pour l'exercice `num` */
function wrapCodeOverride(num: number, code: string): string {
  return `// mathalea:override(${num})\n${code}\n// mathalea:override-end`
}

/** Extrait du code Typst courant les réglages de la palette à conserver */
export function harvestCarryOver(code: string): TypstCarryOver {
  const tasksLayout: Record<string, { columns?: string; gutter?: string }> = {}
  for (const match of code.matchAll(
    /^#let (ex\d+(?:-corr)?)-colonnes = (.+?)\s*$/gm,
  )) {
    if (match[2] !== DEFAULT_TASKS_COLUMNS) {
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
  const figureZoom: Record<number, number> = {}
  for (const match of code.matchAll(/^#let fig-(\d+)-zoom = ([\d.]+)/gm)) {
    const value = Number(match[2])
    if (value !== 1) figureZoom[Number(match[1])] = value
  }
  const figureAlign: Record<number, string> = {}
  for (const match of code.matchAll(
    /^#let fig-(\d+)-align = (left|center|right)/gm,
  )) {
    if (match[2] !== 'left') figureAlign[Number(match[1])] = match[2]
  }
  // un exercice fusionné avec le précédent porte cette mention dans le
  // commentaire qui précède sa définition (voir buildVersionContent)
  const merges: number[] = []
  for (const match of code.matchAll(
    /^\/\/ ----- Exercice (\d+) \(fusionné avec le précédent\) -----$/gm,
  )) {
    merges.push(Number(match[1]))
  }
  // une surcharge peut s'étendre sur plusieurs lignes : on ne peut pas la
  // lire avec un simple matchAll, il faut avancer ligne à ligne et retirer
  // l'indentation ajoutée par les blocs englobants (mêmes marges pour le
  // repère et son contenu, voir `wrapCodeOverride`)
  const codeOverrides: Record<number, string> = {}
  const codeLines = code.split('\n')
  for (let i = 0; i < codeLines.length; i++) {
    const start = codeLines[i].match(CODE_OVERRIDE_START)
    if (start == null) continue
    const indent = start[1]
    const num = Number(start[2])
    const content: string[] = []
    i++
    while (i < codeLines.length && !CODE_OVERRIDE_END.test(codeLines[i])) {
      const line = codeLines[i]
      content.push(line.startsWith(indent) ? line.slice(indent.length) : line)
      i++
    }
    codeOverrides[num] = content.join('\n')
  }
  // lignes en pointillés (palette, par exercice) : chaque appel émis par
  // `writingLinesCall` porte un marqueur identifiant l'exercice et
  // l'emplacement ; en mode « après chaque question » plusieurs appels
  // portent le même marqueur (un par question), avec les mêmes réglages
  const writingLines: Record<
    number,
    { position: WritingLinesPosition; count: number; spacing: number }
  > = {}
  for (const match of code.matchAll(
    /^\s*#mathalea-lignes\((\d+), gutter: ([\d.]+)em\) \/\/ mathalea:lignes-(fin|apres)\((\d+)\)\s*$/gm,
  )) {
    writingLines[Number(match[4])] = {
      position: match[3] === 'fin' ? 'endOfExercise' : 'afterEachQuestion',
      count: Number(match[1]),
      spacing: Number(match[2]),
    }
  }
  return {
    tasksLayout,
    insertions,
    figureZoom,
    figureAlign,
    merges,
    codeOverrides,
    writingLines,
  }
}

/**
 * Construction du document Typst complet (fiche d'exercices + corrections)
 * à partir du contenu HTML des exercices, pour la vue Typst.
 */

/** Contenu d'un exercice, au format HTML de MathALÉA (formules en `$...$`) */
export interface TypstExerciseInput {
  /** Référence affichée à côté du titre (ex : 6e23-1) */
  ref: string
  /**
   * Lien vers l'exercice seul sur MathALÉA (avec ses réglages et sa graine),
   * encodé dans un QR-code quand `showQrCode` est actif. Absent si l'exercice
   * n'a pas d'URL (exercice non chargé).
   */
  url?: string
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
  /**
   * Gestion automatique des espaces verticaux (paquet breather) : les lignes
   * contenant des maths hautes (fractions « display », matrices, racines
   * imbriquées…) s'écartent juste ce qu'il faut, sans toucher à l'interligne
   * des lignes ordinaires.
   */
  autoVerticalSpacing: boolean
  /** Numéros des questions (et sous-questions) en gras */
  boldQuestionNumbers: boolean
  /** Affiche la référence du référentiel à côté de la numérotation */
  showExerciseRefs: boolean
  /**
   * Ajoute au coin de chaque exercice un QR-code pointant vers l'exercice
   * seul sur MathALÉA (comme la sortie LaTeX). Sans effet en mode fusionné.
   */
  showQrCode: boolean
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
  /** Nombre de versions du sujet (Sujet A, B...) générées à la suite */
  nbVersions: number
}

/**
 * Emplacement des lignes en pointillés (voir `TypstCarryOver.writingLines`) :
 * réglage par exercice (palette de mise en page), pas un réglage global.
 */
export const WRITING_LINES_POSITIONS = [
  'endOfExercise',
  'afterEachQuestion',
] as const
export type WritingLinesPosition = (typeof WRITING_LINES_POSITIONS)[number]

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
  autoVerticalSpacing: true,
  boldQuestionNumbers: true,
  showExerciseRefs: false,
  columns: 1,
  pageFormat: 'a4',
  orientation: 'portrait',
  mergeExercises: false,
  showQrCode: false,
  badgeStyle: 'underline',
  badgeColor: 'black',
  nbVersions: 1,
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
  /** Publie le repère `mathalea-anchor` de la liste `tasks` (palette de l'aperçu) */
  emitAnchor = true,
  /**
   * Exercice fusionné (avec le précédent et/ou le suivant) : une question
   * unique rejoint quand même l'environnement `tasks` pour participer à la
   * numérotation continue du groupe (seule au sein de son propre exercice,
   * elle n'aurait sinon pas de numéro).
   */
  forceList = false,
  /**
   * Lignes en pointillés à insérer après chaque question (à l'intérieur de
   * l'environnement `tasks`, y compris après la dernière) ou après le corps
   * entier de l'exercice. N'est jamais passé pour une correction (voir
   * `computeGeneratedExercises`).
   */
  writingLines?: {
    /** Numéro (1-based) de l'exercice, pour le marqueur relu par `harvestCarryOver` */
    num: number
    position: WritingLinesPosition
    count: number
    spacing: number
  },
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
        if (head.length > 0) {
          parts.push(head)
        }
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
  // gardent l'environnement mais sans étiquette. Une question unique
  // rejoint aussi l'environnement quand l'exercice est fusionné : sinon
  // elle resterait sans numéro alors que la suite du groupe est numérotée.
  if (
    tasksPrefix != null &&
    (converted.length > 1 || (forceList && converted.length === 1))
  ) {
    // les items d'une même liste doivent se suivre sans ligne vide, sinon
    // la numérotation repart à 1 ; les lignes suivantes d'un item restent
    // indentées à l'intérieur de celui-ci ; en mode « après chaque question »,
    // chaque item (y compris le dernier) se termine par le bloc de lignes,
    // qui reste ainsi dans la liste (indenté avec l'item)
    const items = converted.map((question) => {
      const item = `  + ${question.split('\n').join('\n    ')}`
      if (writingLines?.position === 'afterEachQuestion') {
        return `${item}\n\n    ${writingLinesCall(writingLines)}`
      }
      return item
    })
    // `above`/`below` : sans eux, la liste colle au texte qui la précède et
    // la suit (les fractions dfrac, plus hautes, rendent ce collage très
    // visible : le dernier item peut chevaucher le paragraphe suivant)
    // Le repère `mathalea-anchor` (invisible) permet à la palette de mise en
    // page de l'aperçu de placer ses contrôles à côté de l'environnement ;
    // les corrections (préfixe `exN-corr`) ont leurs propres réglages
    const anchorKind = tasksPrefix.endsWith('-corr') ? 'tasks-corr' : 'tasks'
    const anchorLine = emitAnchor
      ? `#mathalea-anchor("${anchorKind}", ${parseInt(tasksPrefix.slice(2), 10)})\n`
      : ''
    parts.push(
      `${anchorLine}#tasks(columns: ${tasksPrefix}-colonnes, label: ${boldableLabel(label, boldQuestionNumbers)}, row-gutter: ${tasksPrefix}-gutter, above: 1.2em, below: 0.8em, start: ${startNumber})[\n${items.join('\n')}\n]`,
    )
    return {
      code: appendEndOfExerciseLines(parts.join('\n\n'), writingLines),
      itemCount: converted.length,
    }
  }
  parts.push(...converted)
  return {
    code: appendEndOfExerciseLines(parts.join('\n\n'), writingLines),
    itemCount: 0,
  }
}

/**
 * Appel Typst du helper de lignes en pointillés (voir
 * `MATHALEA_WRITING_LINES_HELPER`), tagué d'un marqueur identifiant
 * l'exercice et l'emplacement, relu par `harvestCarryOver` à la régénération.
 */
function writingLinesCall(writingLines: {
  num: number
  position: WritingLinesPosition
  count: number
  spacing: number
}): string {
  const tag = writingLines.position === 'endOfExercise' ? 'fin' : 'apres'
  return `#mathalea-lignes(${writingLines.count}, gutter: ${writingLines.spacing}em) // mathalea:lignes-${tag}(${writingLines.num})`
}

/** Ajoute le bloc de lignes en pointillés en fin de corps d'exercice, si demandé */
function appendEndOfExerciseLines(
  code: string,
  writingLines?: {
    num: number
    position: WritingLinesPosition
    count: number
    spacing: number
  },
): string {
  if (writingLines?.position !== 'endOfExercise' || code.trim().length === 0) {
    return code
  }
  return `${code}\n\n${writingLinesCall(writingLines)}`
}

/** Contenu Typst (définitions + rendu) d'une version du sujet */
interface VersionContent {
  bankLines: string[]
  renderLines: string[]
  hasCorrections: boolean
}

/** Lettre affichée pour une version 0-based (0 → A, 1 → B...) */
function versionLetter(version: number): string {
  return String.fromCharCode(65 + version)
}

/** Énoncé et correction générés pour un exercice, avant surcharge éventuelle */
interface GeneratedExercise {
  enonce: string
  correction: string | null
  /**
   * URL de l'exercice seul, à passer en paramètre `qr:` de `exo.with(...)` :
   * le paquet exercise-bank génère et place lui-même le QR-code.
   */
  qrUrl?: string
}

/**
 * Calcule l'énoncé et la correction générés de chaque exercice, sans
 * appliquer les surcharges de code Typst manuelles (`carryOver.codeOverrides`) :
 * partagé par `buildVersionContent` (assemblage du document complet, qui
 * applique les surcharges après coup sur `enonce`) et par
 * `getGeneratedExerciseCode` (préremplissage de la modale d'édition avec le
 * code actuellement généré d'un seul exercice, avant toute surcharge).
 */
function computeGeneratedExercises(
  exercises: TypstExerciseInput[],
  options: TypstDocumentOptions,
  carryOver: TypstCarryOver,
  figures: string[],
  emitAnchors: boolean,
): GeneratedExercise[] {
  // exercice fusionné avec le précédent (bouton de la palette) : rejoint le
  // groupe `exo.with(...)` de son prédécesseur (un seul titre pour le
  // groupe). Sans effet quand tous les exercices sont déjà fusionnés
  // (`options.mergeExercises`, branche sans banque ci-dessous).
  const mergedWithPrevious = exercises.map(
    (_, k) =>
      k > 0 &&
      !options.mergeExercises &&
      (carryOver.merges?.includes(k + 1) ?? false),
  )
  // exercice appartenant à un groupe fusionné (avec le précédent et/ou le
  // suivant), global ou local : une question unique y rejoint quand même
  // l'environnement `tasks` pour être numérotée à la suite des autres (voir
  // `forceList` dans exerciseBody), et son QR-code individuel disparaît.
  const isGrouped = exercises.map(
    (_, k) =>
      options.mergeExercises ||
      mergedWithPrevious[k] ||
      (mergedWithPrevious[k + 1] ?? false),
  )
  // en mode fusionné (global ou local), les questions sont numérotées à la
  // suite d'un exercice à l'autre plutôt que de repartir à 1
  let nextStart = 1
  let nextCorrectionStart = 1
  return exercises.map((exercise, k) => {
    // lignes en pointillés de cet exercice (palette, énoncé seulement,
    // jamais dans la correction)
    const writingLinesSetting = carryOver.writingLines?.[k + 1]
    const writingLines =
      writingLinesSetting == null
        ? undefined
        : { num: k + 1, ...writingLinesSetting }
    const continued = options.mergeExercises || mergedWithPrevious[k]
    if (exercise.warning != null) {
      if (!continued) nextStart = 1
      return {
        enonce: `#text(fill: gray)[_${escapeTypstText(exercise.warning)}_]`,
        correction: null,
      }
    }
    // QR-code vers l'exercice seul (mode banque, exercice non fusionné
    // uniquement : dans un groupe fusionné (global ou local) il n'y a pas de
    // bloc `exo.with(...)` par exercice où l'accrocher, la case est donc
    // désactivée dans ce cas). Le paquet exercise-bank génère et place le
    // QR-code lui-même à partir de cette URL (voir `buildVersionContent`).
    const qrUrl =
      options.showQrCode &&
      !isGrouped[k] &&
      exercise.url != null &&
      exercise.url.length > 0
        ? exercise.url
        : undefined
    if (!continued) nextStart = 1
    const enonce = exerciseBody(
      exercise.intro,
      exercise.questions,
      exercise.numbered,
      figures,
      `ex${k + 1}`,
      options.boldQuestionNumbers,
      nextStart,
      emitAnchors,
      isGrouped[k],
      writingLines,
    )
    nextStart += enonce.itemCount
    let correction: string | null = null
    if (exercise.corrections.length > 0) {
      if (!continued) nextCorrectionStart = 1
      // préfixe distinct : la mise en page de la correction (colonnes,
      // espacement) se règle indépendamment de celle de l'énoncé
      const body = exerciseBody(
        exercise.introCorrection,
        exercise.corrections,
        exercise.numbered,
        figures,
        `ex${k + 1}-corr`,
        options.boldQuestionNumbers,
        nextCorrectionStart,
        emitAnchors,
        isGrouped[k],
      )
      nextCorrectionStart += body.itemCount
      correction = body.code
    }
    return { enonce: enonce.code, correction, qrUrl }
  })
}

/**
 * Code Typst actuellement généré pour l'énoncé d'un exercice (préremplissage
 * de la modale d'édition), sans appliquer sa surcharge existante : c'est le
 * texte de départ que le professeur affine, pas la surcharge déjà enregistrée
 * (celle-ci est lue directement dans `carryOver.codeOverrides`).
 */
export function getGeneratedExerciseCode(
  exercises: TypstExerciseInput[],
  num: number,
  options: TypstDocumentOptions = defaultTypstDocumentOptions,
  carryOver: TypstCarryOver = {},
): string {
  const figures: string[] = []
  const generated = computeGeneratedExercises(
    exercises,
    options,
    carryOver,
    figures,
    false,
  )
  return generated[num - 1]?.enonce ?? ''
}

/**
 * Construit les définitions et le rendu (Énoncés + Corrections) d'une seule
 * version du sujet. `varPrefix` distingue les variables de banque
 * (`#let <prefix>exN = ...`) d'une version à l'autre ; les variables de mise
 * en page des questions (`exN-colonnes`...) restent, elles, partagées entre
 * toutes les versions d'un même exercice. `emitAnchors` n'est activé que
 * pour la première version : les autres sont des copies (graine différente)
 * du même sujet, la palette de mise en page n'a donc besoin d'y contrôler
 * qu'une seule instance.
 */
function buildVersionContent(
  exercises: TypstExerciseInput[],
  options: TypstDocumentOptions,
  carryOver: TypstCarryOver,
  figures: string[],
  varPrefix: string,
  emitAnchors: boolean,
): VersionContent {
  /** Insertions de la palette à réémettre après l'exercice `num` */
  const insertionLines = (num: number, indent: string): string[] =>
    (carryOver.insertions?.[num] ?? []).map(
      (line) => `${indent}${line} ${INSERTION_TAG}`,
    )
  // Banque d'exercices (paquet exercise-bank) : chaque exercice regroupe
  // son énoncé et sa correction dans un `#let exN = exo.with(...)`, puis
  // la section Énoncés appelle `#exN()` — réordonnez-les librement.
  const bankLines: string[] = []
  // même calcul que dans `computeGeneratedExercises`, nécessaire ici pour le
  // regroupement des exercices fusionnés (bankLines) ci-dessous
  const mergedWithPrevious = exercises.map(
    (_, k) =>
      k > 0 &&
      !options.mergeExercises &&
      (carryOver.merges?.includes(k + 1) ?? false),
  )
  const generated = computeGeneratedExercises(
    exercises,
    options,
    carryOver,
    figures,
    emitAnchors,
  )
  const hasCorrections = generated.some((g) => g.correction != null)
  // surcharge manuelle (modale d'édition de la palette) : remplace le code
  // émis pour l'exercice concerné, sans QR-code dans le rendu final (ses
  // figures et son décompte de questions restent ceux du texte généré,
  // calculés par computeGeneratedExercises avant la surcharge)
  const built = generated.map((g, k) => {
    const override = carryOver.codeOverrides?.[k + 1]
    return {
      enonce: override != null ? wrapCodeOverride(k + 1, override) : g.enonce,
      correction: g.correction,
    }
  })

  const renderLines: string[] = []
  if (options.mergeExercises) {
    // pas de banque : les contenus sont fusionnés en un seul exercice
    renderLines.push('// ----- Énoncés -----')
    renderLines.push('#en-colonnes[')
    // le repère 0 permet une insertion avant le premier exercice
    if (emitAnchors) renderLines.push('  #mathalea-anchor("gap", 0)')
    renderLines.push(...insertionLines(0, '  '))
    for (const [k, { enonce }] of built.entries()) {
      if (emitAnchors) renderLines.push(`  #mathalea-anchor("exo", ${k + 1})`)
      renderLines.push(indentContentBlock(enonce))
      if (emitAnchors) renderLines.push(`  #mathalea-anchor("gap", ${k + 1})`)
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
    // Regroupe les exercices fusionnés (bouton de la palette) avec leur
    // prédécesseur : un groupe (un seul exercice, ou plusieurs fusionnés à
    // la suite) ne produit qu'une seule définition `exo.with(...)`, donc un
    // seul titre pour tout le groupe.
    interface ExerciseGroup {
      /** Indice (0-based) du premier exercice du groupe */
      head: number
      /** Indices (0-based) des exercices du groupe, dans l'ordre */
      members: number[]
    }
    const groups: ExerciseGroup[] = []
    for (const [k] of exercises.entries()) {
      if (mergedWithPrevious[k]) {
        groups[groups.length - 1].members.push(k)
      } else {
        groups.push({ head: k, members: [k] })
      }
    }

    /**
     * Contenu de l'énoncé d'un membre du groupe. Les membres autres que la
     * tête n'ont pas leur propre appel `#exN()` (ils sont regroupés dans
     * celui de la tête) : leurs repères « exo » (contrôles de l'exercice
     * dans la palette) sont donc émis ici, à l'intérieur du contenu, plutôt
     * qu'au niveau du document. Le repère « gap » de chaque membre les y
     * rejoint, sauf celui du dernier membre du groupe (voir plus bas) : à
     * l'intérieur d'un groupe, un saut de page casserait la compilation
     * (interdit dans un conteneur Typst) et un saut de colonne ou une
     * insertion de texte n'auraient pas de sens ; seule la limite entre
     * deux groupes reste un point d'insertion valide.
     */
    const memberEnonce = (
      k: number,
      isHead: boolean,
      isLast: boolean,
    ): string => {
      const parts: string[] = []
      if (!isHead && emitAnchors) {
        parts.push(`#mathalea-anchor("exo", ${k + 1})`)
      }
      parts.push(built[k].enonce)
      if (!isLast && emitAnchors) {
        parts.push(`#mathalea-anchor("gap", ${k + 1})`)
      }
      return parts.join('\n')
    }

    for (const group of groups) {
      for (const k of group.members) {
        const suffix =
          k === group.head ? '' : ' (fusionné avec le précédent)'
        bankLines.push(`// ----- Exercice ${k + 1}${suffix} -----`)
      }
      bankLines.push(`#let ${varPrefix}ex${group.head + 1} = exo.with(`)
      // la référence et le QR-code ne sont affichés que pour un groupe d'un
      // seul exercice (ils ne peuvent pas représenter tout un groupe fusionné)
      if (group.members.length === 1) {
        const ref = exercises[group.head].ref.trim()
        if (ref.length > 0) {
          bankLines.push(`  id: "${ref.replaceAll('"', '\\"')}",`)
        }
        // une surcharge de code (modale d'édition) remplace tout le contenu
        // généré de l'exercice : le QR-code s'y désactive avec elle
        const qrUrl = generated[group.head].qrUrl
        if (
          qrUrl != null &&
          carryOver.codeOverrides?.[group.head + 1] == null
        ) {
          bankLines.push(`  qr: ${typstString(qrUrl)},`)
        }
      }
      bankLines.push('  exercise: [')
      const enonceBody = group.members
        .map((k, i) =>
          memberEnonce(k, k === group.head, i === group.members.length - 1),
        )
        .join('\n\n')
      bankLines.push(indentContentBlock(indentContentBlock(enonceBody)))
      bankLines.push('  ],')
      const correctionMembers = group.members.filter(
        (k) => built[k].correction != null,
      )
      if (correctionMembers.length > 0) {
        bankLines.push('  solution: [')
        const correctionBody = correctionMembers
          .map((k) => built[k].correction as string)
          .join('\n\n')
        bankLines.push(indentContentBlock(indentContentBlock(correctionBody)))
        bankLines.push('  ],')
      }
      bankLines.push(')')
    }

    const marginWidth = MARGIN_BADGE_WIDTH[options.badgeStyle]
    renderLines.push('// ----- Énoncés -----')
    // à partir de la 2e version, la colonne des badges a pu être élargie par
    // la section Corrections de la version précédente (réglage global du
    // paquet) : on la remet à sa largeur d'énoncé avant de reprendre
    if (varPrefix !== '' && marginWidth != null) {
      renderLines.push(`#exo-setup(margin-position: ${marginWidth.exo})`)
    }
    renderLines.push('#en-colonnes[')
    // le repère 0 permet une insertion avant le premier exercice
    if (emitAnchors) renderLines.push('  #mathalea-anchor("gap", 0)')
    renderLines.push(...insertionLines(0, '  '))
    for (const group of groups) {
      const last = group.members[group.members.length - 1]
      // repère "exo" : contrôles de l'exercice (nombre de questions,
      // suppression) dans la palette de l'aperçu
      if (emitAnchors) {
        renderLines.push(`  #mathalea-anchor("exo", ${group.head + 1})`)
      }
      renderLines.push(`  #${varPrefix}ex${group.head + 1}()`)
      // repère "gap" du dernier membre du groupe : seule limite, entre deux
      // groupes, où un saut de page/colonne ou une insertion a un sens
      if (emitAnchors) renderLines.push(`  #mathalea-anchor("gap", ${last + 1})`)
      renderLines.push(...insertionLines(last + 1, '  '))
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
      if (marginWidth != null && marginWidth.corr !== marginWidth.exo) {
        renderLines.push(`  #exo-setup(margin-position: ${marginWidth.corr})`)
      }
      renderLines.push('  #en-colonnes[')
      renderLines.push('    #exo-print-solutions(title: none)')
      renderLines.push('  ]')
      renderLines.push(']')
      renderLines.push('')
    }
  }

  return { bankLines, renderLines, hasCorrections }
}

/**
 * Génère le code Typst complet de la fiche.
 * Le préambule expose des variables (`colonnes`, `corrige`...) que
 * l'utilisateur peut modifier directement dans l'éditeur.
 * `extraVersions` contient le contenu (graine différente) des sujets B, C...
 * générés à la suite du sujet principal (Sujet A), chacun avec sa propre
 * pagination et ses propres corrections.
 */
export function buildTypstDocument(
  exercises: TypstExerciseInput[],
  options: TypstDocumentOptions = defaultTypstDocumentOptions,
  carryOver: TypstCarryOver = {},
  extraVersions: TypstExerciseInput[][] = [],
): string {
  // Les corps sont convertis d'abord : les figures SVG rencontrées sont
  // collectées pour être déclarées (`#let fig-N = image(...)`) en tête
  // de document, ce qui garde le corps du code lisible. Partagée entre
  // toutes les versions : chaque occurrence de figure y ajoute une entrée,
  // avec son propre réglage de zoom/alignement.
  const figures: string[] = []
  const primary = buildVersionContent(
    exercises,
    options,
    carryOver,
    figures,
    '',
    true,
  )
  const extra = extraVersions.map((versionExercises, i) =>
    buildVersionContent(
      versionExercises,
      options,
      carryOver,
      figures,
      `v${i + 1}`,
      false,
    ),
  )
  const totalVersions = 1 + extraVersions.length
  const bankLines = [...primary.bankLines, ...extra.flatMap((v) => v.bankLines)]
  const allLines = [
    ...bankLines,
    ...primary.renderLines,
    ...extra.flatMap((v) => v.renderLines),
  ]
  const usesMathaleaFigure = allLines.some((line) =>
    line.includes('mathalea-figure('),
  )
  const usesTasks = allLines.some((line) => line.includes('#tasks('))
  const usesQcm = allLines.some((line) => line.includes('qcm-'))
  const usesAnchors = allLines.some((line) =>
    line.includes('#mathalea-anchor('),
  )
  const usesQrCode = allLines.some((line) => /^\s*qr: /.test(line))
  const usesSchema = allLines.some((line) =>
    line.includes('mathalea-schema-span'),
  )
  const usesWritingLines = allLines.some((line) =>
    line.includes('#mathalea-lignes('),
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
  if (usesTasks || usesExerciseBank || options.autoVerticalSpacing) {
    lines.push('// ----- Paquets -----')
    if (usesExerciseBank) lines.push(EXERCISE_BANK_IMPORT)
    if (usesTasks) lines.push(TASKIZE_IMPORT)
    if (options.autoVerticalSpacing) lines.push(BREATHER_IMPORT)
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
  if (usesWritingLines) {
    lines.push('// ----- Lignes en pointillés (à compléter par l’élève) -----')
    lines.push(MATHALEA_WRITING_LINES_HELPER)
    lines.push('')
  }
  // mathalea-fit (adaptation de la largeur des figures) est requis dès
  // qu'une figure est présente ; mathalea-figure l'utilise pour ses figures
  // à labels, il doit donc être défini avant.
  if (figures.length > 0) {
    lines.push('// ----- Figures : adaptation à la largeur et alignement -----')
    lines.push(MATHALEA_FIT_HELPER)
    lines.push('')
    lines.push(MATHALEA_FIGURE_BLOCK_HELPER)
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
      '#tasks-setup(columns: "auto-fit", auto-fit-mode: "uniform", max-columns: 4)',
    )
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
      lines.push(
        `#let ${prefix}-colonnes = ${layout?.columns ?? DEFAULT_TASKS_COLUMNS}`,
      )
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
  if (options.autoVerticalSpacing) {
    lines.push(
      '// gestion automatique des espaces verticaux : les lignes aux maths',
      "// hautes s'écartent juste ce qu'il faut (paquet breather)",
      '#show: breathe',
    )
  }
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
    if (usesQrCode) lines.push(`  qr-size: ${QRCODE_SIZE},`)
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
      const figNum = index + 1
      lines.push(`#let fig-${figNum} = ${figure}`)
      lines.push(`#let fig-${figNum}-zoom = ${carryOver.figureZoom?.[figNum] ?? 1}`)
      lines.push(`#let fig-${figNum}-align = ${carryOver.figureAlign?.[figNum] ?? 'left'}`)
    }
    lines.push('')
  }
  lines.push(...bankLines)
  lines.push('')
  lines.push('// ----- En-tête -----')
  // repère du bloc de titre : la palette de l'aperçu propose d'y modifier
  // les variables titre, sous-titre et entete
  lines.push('#mathalea-anchor("header", 0)')
  lines.push(
    ...headerBlock(
      options.headerStyle,
      totalVersions > 1 ? `Sujet ${versionLetter(0)}` : undefined,
    ),
  )
  lines.push('')
  lines.push(...primary.renderLines)
  for (const [i, version] of extra.entries()) {
    lines.push('#pagebreak(weak: true)')
    // chaque sujet recommence sa propre pagination et sa numérotation
    // d'exercices (compteur global du paquet exercise-bank)
    lines.push('#counter(page).update(1)')
    if (!options.mergeExercises) lines.push('#exo-counter.update(0)')
    lines.push('')
    lines.push(
      ...headerBlock(options.headerStyle, `Sujet ${versionLetter(i + 1)}`),
    )
    lines.push('')
    lines.push(...version.renderLines)
  }

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
function headerBlock(style: HeaderStyle, versionLabel?: string): string[] {
  // avec plusieurs versions, l'étiquette « Sujet A/B... » termine la ligne
  // d'en-tête (Nom/Prénom/Classe) plutôt que d'ajouter une ligne à part ;
  // dans ce cas la ligne s'affiche même si `entete` est vide (l'étiquette
  // doit rester visible sur chaque sujet)
  const label =
    versionLabel != null
      ? `text(weight: "bold", fill: couleur)[${escapeTypstText(versionLabel)}]`
      : null
  /**
   * Ligne d'en-tête (`entete`), avec l'étiquette de version à sa droite
   * quand il y en a une ; sans étiquette, rendu inchangé (simple `text`,
   * centré pour l'habillage « cadre »).
   */
  const enteteLine = (centered: boolean): string => {
    if (label != null) {
      const align = centered ? 'center' : 'left'
      return `grid(columns: (1fr, auto), align: (${align}, horizon), text(fill: gray.darken(20%))[#entete], ${label})`
    }
    const plain = 'text(fill: gray.darken(20%))[#entete]'
    return centered ? `align(center, ${plain})` : plain
  }
  const enteteCondition = label != null ? 'true' : 'entete != ""'
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
      `#if ${enteteCondition} [ #v(3pt) #${enteteLine(true)} ]`,
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
      `#if ${enteteCondition} [`,
      '  #v(4pt)',
      '  #block(width: 100%, stroke: 0.6pt + couleur.lighten(40%), radius: 3pt, inset: 6pt,',
      `    ${enteteLine(false)})`,
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
    `#if ${enteteCondition} [ #v(2pt) #${enteteLine(false)} ]`,
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
