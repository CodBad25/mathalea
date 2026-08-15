import {
  CETZ_IMPORT,
  CETZ_PLOT_CHART_IMPORT,
  MATHALEA_FIGURE_BLOCK_HELPER,
  MATHALEA_FIGURE_HELPERS,
  MATHALEA_FIT_HELPER,
  MATHALEA_QCM_HELPERS,
  MATHALEA_SCHEMA_HELPER,
  TASKIZE_IMPORT,
  VARTABLE_IMPORT,
  escapeTypstText,
  htmlToTypst,
} from './latexToTypst'
import { LOGO_CAN_VIRTUAL_PATH } from './mathaleaLogo'
import { minimalCorrection } from './minimalCorrection'

/**
 * Logo de la page de garde « Course aux nombres », référencé par chemin
 * virtuel (voir `mathaleaLogo.ts`) plutôt qu'embarqué : `prefetchStaticImages`
 * (`Typst.svelte`) le charge dans le compilateur pour l'aperçu, et l'ajoute
 * au `.zip` téléchargé aux côtés du `.typ`.
 *
 * Largeur en pourcentage (relative au conteneur, pas à la page) : elle suit
 * ainsi la largeur de la page de garde sans dépasser en A5, plus étroite
 * qu'en A4, sans code dédié par format.
 */
const MATHALEA_LOGO_IMAGE = `image("${LOGO_CAN_VIRTUAL_PATH}", width: 45%)`

/**
 * Import du paquet exercise-bank (badges Exercice/Correction, banque).
 * Depuis la 0.6.0, le paquet gère lui-même les QR-codes (via tiaoma en
 * interne) : plus besoin d'importer tiaoma séparément.
 *
 * `exo-solution-box` (plutôt que `exo-print-solutions`) : appelée directement
 * par exercice/groupe dans la section Corrections, pour pouvoir y placer une
 * insertion de la palette (texte, section) *avant* le badge « Correction N »
 * — `exo-print-solutions` imprime tous les items en attente d'un coup, sans
 * point d'insertion individuel entre eux (voir `buildVersionContent`).
 */
export const EXERCISE_BANK_IMPORT =
  '#import "@preview/exercise-bank:0.6.1": exo, exo-setup, exo-solution-box, exo-counter'

/** Hauteur (et largeur) des QR-codes placés au coin des exercices (`qr-size`) */
const QRCODE_SIZE = '1.8cm'
const QRCODE_POSITION = '"tasks"'

/**
 * Import du paquet breather (gestion automatique des espaces verticaux) :
 * `#show: breathe` écarte les lignes contenant des maths hautes (fractions
 * « display », matrices…) juste ce qu'il faut, sans toucher aux autres.
 */
export const BREATHER_IMPORT = '#import "@preview/breather:0.1.0": breathe'

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
/** Marqueur de fin de ligne des insertions faites via la palette, avant une correction */
export const INSERTION_CORRECTION_TAG = '// mathalea:insertion-corr'

/**
 * Lignes en pointillés insérables (fin d'exercice ou après chaque question),
 * pour que l'élève y écrive. `n` lignes espacées de `gutter` ; sans effet
 * visuel (ni espace) tant que `n` vaut 0, valeur de départ dans la palette.
 */
export const MATHALEA_WRITING_LINES_HELPER = `#let mathalea-lignes(n, gutter: 2em) = if n > 0 { block(above: 2em, below: 0.8em,
  stack(spacing: gutter, ..range(n).map(i => line(length: 100%, stroke: (paint: luma(120), thickness: 0.6pt, dash: "dotted"))))
) }`

/**
 * Tableau « Course aux nombres » : équivalent Typst de l'environnement
 * `TableauCan` de la sortie LaTeX (voir `lib/latex/preambuleTex.ts`). Une
 * ligne par question, avec son numéro, son énoncé, la réponse à compléter
 * (`canReponseACompleter` de l'exercice) et une colonne réservée au jury.
 *
 * `enonces` et `reponses` sont deux listes de contenus de même longueur (une
 * réponse manquante laisse la cellule vide) ; les proportions des colonnes
 * reprennent celles du `colspec` de la version LaTeX. L'en-tête se répète en
 * haut de chaque page, comme le `longtblr` de LaTeX.
 */
export const MATHALEA_CAN_TABLE_HELPER = `#let can-tableau(
  enonces,
  reponses,
  jury: true,
  entetes: ([\\#], [Énoncé], [Réponse], [Jury]),
  fond: luma(230),
  hauteur-ligne: 11pt,
) = {
  let largeurs = if jury { (0.075fr, 0.545fr, 0.28fr, 0.1fr) } else { (0.08fr, 0.6fr, 0.32fr) }
  let cellules = ()
  for (i, enonce) in enonces.enumerate() {
    cellules.push(table.cell(fill: fond)[*#(i + 1)*])
    cellules.push(enonce)
    cellules.push(reponses.at(i, default: []))
    if jury { cellules.push([]) }
  }
  table(
    columns: largeurs,
    align: center + horizon,
    inset: (x: 6pt, y: hauteur-ligne),
    stroke: 0.6pt + luma(60),
    table.header(..entetes.slice(0, largeurs.len()).map(entete => table.cell(fill: fond)[*#entete*])),
    ..cellules,
  )
}`

/**
 * Champ à compléter par l'élève (« Nom : ...... »), commun aux deux pages de
 * garde. Les pointillés occupent toute la largeur restante (`repeat`).
 */
export const MATHALEA_COVER_FIELD_HELPER = `#let mathalea-champ(intitule, largeur: 1fr) = box(width: largeur,
  grid(columns: (auto, 1fr), column-gutter: 4pt,
    [#intitule :], box(width: 1fr, repeat(gap: 2pt)[.])))`

/**
 * Page de garde des modèles « Évaluation », « Brevet des collèges » et
 * « BAC » : intitulé encadré, session, matière, durée, consignes, puis le
 * barème exercice par exercice et son total. Reprend la présentation de la
 * page de garde de la vue PDF (`ExamTemplateEngine`, `latex/LatexConfig.ts`).
 *
 * Tous les textes sont passés en arguments nommés : ils restent modifiables
 * dans l'éditeur, comme les autres réglages en tête de document.
 * - `identite` ajoute en haut les champs Nom/Prénom/Classe/Date (évaluation) ;
 * - `colonne-note` ajoute au barème une colonne vide où porter la note ;
 * - `note-fin` inscrit une mention en bas de page (« Tournez la page S.V.P. »).
 */
export const MATHALEA_COVER_HELPER = `#let mathalea-points(n) = {
  let texte = if n == calc.round(n) { str(calc.round(n)) } else { str(n).replace(".", ",") }
  texte + if calc.abs(n) >= 2 { " points" } else { " point" }
}
#let mathalea-couverture(
  titre: "",
  session: "",
  matiere: "",
  duree: "",
  consignes: (),
  bareme: (),
  identite: false,
  colonne-note: false,
  note-fin: none,
) = {
  if identite {
    block(width: 100%, below: 2em,
      grid(columns: (1fr, 1fr), column-gutter: 10mm, row-gutter: 1.4em,
        mathalea-champ("Nom"), mathalea-champ("Prénom"),
        mathalea-champ("Classe"), mathalea-champ("Date")))
  }
  set align(center)
  v(1.5cm)
  if titre != "" {
    block(stroke: 0.8pt + couleur, inset: (x: 10pt, y: 8pt),
      text(size: 2em, weight: "bold", fill: couleur, titre))
    v(6mm)
  }
  if session != "" { text(size: 0.95em, session); v(1.2cm) }
  if matiere != "" {
    text(size: 1.6em, weight: "bold", matiere)
    v(3mm)
    line(length: 7cm, stroke: 1pt + couleur)
    v(1cm)
  }
  if duree != "" { text(size: 1.15em, weight: "bold")[Durée de l’épreuve : #duree]; v(8mm) }
  for consigne in consignes { text(size: 1.05em, style: "italic", consigne); v(4mm) }
  if bareme.len() > 0 {
    v(1.2cm)
    let entetes = ("Exercice", "Barème") + if colonne-note { ("Note",) } else { () }
    let colonnes = (5cm, 3cm) + if colonne-note { (3cm,) } else { () }
    table(columns: colonnes, align: center + horizon, inset: 7pt,
      stroke: 0.7pt + couleur,
      ..entetes.map(entete => text(weight: "bold", entete)),
      ..bareme.enumerate().map(((i, points)) => {
        let cellules = (align(left)[Exercice #(i + 1)], mathalea-points(points))
        if colonne-note { cellules + ([],) } else { cellules }
      }).flatten())
    v(6mm)
    text(size: 1.2em, weight: "bold")[Total : #mathalea-points(bareme.fold(0, (s, p) => s + p))]
  }
  if note-fin != none and note-fin != "" { v(1fr); align(right, text(weight: "bold", note-fin)) }
  pagebreak()
}`

/**
 * Page de garde « Course aux nombres » : en-tête d'identité avec la case du
 * score sur le total des questions, consignes de passation et logo (le logo
 * porte déjà le nom du sujet, pas de second titre texte). Reprend
 * `\\pageDeGardeCan` de la sortie LaTeX (`lib/latex/preambuleTex.ts`) sans
 * les logos des académies ni de l'APMEP.
 *
 * La durée et le nombre de questions produisent leurs propres consignes (le
 * décompte suit la fiche) ; `consignes` porte les suivantes, libres.
 */
export const MATHALEA_COVER_CAN_HELPER = `#let mathalea-couverture-can(
  duree: "",
  nb-questions: 0,
  consignes: (),
) = {
  let coche(corps) = {
    grid(columns: (auto, 1fr), column-gutter: 6pt,
      text(weight: "bold")[✓], text(style: "italic", corps))
    v(2.5mm)
  }
  line(length: 100%, stroke: 0.7pt)
  v(5mm)
  grid(columns: (1fr, 1fr), column-gutter: 10mm,
    mathalea-champ("Nom"), mathalea-champ("Prénom"))
  v(7mm)
  grid(columns: (1fr, auto), column-gutter: 10mm, align: horizon,
    mathalea-champ("Classe"),
    block(stroke: 0.7pt, inset: 10pt,
      text(size: 1.15em)[Score : #box(width: 1.6cm, repeat(gap: 2pt)[.]) / #nb-questions]))
  v(5mm)
  line(length: 100%, stroke: 0.7pt)
  v(4mm)
  if duree != "" { coche[Durée : #duree] }
  if nb-questions > 0 { coche[L’épreuve comporte #nb-questions questions.] }
  for consigne in consignes { coche(consigne) }
  v(1.5mm)
  line(length: 100%, stroke: 0.7pt)
  // espacement élastique (plutôt qu'une longueur fixe) : le contenu
  // au-dessus varie déjà (0 à plusieurs consignes) et le format de page
  // aussi (A4/A5) — un espacement fixe y débordait sur une 2e page en A5,
  // trop court pour la somme de tout le contenu fixe.
  v(1fr)
  align(center, mathalea-logo)
  v(1fr)
  pagebreak()
}`

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
 * Espacement par défaut des questions, en mode export (voir `exportMode`) :
 * valeur littérale reprise de `#let interligne-questions = 1.2em`, inlinée
 * directement dans chaque `#tasks(...)` plutôt que déclarée en variable.
 */
const DEFAULT_GUTTER_LITERAL = '1.2em'

/**
 * Préfixe des variables de mise en page de la liste des corrections du mode
 * « Course aux nombres ». Elle est unique pour toute la fiche (un seul tableau,
 * une seule liste de réponses) : le numéro 0, qu'aucun exercice ne porte, la
 * distingue des listes de questions (`ex1`, `ex1-corr`…) tout en restant
 * reconnue par la palette de l'aperçu et par `harvestCarryOver`.
 */
const CAN_CORRECTIONS_PREFIX = 'ex0-corr'

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
   * Zoom d'un exercice statique sans source `.typ` (`#let exo-N-zoom = ...`),
   * par numéro d'exercice — contrairement à `figureZoom` (numérotation
   * globale des figures), suit l'exercice si on le déplace.
   */
  exerciseZoom?: Record<number, number>
  /**
   * Zoom d'une correction statique sans source `_cor.typ`
   * (`#let exo-N-corr-zoom = ...`), par numéro d'exercice — indépendant de
   * `exerciseZoom` (l'énoncé peut avoir sa propre source `.typ` sans que la
   * correction en ait une, ou l'inverse).
   */
  exerciseCorrectionZoom?: Record<number, number>
  /**
   * Code Typst saisi à la main (modale d'édition de la palette) qui remplace
   * l'énoncé généré d'un exercice, par numéro d'exercice. Désactive le QR-code
   * et le décompte de questions (numérotation continue en cas de fusion) de
   * cet exercice, dont le contenu échappe désormais à la génération.
   */
  codeOverrides?: Record<number, string>
  /**
   * Code Typst saisi à la main (modale d'édition de la palette) qui remplace
   * la correction générée d'un exercice, par numéro d'exercice. Sans effet
   * si l'exercice n'a pas de correction (rien à remplacer).
   */
  codeOverridesCorrection?: Record<number, string>
  /**
   * Code Typst saisi à la main qui remplace l'énoncé généré d'une ligne du
   * tableau « Course aux nombres », par numéro de ligne (1-based, celui de
   * la colonne « # » du tableau — toutes les questions de tous les exercices
   * mises bout à bout, pas un numéro d'exercice). Pendant, à l'échelle d'une
   * ligne, de `codeOverrides`.
   */
  codeOverridesCan?: Record<number, string>
  /**
   * Code Typst saisi à la main qui remplace la réponse à compléter générée
   * d'une ligne du tableau « Course aux nombres », par numéro de ligne.
   * Pendant de `codeOverridesCan` pour la colonne « Réponse ».
   */
  codeOverridesCanReponse?: Record<number, string>
  /**
   * Lignes de code Typst insérées juste avant la correction d'un exercice
   * (sans le marqueur `// mathalea:insertion-corr`), par numéro d'exercice.
   * Pendant de `insertions` pour la correction.
   */
  insertionsCorrection?: Record<number, string[]>
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
/** Repère de début d'une surcharge de code de correction (voir `codeOverridesCorrection`) */
const CODE_OVERRIDE_CORRECTION_START =
  /^([ \t]*)\/\/ mathalea:override-corr\((\d+)\)\s*$/
/** Repère de fin d'une surcharge de code de correction */
const CODE_OVERRIDE_CORRECTION_END =
  /^[ \t]*\/\/ mathalea:override-corr-end\s*$/
/** Repère de début d'une surcharge d'énoncé de ligne « Course aux nombres » (voir `codeOverridesCan`) */
const CODE_OVERRIDE_CAN_START = /^([ \t]*)\/\/ mathalea:override-can\((\d+)\)\s*$/
/**
 * Repère de fin d'une surcharge d'énoncé de ligne « Course aux nombres ».
 * Contrairement à `CODE_OVERRIDE_END` (toujours seul sur sa ligne), cette
 * ligne peut être suivie de `],` : elle termine un élément du tableau passé
 * à `#can-tableau(...)` (voir `typstContentArrayArgument`), qui colle la
 * fermeture du littéral de contenu directement après la dernière ligne
 * plutôt que de l'émettre sur sa propre ligne — le repère n'ancre donc que
 * le début de la ligne, pas sa fin.
 */
const CODE_OVERRIDE_CAN_END = /^[ \t]*\/\/ mathalea:override-can-end/
/**
 * Repère de début d'une surcharge de réponse de ligne « Course aux nombres »
 * (voir `codeOverridesCanReponse`). Contrairement aux autres repères de
 * début, celui-ci peut être précédé d'un `[` collé : la cellule « Réponse »
 * n'a pas de repère `mathalea-anchor` avant elle (seule la cellule « Énoncé »
 * en porte), donc quand elle est surchargée, ce repère se retrouve en toute
 * première ligne de l'élément du tableau — juste après le `[` que
 * `typstContentArrayArgument` colle au début de chaque élément.
 */
const CODE_OVERRIDE_CAN_REPONSE_START =
  /^([ \t]*)\[?\/\/ mathalea:override-can-rep\((\d+)\)\s*$/
/** Repère de fin d'une surcharge de réponse de ligne « Course aux nombres » (voir `CODE_OVERRIDE_CAN_END`) */
const CODE_OVERRIDE_CAN_REPONSE_END =
  /^[ \t]*\/\/ mathalea:override-can-rep-end/

/** Enveloppe le code saisi par le professeur entre ses repères, pour l'exercice `num` */
function wrapCodeOverride(num: number, code: string): string {
  return `// mathalea:override(${num})\n${code}\n// mathalea:override-end`
}

/** Enveloppe le code de correction saisi par le professeur entre ses repères */
function wrapCodeOverrideCorrection(num: number, code: string): string {
  return `// mathalea:override-corr(${num})\n${code}\n// mathalea:override-corr-end`
}

/**
 * Enveloppe l'énoncé saisi par le professeur pour la ligne `num` du tableau
 * « Course aux nombres ». Contrairement à `wrapCodeOverride`, se termine par
 * un saut de ligne après le repère de fin : cette valeur est un élément du
 * tableau passé à `#can-tableau(...)`, dont `typstContentArrayArgument`
 * colle `],` directement après la dernière ligne (voir `CODE_OVERRIDE_CAN_END`)
 * — sans ce saut de ligne, `],` se retrouverait sur la ligne du repère,
 * commentée avec lui (`//`), et l'élément ne se refermerait jamais.
 */
function wrapCodeOverrideCan(num: number, code: string): string {
  return `// mathalea:override-can(${num})\n${code}\n// mathalea:override-can-end\n`
}

/** Enveloppe la réponse saisie par le professeur pour la ligne `num` du tableau « Course aux nombres » (voir `wrapCodeOverrideCan`) */
function wrapCodeOverrideCanReponse(num: number, code: string): string {
  return `// mathalea:override-can-rep(${num})\n${code}\n// mathalea:override-can-rep-end\n`
}

/**
 * Retire l'appel à `mathalea-anchor` du bloc figure (`MATHALEA_FIGURE_BLOCK_HELPER`) :
 * ce repère (contrôle de zoom de la palette de mise en page) n'a pas de sens
 * en mode export, où `mathalea-anchor` n'est jamais défini.
 */
function stripAnchorCall(helper: string): string {
  return helper.replace(/\n\s*mathalea-anchor\([^\n]*\)\n/, '\n')
}

/**
 * Détecte, dans un ensemble de lignes de code Typst déjà généré, les aides
 * dont il a besoin (imports/helpers à inclure) : partagé par
 * `buildTypstDocument` (document complet) et `buildStandaloneExerciseCode`
 * (fragment autonome d'un seul exercice, pour la modale d'édition).
 */
function detectUsedFeatures(lines: string[]): {
  usesMathaleaFigure: boolean
  usesTasks: boolean
  usesQcm: boolean
  usesSchema: boolean
  usesWritingLines: boolean
  usesCetz: boolean
  usesCetzPlotChart: boolean
} {
  return {
    usesMathaleaFigure: lines.some((line) => line.includes('mathalea-figure(')),
    usesTasks: lines.some((line) => line.includes('#tasks(')),
    usesQcm: lines.some((line) => line.includes('qcm-')),
    usesSchema: lines.some((line) => line.includes('mathalea-schema-span')),
    usesWritingLines: lines.some((line) => line.includes('#mathalea-lignes(')),
    usesCetz: lines.some((line) => line.includes('cetz.')),
    usesCetzPlotChart: lines.some((line) => line.includes('chart.')),
  }
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
  // associe chaque ligne marquée au dernier repère rencontré. Une insertion
  // de correction suit de la même façon le repère `corr` de l'exercice
  // qu'elle précède (voir `insertionsCorrection`) — repères et marqueurs
  // distincts, jamais confondus dans la même passe.
  const insertions: Record<number, string[]> = {}
  const insertionsCorrection: Record<number, string[]> = {}
  let currentGap: number | null = null
  let currentCorr: number | null = null
  for (const line of code.split('\n')) {
    const gap = line.match(/#mathalea-anchor\("gap", (\d+)\)/)
    if (gap != null) {
      currentGap = Number(gap[1])
      continue
    }
    const corr = line.match(/#mathalea-anchor\("corr", (\d+)\)/)
    if (corr != null) {
      currentCorr = Number(corr[1])
      continue
    }
    const insertion = line.match(/^\s*(.*?)\s*\/\/ mathalea:insertion\s*$/)
    if (insertion != null && currentGap != null && insertion[1].length > 0) {
      ;(insertions[currentGap] ??= []).push(insertion[1])
    }
    const insertionCorr = line.match(
      /^\s*(.*?)\s*\/\/ mathalea:insertion-corr\s*$/,
    )
    if (
      insertionCorr != null &&
      currentCorr != null &&
      insertionCorr[1].length > 0
    ) {
      ;(insertionsCorrection[currentCorr] ??= []).push(insertionCorr[1])
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
    if (match[2] !== 'center') figureAlign[Number(match[1])] = match[2]
  }
  const exerciseZoom: Record<number, number> = {}
  for (const match of code.matchAll(/^#let exo-(\d+)-zoom = ([\d.]+)/gm)) {
    const value = Number(match[2])
    if (value !== 1) exerciseZoom[Number(match[1])] = value
  }
  const exerciseCorrectionZoom: Record<number, number> = {}
  for (const match of code.matchAll(
    /^#let exo-(\d+)-corr-zoom = ([\d.]+)/gm,
  )) {
    const value = Number(match[2])
    if (value !== 1) exerciseCorrectionZoom[Number(match[1])] = value
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
  // repère et son contenu, voir `wrapCodeOverride`). Les quatre types de
  // surcharge (énoncé/correction d'exercice, énoncé/réponse de ligne
  // « Course aux nombres ») partagent la même boucle : leurs repères sont
  // distincts donc jamais confondus.
  const codeOverrides: Record<number, string> = {}
  const codeOverridesCorrection: Record<number, string> = {}
  const codeOverridesCan: Record<number, string> = {}
  const codeOverridesCanReponse: Record<number, string> = {}
  const codeLines = code.split('\n')
  for (let i = 0; i < codeLines.length; i++) {
    const start = codeLines[i].match(CODE_OVERRIDE_START)
    const startCorrection = codeLines[i].match(CODE_OVERRIDE_CORRECTION_START)
    const startCan = codeLines[i].match(CODE_OVERRIDE_CAN_START)
    const startCanReponse = codeLines[i].match(CODE_OVERRIDE_CAN_REPONSE_START)
    const matched = start ?? startCorrection ?? startCan ?? startCanReponse
    if (matched == null) continue
    const indent = matched[1]
    const num = Number(matched[2])
    const endRegex =
      start != null
        ? CODE_OVERRIDE_END
        : startCorrection != null
          ? CODE_OVERRIDE_CORRECTION_END
          : startCan != null
            ? CODE_OVERRIDE_CAN_END
            : CODE_OVERRIDE_CAN_REPONSE_END
    const content: string[] = []
    i++
    while (i < codeLines.length && !endRegex.test(codeLines[i])) {
      const line = codeLines[i]
      content.push(line.startsWith(indent) ? line.slice(indent.length) : line)
      i++
    }
    if (start != null) codeOverrides[num] = content.join('\n')
    else if (startCorrection != null)
      codeOverridesCorrection[num] = content.join('\n')
    else if (startCan != null) codeOverridesCan[num] = content.join('\n')
    else codeOverridesCanReponse[num] = content.join('\n')
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
    insertionsCorrection,
    figureZoom,
    figureAlign,
    exerciseZoom,
    exerciseCorrectionZoom,
    merges,
    codeOverrides,
    codeOverridesCorrection,
    codeOverridesCan,
    codeOverridesCanReponse,
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
  /**
   * Mode « Course aux nombres » : énoncés à mettre dans le tableau
   * (`listeCanEnonces` de l'exercice, avec repli sur `listeQuestions` déjà
   * appliqué par l'appelant). Absent pour un exercice qui n'en déclare pas :
   * `questions` sert alors d'énoncés.
   */
  canQuestions?: string[]
  /**
   * Mode « Course aux nombres » : réponses à compléter par l'élève
   * (`listeCanReponsesACompleter`), une par question — colonne « Réponse »
   * du tableau. Une entrée vide laisse la cellule vide.
   */
  canAnswers?: string[]
  /**
   * Exercice statique sans source `.typ` (énoncé image scannée seule) :
   * son énoncé n'est qu'un `<img>`, réglable en zoom par la palette
   * (`exo-N-zoom`, voir `htmlToTypst`).
   */
  isStaticImage?: boolean
  /**
   * Exercice statique sans source `_cor.typ` (correction image scannée
   * seule, indépendamment de l'énoncé) : sa correction n'est qu'un `<img>`,
   * réglable en zoom par la palette (`exo-N-corr-zoom`, voir `htmlToTypst`).
   */
  isStaticCorrectionImage?: boolean
}

export interface TypstDocumentOptions {
  title: string
  /** Sous-titre affiché à côté du titre (niveau, classe…) */
  subtitle: string
  headerLine: string
  /** Style de l'en-tête ; `aucun` n'affiche ni titre, ni sous-titre, ni ligne d'en-tête */
  headerStyle: HeaderStyle
  /** Affiche le pied de page (crédit MathALÉA, pagination, titre) */
  showFooter: boolean
  /** Texte affiché à gauche du pied de page (« MathALÉA — coopmaths.fr » par défaut) */
  footerText: string
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
  /**
   * Affiche la correction dans le document généré (`#let corrige`). Décochée,
   * seuls les énoncés sont rendus, sans bloc « Corrections » ni titre associé.
   */
  showCorrections: boolean
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
  /**
   * Mode « Course aux nombres » : toutes les questions de tous les exercices
   * sont rassemblées dans un seul tableau (numéro, énoncé, réponse à
   * compléter, jury), comme le style « Can » de la sortie LaTeX. Les
   * corrections sont numérotées à la suite. Prend le pas sur `mergeExercises`
   * et sur les réglages de badges (il n'y a plus de titre d'exercice).
   */
  canMode: boolean
  /**
   * Correction minimale : quand une correction met une réponse en évidence
   * (`miseEnEvidence`, orange), seule cette réponse est imprimée — le
   * raisonnement détaillé disparaît. Une correction sans mise en évidence
   * reste affichée telle quelle.
   */
  minimalCorrections: boolean
  /** Style des badges du paquet exercise-bank */
  badgeStyle: BadgeStyle
  /**
   * Couleur des badges d'exercice, de correction et des titres
   * (expression Typst, ex : `black`). La correction suit la même couleur.
   */
  badgeColor: string
  /** Nombre de versions du sujet (Sujet A, B...) générées à la suite */
  nbVersions: number
  /** Page de garde placée en tête de chaque sujet (`aucune` par défaut) */
  coverPage: TypstCoverOptions
}

/**
 * Modèles de page de garde proposés (comme la vue PDF, voir
 * `latex/LatexConfig.ts`). `aucune` : la fiche commence directement par son
 * en-tête, comportement d'origine.
 */
export const COVER_TEMPLATES = [
  'aucune',
  'evaluation',
  'brevet',
  'bac',
  'can',
] as const
export type CoverTemplate = (typeof COVER_TEMPLATES)[number]

/** Modèle de page de garde effectivement rendu (hors « aucune ») */
export type ActiveCoverTemplate = Exclude<CoverTemplate, 'aucune'>

/**
 * Textes de la page de garde. Tous sont modifiables dans les réglages, et
 * réémis tels quels dans le code Typst (arguments nommés de
 * `#mathalea-couverture`), donc encore modifiables dans l'éditeur.
 */
export interface TypstCoverOptions {
  template: CoverTemplate
  /** Intitulé principal (« Brevet des collèges », « Évaluation »…) */
  titre: string
  /** Session ou date de l'épreuve (« Juin 2026 »). Inutilisé par « can ». */
  session: string
  /** Matière (« MATHÉMATIQUES »). Inutilisée par « can ». */
  matiere: string
  /** Durée de l'épreuve (« 2 heures ») */
  duree: string
  /** Consignes affichées sous la durée, une par ligne */
  consignes: string[]
  /**
   * Mention en bas de page (« Tournez la page S.V.P. »). Affichée seulement
   * si le modèle en prévoit une (`COVER_TEMPLATE_LAYOUT.hasNoteFin`) et si le
   * texte n'est pas vide.
   */
  noteFin: string
  /**
   * Barème : points de chaque exercice, dans l'ordre de la fiche. Ajusté au
   * nombre d'exercices par les réglages ; ignoré par le modèle « can », dont
   * le score porte sur le nombre de questions.
   */
  bareme: number[]
  /** Affiche le tableau du barème et son total */
  showBareme: boolean
}

/**
 * Présentation propre à chaque modèle : ces différences ne sont pas réglables
 * (elles font le modèle), seul le texte de `noteFin` l'est (voir
 * `TypstCoverOptions.noteFin`) — `hasNoteFin` ne dit que si le modèle en
 * affiche une.
 */
const COVER_TEMPLATE_LAYOUT: Record<
  Exclude<ActiveCoverTemplate, 'can'>,
  { identite: boolean; colonneNote: boolean; hasNoteFin: boolean }
> = {
  // évaluation : la copie est la feuille elle-même, d'où les champs
  // d'identité en tête et la colonne où porter la note de chaque exercice
  evaluation: { identite: true, colonneNote: true, hasNoteFin: false },
  brevet: { identite: false, colonneNote: false, hasNoteFin: true },
  bac: { identite: false, colonneNote: false, hasNoteFin: true },
}

/**
 * Textes proposés à la sélection d'un modèle, tous modifiables ensuite. La
 * session est datée du jour par les réglages (`currentSession`), et le modèle
 * « can » tire ses deux premières consignes de la durée et du nombre de
 * questions (voir `MATHALEA_COVER_CAN_HELPER`).
 */
export const COVER_TEMPLATE_DEFAULTS: Record<
  ActiveCoverTemplate,
  Pick<
    TypstCoverOptions,
    'titre' | 'matiere' | 'duree' | 'consignes' | 'noteFin'
  >
> = {
  evaluation: {
    titre: 'Évaluation',
    matiere: 'Mathématiques',
    duree: '55 minutes',
    consignes: ['La calculatrice est autorisée.'],
    noteFin: '',
  },
  brevet: {
    titre: 'Brevet des collèges',
    matiere: 'MATHÉMATIQUES',
    duree: '2 heures',
    consignes: ['L’usage de la calculatrice est autorisé.'],
    noteFin: 'Tournez la page S.V.P.',
  },
  bac: {
    titre: 'Baccalauréat',
    matiere: 'MATHÉMATIQUES',
    duree: '4 heures',
    consignes: ['L’usage de la calculatrice est autorisé.'],
    noteFin: 'Tournez la page S.V.P.',
  },
  can: {
    titre: 'La course aux nombres',
    matiere: '',
    duree: '9 minutes',
    consignes: [
      'L’usage de la calculatrice et du brouillon sont interdits. Il n’est pas permis d’écrire des calculs intermédiaires.',
    ],
    noteFin: '',
  },
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

/**
 * `aucun` masque le bloc de titre (titre, sous-titre, ligne d'en-tête) sans
 * effet sur le pied de page (réglage indépendant, voir `showFooter`).
 */
export const HEADER_STYLES = ['epure', 'cartouche', 'cadre', 'aucun'] as const
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
  showFooter: true,
  footerText: 'MathALÉA — coopmaths.fr',
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
  showCorrections: true,
  columns: 1,
  pageFormat: 'a4',
  orientation: 'portrait',
  mergeExercises: false,
  canMode: false,
  minimalCorrections: false,
  showQrCode: false,
  badgeStyle: 'underline',
  badgeColor: 'black',
  nbVersions: 1,
  coverPage: {
    template: 'aucune',
    titre: '',
    session: '',
    matiere: '',
    duree: '',
    consignes: [],
    noteFin: '',
    bareme: [],
    showBareme: true,
  },
}

/** Applique le réglage « Correction minimale » aux corrections des exercices */
function withMinimalCorrections(
  exercises: TypstExerciseInput[],
  options: TypstDocumentOptions,
): TypstExerciseInput[] {
  if (!options.minimalCorrections) return exercises
  return exercises.map((exercise) => ({
    ...exercise,
    corrections: exercise.corrections.map(minimalCorrection),
  }))
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
  /**
   * Code destiné à être exporté/copié hors de l'appli (fichier .typ,
   * modale d'édition) : les colonnes et l'espacement des questions sont
   * écrits en valeurs littérales dans le `#tasks(...)`, plutôt que de
   * référencer les variables `${tasksPrefix}-colonnes`/`-gutter` (propres à
   * la palette de mise en page de l'éditeur intégré, sans sens hors de lui).
   */
  exportMode = false,
  /** Réglages de colonnes/espacement de la palette pour cet exercice, déjà résolus par l'appelant */
  layoutOverride?: { columns?: string; gutter?: string },
  /**
   * Variable Typst (`exo-N-zoom` ou `exo-N-corr-zoom`), fournie uniquement
   * pour un énoncé/correction statique sans source `.typ`/`_cor.typ` (image
   * scannée seule) : voir `htmlToTypst`.
   */
  zoomVariable?: string,
): ExerciseBodyResult {
  const parts: string[] = []
  if (intro.trim().length > 0) {
    parts.push(htmlToTypst(intro, figures, zoomVariable))
  }
  let questionList = questions
  let label = numbered ? '"1."' : 'none'
  // une question unique portant ses propres repères (`a)`, `b)`...) est
  // découpée : ses sous-questions deviennent la liste de premier niveau
  if (questions.length === 1) {
    const split = splitSubQuestions(questions[0])
    if (split != null) {
      if (split.head.trim().length > 0) {
        const head = htmlToTypst(split.head, figures, zoomVariable)
        if (head.length > 0) {
          parts.push(head)
        }
      }
      questionList = split.items
      label = split.label
    }
  }
  const converted = questionList
    .map((question) => htmlToTypst(question, figures, zoomVariable))
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
    const columnsExpr = exportMode
      ? (layoutOverride?.columns ?? DEFAULT_TASKS_COLUMNS)
      : `${tasksPrefix}-colonnes`
    const gutterExpr = exportMode
      ? (layoutOverride?.gutter ?? DEFAULT_GUTTER_LITERAL)
      : `${tasksPrefix}-gutter`
    parts.push(
      `${anchorLine}#tasks(columns: ${columnsExpr}, label: ${boldableLabel(label, boldQuestionNumbers)}, row-gutter: ${gutterExpr}, above: 1.2em, below: 0.8em, start: ${startNumber})[\n${items.join('\n')}\n]`,
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
  allExercises: TypstExerciseInput[],
  options: TypstDocumentOptions,
  carryOver: TypstCarryOver,
  figures: string[],
  emitAnchors: boolean,
  /** Voir `exerciseBody` : colonnes/espacement des `#tasks(...)` en valeurs littérales */
  exportMode = false,
): GeneratedExercise[] {
  // seul point de passage des corrections vers le code généré (avec le mode
  // « Course aux nombres ») : le réglage « Correction minimale » s'y applique
  const exercises = withMinimalCorrections(allExercises, options)
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
    // exercice statique sans source .typ/_cor.typ (juste une image scannée) :
    // énoncé et correction se règlent indépendamment, chacun avec sa propre
    // variable de zoom (une source .typ peut exister pour l'un sans l'autre)
    const enonceZoomVariable = exercise.isStaticImage
      ? `exo-${k + 1}-zoom`
      : undefined
    const correctionZoomVariable = exercise.isStaticCorrectionImage
      ? `exo-${k + 1}-corr-zoom`
      : undefined
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
      exportMode,
      carryOver.tasksLayout?.[`ex${k + 1}`],
      enonceZoomVariable,
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
        undefined,
        exportMode,
        carryOver.tasksLayout?.[`ex${k + 1}-corr`],
        correctionZoomVariable,
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
    true,
  )
  return generated[num - 1]?.enonce ?? ''
}

/**
 * Code Typst actuellement généré pour la correction d'un exercice
 * (préremplissage de la modale d'édition), sans appliquer sa surcharge
 * existante — voir `getGeneratedExerciseCode`, pendant pour l'énoncé.
 * @returns le code généré, ou `''` si l'exercice n'a pas de correction
 */
export function getGeneratedCorrectionCode(
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
    true,
  )
  return generated[num - 1]?.correction ?? ''
}

/**
 * Code Typst autonome (compilable seul avec `typst compile`) d'un exercice :
 * préambule minimal (imports, aides et réglages réellement utilisés par son
 * contenu) suivi de son code. Pour le bouton « Copier avec le préambule »
 * de la modale d'édition : contrairement au fragment inséré dans la fiche
 * complète (qui référence des variables et aides définies ailleurs dans le
 * document), ce code ne dépend de rien d'externe.
 *
 * `codeOverride`, s'il est fourni, remplace le code généré de l'exercice
 * (reprend le brouillon en cours d'édition dans la modale, avec ses
 * éventuelles retouches manuelles) ; les figures SVG restent celles du
 * contenu d'origine de l'exercice (jamais stockées dans le texte du
 * brouillon, seulement référencées par `fig-N`).
 * `part` sélectionne l'énoncé (défaut) ou la correction de l'exercice.
 */
export function buildStandaloneExerciseCode(
  exercises: TypstExerciseInput[],
  num: number,
  options: TypstDocumentOptions = defaultTypstDocumentOptions,
  carryOver: TypstCarryOver = {},
  codeOverride?: string,
  part: 'enonce' | 'correction' = 'enonce',
): string {
  const figures: string[] = []
  const generated = computeGeneratedExercises(
    exercises,
    options,
    carryOver,
    figures,
    false,
    true,
  )
  const generatedPart =
    part === 'correction'
      ? generated[num - 1]?.correction
      : generated[num - 1]?.enonce
  const code = codeOverride ?? generatedPart ?? ''
  const codeLines = code.split('\n')
  const {
    usesMathaleaFigure,
    usesTasks,
    usesQcm,
    usesSchema,
    usesWritingLines,
    usesCetz,
    usesCetzPlotChart,
  } = detectUsedFeatures(codeLines)
  const usesFigures = figures.length > 0

  const lines: string[] = []
  const importLines: string[] = []
  if (usesTasks) importLines.push(TASKIZE_IMPORT)
  if (options.autoVerticalSpacing) importLines.push(BREATHER_IMPORT)
  if (usesCetz) importLines.push(CETZ_IMPORT)
  if (usesCetzPlotChart) importLines.push(CETZ_PLOT_CHART_IMPORT)
  if (importLines.length > 0) lines.push(...importLines, '')
  if (usesSchema) lines.push(MATHALEA_SCHEMA_HELPER, '')
  if (usesFigures) {
    lines.push(
      MATHALEA_FIT_HELPER,
      '',
      stripAnchorCall(MATHALEA_FIGURE_BLOCK_HELPER),
      '',
    )
  }
  if (usesMathaleaFigure) lines.push(MATHALEA_FIGURE_HELPERS, '')
  if (usesWritingLines) lines.push(MATHALEA_WRITING_LINES_HELPER, '')
  lines.push(`#let couleur = ${options.badgeColor}`)
  lines.push(`#let police-texte = ${typstString(options.font)}`)
  lines.push(`#let police-maths = ${typstString(options.mathFont)}`)
  lines.push(`#let taille-texte = ${options.fontSize}pt`)
  if (usesQcm) {
    lines.push('#let qcm-colonnes = 2 // colonnes des propositions de QCM')
  }
  if (usesTasks) {
    lines.push(
      '#tasks-setup(columns: "auto-fit", auto-fit-mode: "uniform", max-columns: 4)',
    )
  }
  lines.push(
    `#set text(font: police-texte, size: taille-texte, lang: "fr", spacing: ${options.wordSpacing}%)`,
  )
  lines.push(`#set par(leading: ${options.lineSpacing}em)`)
  lines.push('#set enum(numbering: "1.", spacing: 1.2em)')
  lines.push('#show math.equation: set text(font: police-maths)')
  lines.push('#let txt(corps) = text(font: police-texte, corps)')
  lines.push('#show math.frac: it => math.display(it)')
  if (options.autoVerticalSpacing) lines.push('#show: breathe')
  if (usesQcm) lines.push(MATHALEA_QCM_HELPERS)
  lines.push('')
  if (usesFigures) {
    for (const [index, figure] of figures.entries()) {
      const figNum = index + 1
      lines.push(`#let fig-${figNum} = ${figure}`)
      lines.push(
        `#let fig-${figNum}-zoom = ${carryOver.figureZoom?.[figNum] ?? 1}`,
      )
      lines.push(
        `#let fig-${figNum}-align = ${carryOver.figureAlign?.[figNum] ?? 'center'}`,
      )
    }
    lines.push('')
  }
  lines.push(code)
  return lines.join('\n')
}

/**
 * Argument tableau de contenus Typst, une entrée par ligne :
 * `(\n  [...],\n),`. Les contenus multilignes sont réindentés pour rester
 * lisibles dans le code généré.
 */
function typstContentArrayArgument(items: string[], indent: string): string[] {
  if (items.length === 0) return [`${indent}(),`]
  return [
    `${indent}(`,
    ...items.map(
      (item) => `${indent}  [${item.split('\n').join(`\n${indent}  `)}],`,
    ),
    `${indent}),`,
  ]
}

/** Une ligne (générée, sans surcharge) du tableau « Course aux nombres » */
interface GeneratedCanRow {
  enonce: string
  reponse: string
  correction: string
  /** Numéro (1-based) de l'exercice dont vient la ligne */
  exerciseNum: number
  /** Vrai pour la première ligne de son exercice (repère `exo`) */
  isFirstOfExercise: boolean
}

/**
 * Calcule les lignes générées du tableau « Course aux nombres » (une par
 * question de chaque exercice), sans appliquer les surcharges manuelles
 * (`carryOver.codeOverridesCan`/`codeOverridesCanReponse`) : partagé par
 * `buildCanVersionContent` (assemblage du tableau, qui applique les
 * surcharges après coup) et par `getGeneratedCanRowCode` (préremplissage de
 * la modale d'édition d'une ligne avec son contenu actuellement généré,
 * avant toute surcharge) — pendant, à l'échelle d'une ligne, de
 * `computeGeneratedExercises`.
 */
function computeGeneratedCanRows(
  allExercises: TypstExerciseInput[],
  options: TypstDocumentOptions,
  figures: string[],
): GeneratedCanRow[] {
  const exercises = withMinimalCorrections(allExercises, options)
  const rows: GeneratedCanRow[] = []
  for (const [k, exercise] of exercises.entries()) {
    if (exercise.warning != null) {
      rows.push({
        enonce: escapeTypstText(exercise.warning),
        reponse: '',
        correction: '',
        exerciseNum: k + 1,
        isFirstOfExercise: true,
      })
      continue
    }
    const questions = exercise.canQuestions ?? exercise.questions
    for (const [i, question] of questions.entries()) {
      rows.push({
        enonce: htmlToTypst(question, figures),
        reponse: htmlToTypst(exercise.canAnswers?.[i] ?? '', figures),
        correction: htmlToTypst(exercise.corrections[i] ?? '', figures),
        exerciseNum: k + 1,
        isFirstOfExercise: i === 0,
      })
    }
  }
  return rows
}

/**
 * Code Typst actuellement généré pour l'énoncé et la réponse d'une ligne du
 * tableau « Course aux nombres » (préremplissage de la modale d'édition),
 * sans appliquer sa surcharge existante — voir `getGeneratedExerciseCode`,
 * pendant à l'échelle d'un exercice.
 */
export function getGeneratedCanRowCode(
  exercises: TypstExerciseInput[],
  row: number,
  options: TypstDocumentOptions = defaultTypstDocumentOptions,
): { enonce: string; reponse: string } {
  const rows = computeGeneratedCanRows(exercises, options, [])
  const found = rows[row - 1]
  return { enonce: found?.enonce ?? '', reponse: found?.reponse ?? '' }
}

/**
 * Contenu d'une version en mode « Course aux nombres » : toutes les questions
 * de tous les exercices dans un seul tableau (`#can-tableau`), puis les
 * corrections numérotées à la suite — équivalent du style « Can » de la
 * sortie LaTeX (`lib/Latex.ts`). La consigne et l'introduction des exercices
 * ne sont pas reprises, comme en LaTeX : le tableau ne montre que les énoncés.
 *
 * La palette de mise en page n'y garde que les repères qui ont un sens : la
 * barre de chaque exercice (repère `exo` placé dans sa première cellule, une
 * métadonnée n'occupant aucune place), le repère de chaque ligne (`can-row`,
 * édition de son énoncé/réponse) et les deux points d'insertion qui
 * encadrent le tableau (`gap` 0 et `gap` du dernier exercice) — entre deux
 * lignes d'un même tableau, une insertion ou un saut de page n'en aurait pas.
 * Les insertions portées par les gaps intermédiaires (héritées d'un passage
 * par le mode fiche) sont donc réémises après le tableau, avec les siennes.
 */
function buildCanVersionContent(
  allExercises: TypstExerciseInput[],
  options: TypstDocumentOptions,
  carryOver: TypstCarryOver,
  figures: string[],
  emitAnchors: boolean,
  exportMode: boolean,
): VersionContent {
  const exercises = withMinimalCorrections(allExercises, options)
  const generatedRows = computeGeneratedCanRows(allExercises, options, figures)
  const enonces: string[] = []
  const reponses: string[] = []
  const corrections: string[] = []
  generatedRows.forEach((row, index) => {
    const rowNum = index + 1
    const exoAnchor =
      emitAnchors && row.isFirstOfExercise
        ? `#mathalea-anchor("exo", ${row.exerciseNum})\n`
        : ''
    const rowAnchor = emitAnchors
      ? `#mathalea-anchor("can-row", ${rowNum})\n`
      : ''
    const enonceOverride = carryOver.codeOverridesCan?.[rowNum]
    const reponseOverride = carryOver.codeOverridesCanReponse?.[rowNum]
    enonces.push(
      `${exoAnchor}${rowAnchor}${
        enonceOverride == null
          ? row.enonce
          : exportMode
            ? enonceOverride
            : wrapCodeOverrideCan(rowNum, enonceOverride)
      }`,
    )
    reponses.push(
      reponseOverride == null
        ? row.reponse
        : exportMode
          ? reponseOverride
          : wrapCodeOverrideCanReponse(rowNum, reponseOverride),
    )
    corrections.push(row.correction)
  })

  const insertionLine = (line: string, indent: string): string =>
    exportMode ? `${indent}${line}` : `${indent}${line} ${INSERTION_TAG}`
  const lastGap = exercises.length
  const renderLines: string[] = ['// ----- Course aux nombres -----']
  renderLines.push('#en-colonnes[')
  if (emitAnchors) renderLines.push('  #mathalea-anchor("gap", 0)')
  renderLines.push(
    ...(carryOver.insertions?.[0] ?? []).map((line) =>
      insertionLine(line, '  '),
    ),
  )
  renderLines.push('  #can-tableau(')
  renderLines.push(...typstContentArrayArgument(enonces, '    '))
  renderLines.push(...typstContentArrayArgument(reponses, '    '))
  renderLines.push('  )')
  if (emitAnchors) renderLines.push(`  #mathalea-anchor("gap", ${lastGap})`)
  for (const [num, lines] of Object.entries(carryOver.insertions ?? {})) {
    if (Number(num) === 0) continue
    renderLines.push(...lines.map((line) => insertionLine(line, '  ')))
  }
  renderLines.push(']')
  renderLines.push('')

  const hasCorrections = corrections.some(
    (correction) => correction.trim().length > 0,
  )
  if (hasCorrections) {
    renderLines.push('// ----- Corrections -----')
    renderLines.push('#if corrige [')
    renderLines.push('  // les corrections commencent sur une nouvelle page')
    renderLines.push('  #pagebreak(weak: true)')
    renderLines.push(
      '  #align(center, text(size: 1.3em, weight: "bold", fill: couleur)[Corrections])',
    )
    renderLines.push('  #en-colonnes[')
    // Une seule liste numérotée pour toutes les questions : ses numéros
    // suivent ceux des lignes du tableau (les items doivent donc se suivre
    // sans ligne vide, sinon la numérotation repart à 1). L'environnement
    // `tasks` répartit les réponses sur plusieurs colonnes — indispensable
    // avec le réglage « Correction minimale », où chaque item tient en
    // quelques caractères — et le nombre de colonnes se règle depuis la
    // palette de l'aperçu, comme les listes de questions des exercices.
    const layout = carryOver.tasksLayout?.[CAN_CORRECTIONS_PREFIX]
    const columnsExpr = exportMode
      ? (layout?.columns ?? DEFAULT_TASKS_COLUMNS)
      : `${CAN_CORRECTIONS_PREFIX}-colonnes`
    const gutterExpr = exportMode
      ? (layout?.gutter ?? DEFAULT_GUTTER_LITERAL)
      : `${CAN_CORRECTIONS_PREFIX}-gutter`
    if (emitAnchors) {
      renderLines.push('    #mathalea-anchor("tasks-corr", 0)')
    }
    renderLines.push(
      `    #tasks(columns: ${columnsExpr}, label: ${boldableLabel('"1."', options.boldQuestionNumbers)}, row-gutter: ${gutterExpr}, above: 1.2em, below: 0.8em, start: 1)[`,
    )
    for (const correction of corrections) {
      renderLines.push(`      + ${correction.split('\n').join('\n        ')}`)
    }
    renderLines.push('    ]')
    renderLines.push('  ]')
    renderLines.push(']')
    renderLines.push('')
  }
  return { bankLines: [], renderLines, hasCorrections }
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
  /**
   * Code destiné à être exporté/copié hors de l'appli : voir `exerciseBody`
   * (colonnes/espacement littéraux) et `wrapCodeOverride`/`INSERTION_TAG`
   * (repères de relecture par `harvestCarryOver`, inutiles hors de l'éditeur).
   */
  exportMode = false,
): VersionContent {
  // le mode « Course aux nombres » n'a ni banque d'exercices ni titres : tout
  // le contenu tient dans un seul tableau, construit à part
  if (options.canMode) {
    return buildCanVersionContent(
      exercises,
      options,
      carryOver,
      figures,
      emitAnchors,
      exportMode,
    )
  }
  /** Insertions de la palette à réémettre après l'exercice `num` */
  const insertionLines = (num: number, indent: string): string[] =>
    (carryOver.insertions?.[num] ?? []).map((line) =>
      exportMode ? `${indent}${line}` : `${indent}${line} ${INSERTION_TAG}`,
    )
  /** Insertions de la palette à réémettre juste avant la correction de l'exercice `num` */
  const insertionCorrectionLines = (num: number, indent: string): string[] =>
    (carryOver.insertionsCorrection?.[num] ?? []).map((line) =>
      exportMode
        ? `${indent}${line}`
        : `${indent}${line} ${INSERTION_CORRECTION_TAG}`,
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
    exportMode,
  )
  const hasCorrections = generated.some((g) => g.correction != null)
  // surcharge manuelle (modale d'édition de la palette) : remplace le code
  // émis pour l'exercice concerné, sans QR-code dans le rendu final (ses
  // figures et son décompte de questions restent ceux du texte généré,
  // calculés par computeGeneratedExercises avant la surcharge). En mode
  // export, le repère de relecture (`wrapCodeOverride`) n'a pas d'utilité :
  // rien ne relit plus jamais ce code exporté.
  const built = generated.map((g, k) => {
    const override = carryOver.codeOverrides?.[k + 1]
    const correctionOverride = carryOver.codeOverridesCorrection?.[k + 1]
    return {
      enonce:
        override == null
          ? g.enonce
          : exportMode
            ? override
            : wrapCodeOverride(k + 1, override),
      correction:
        g.correction == null
          ? null
          : correctionOverride == null
            ? g.correction
            : exportMode
              ? correctionOverride
              : wrapCodeOverrideCorrection(k + 1, correctionOverride),
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
      for (const [k, { correction }] of built.entries()) {
        if (correction == null) continue
        // pas de badge en mode fusionné (contenu concaténé, sans exo-box) :
        // le repère et l'insertion précèdent directement le contenu, déjà
        // « avant la correction »
        const num = k + 1
        if (emitAnchors)
          renderLines.push(`    #mathalea-anchor("corr", ${num})`)
        renderLines.push(...insertionCorrectionLines(num, '    '))
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
        const suffix = k === group.head ? '' : ' (fusionné avec le précédent)'
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
      // le champ `solution:` reste renseigné : `display: "sol"` (PDF
      // « corrigé seul », voir corrigeCode dans Typst.svelte) en dépend pour
      // imprimer la correction directement à l'appel de `#exN()`. En mode
      // normal (« both »), `exo()` la mettrait aussi en attente (corr-loc:
      // "end-chapter") mais rien ne relit plus cette file : la correction
      // affichée dans la section Corrections vient de l'appel direct à
      // `exo-solution-box` plus bas, qui garde un point d'insertion avant
      // son badge (impossible via `exo-print-solutions`, voir plus bas).
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
      if (emitAnchors)
        renderLines.push(`  #mathalea-anchor("gap", ${last + 1})`)
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
      // appel direct de `exo-solution-box` (plutôt que `exo-print-solutions`,
      // qui imprimerait tout d'un coup) : chaque correction garde son propre
      // point d'insertion juste avant son badge. Numérotation : position
      // (1-based) du groupe parmi les `#exN()` effectivement appelés — c'est
      // aussi ce qu'incrémente `exo-counter` en interne (un exercice fusionné
      // avec le précédent ne consomme pas de numéro à lui).
      groups.forEach((group, groupIndex) => {
        const num = groupIndex + 1
        const correctionMembers = group.members.filter(
          (k) => built[k].correction != null,
        )
        if (correctionMembers.length === 0) return
        if (emitAnchors) {
          renderLines.push(`    #mathalea-anchor("corr", ${group.head + 1})`)
        }
        renderLines.push(...insertionCorrectionLines(group.head + 1, '    '))
        const correctionBody = correctionMembers
          .map((k) => built[k].correction as string)
          .join('\n\n')
        // même identifiant que le badge de l'énoncé (voir la construction de
        // `exo.with(...)` ci-dessus) : explicite (`ref`) pour un groupe d'un
        // seul exercice, sinon celui qu'exo() aurait généré lui-même
        const ref =
          group.members.length === 1 ? exercises[group.head].ref.trim() : ''
        const exerciseId = ref.length > 0 ? ref : `exo-${num}`
        renderLines.push('    #exo-solution-box(')
        renderLines.push(`      number: ${num},`)
        renderLines.push(`      exercise-id: ${typstString(exerciseId)},`)
        renderLines.push(`      show-id: ${options.showExerciseRefs},`)
        renderLines.push('      [')
        renderLines.push(indentContentBlock(indentContentBlock(correctionBody)))
        renderLines.push('      ],')
        renderLines.push('    )')
      })
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
export interface TypstBuildOptions {
  /**
   * Code destiné à être exporté/copié hors de l'appli (bouton de
   * téléchargement du .typ, modale d'édition) : sans les repères
   * `mathalea-anchor` (palette de mise en page) ni les marqueurs de
   * relecture (`harvestCarryOver`), colonnes et espacement des questions en
   * valeurs littérales plutôt qu'en variables `exN-colonnes`/`exN-gutter`.
   * Les réglages globaux (`titre`, `couleur`, `police-texte`...) restent en
   * revanche des `#let` : un professeur les modifie en un seul endroit.
   */
  exportMode?: boolean
  /**
   * URL complète (avec ses paramètres) permettant de régénérer cette fiche
   * à l'identique, inscrite en commentaire en tête du code. Omise si non
   * fournie (contexte sans URL, comme les tests).
   */
  sourceUrl?: string
  /**
   * Code Typst déclaré par le préambule d'une banque externe (`manifest.
   * preambule.typ`) dont un exercice figure dans la fiche : l'équivalent
   * d'un `preambule.tex`, pour ses propres fonctions/imports. Inséré juste
   * après les paquets fixes de MathALÉA, avant les réglages de la fiche.
   */
  extraPreamble?: string
}

export function buildTypstDocument(
  exercises: TypstExerciseInput[],
  options: TypstDocumentOptions = defaultTypstDocumentOptions,
  carryOver: TypstCarryOver = {},
  extraVersions: TypstExerciseInput[][] = [],
  { exportMode = false, sourceUrl, extraPreamble }: TypstBuildOptions = {},
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
    !exportMode,
    exportMode,
  )
  const extra = extraVersions.map((versionExercises, i) =>
    buildVersionContent(
      versionExercises,
      options,
      carryOver,
      figures,
      `v${i + 1}`,
      false,
      exportMode,
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
  const usesVarTable = allLines.some((line) => line.includes('#tabvar('))
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
  const usesCanTable = allLines.some((line) => line.includes('#can-tableau('))
  const usesCetz = allLines.some((line) => line.includes('cetz.'))
  const usesCetzPlotChart = allLines.some((line) => line.includes('chart.'))
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

  // page de garde : le même appel ouvre chaque sujet (le barème et le nombre
  // de questions sont ceux de la fiche, identiques d'une version à l'autre)
  const coverTemplate = options.coverPage?.template ?? 'aucune'
  const coverDeclarations =
    options.coverPage != null ? coverDeclarationLines(options.coverPage) : []
  const coverLines =
    options.coverPage != null
      ? coverPageLines(options.coverPage, countQuestions(exercises))
      : []

  const lines: string[] = []
  lines.push('// Fiche générée par MathALÉA — https://coopmaths.fr/alea')
  if (sourceUrl != null && sourceUrl !== '') {
    lines.push(`// Pour régénérer cette fiche : ${sourceUrl}`)
  }
  lines.push('')
  // en mode « Course aux nombres » il n'y a pas de titre d'exercice à
  // habiller : le paquet exercise-bank n'a rien à faire dans le document
  const usesExerciseBank = !options.mergeExercises && !options.canMode
  if (
    usesTasks ||
    usesExerciseBank ||
    options.autoVerticalSpacing ||
    usesVarTable ||
    usesCetz ||
    usesCetzPlotChart
  ) {
    lines.push('// ----- Paquets -----')
    if (usesExerciseBank) lines.push(EXERCISE_BANK_IMPORT)
    if (usesTasks) lines.push(TASKIZE_IMPORT)
    if (options.autoVerticalSpacing) lines.push(BREATHER_IMPORT)
    if (usesVarTable) lines.push(VARTABLE_IMPORT)
    if (usesCetz) lines.push(CETZ_IMPORT)
    if (usesCetzPlotChart) lines.push(CETZ_PLOT_CHART_IMPORT)
    lines.push('')
  }
  if (extraPreamble != null && extraPreamble.length > 0) {
    lines.push('// ----- Préambule d’une banque externe -----')
    lines.push(extraPreamble)
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
  if (usesCanTable) {
    lines.push('// ----- Tableau « Course aux nombres » -----')
    lines.push(MATHALEA_CAN_TABLE_HELPER)
    lines.push('')
  }
  // mathalea-fit (adaptation de la largeur des figures) est requis dès
  // qu'une figure est présente ; mathalea-figure l'utilise pour ses figures
  // à labels, il doit donc être défini avant.
  if (figures.length > 0) {
    lines.push('// ----- Figures : adaptation à la largeur et alignement -----')
    lines.push(MATHALEA_FIT_HELPER)
    lines.push('')
    // le repère `mathalea-anchor` de ce bloc (contrôle de zoom de la
    // palette) n'a pas de sens dans le code exporté, où il n'est jamais défini
    lines.push(
      exportMode
        ? stripAnchorCall(MATHALEA_FIGURE_BLOCK_HELPER)
        : MATHALEA_FIGURE_BLOCK_HELPER,
    )
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
  lines.push(
    `#let corrige = ${options.showCorrections} // afficher les corrections`,
  )
  lines.push(
    `#let couleur = ${options.badgeColor} // couleur des badges d'exercice et des titres`,
  )
  lines.push(`#let titre = ${typstString(options.title)}`)
  lines.push(`#let sous-titre = ${typstString(options.subtitle)}`)
  lines.push(`#let entete = ${typstString(options.headerLine)}`)
  lines.push(`#let pied-page = ${typstString(options.footerText)}`)
  lines.push(...coverDeclarations)
  lines.push(`#let police-texte = ${typstString(options.font)}`)
  lines.push(`#let police-maths = ${typstString(options.mathFont)}`)
  lines.push(`#let taille-texte = ${options.fontSize}pt`)
  if (usesQcm) {
    lines.push('#let qcm-colonnes = 2 // colonnes des propositions de QCM')
  }
  // réglage par défaut de "auto-fit" (colonnes/espacement littéraux du mode
  // export y compris) : nécessaire dès qu'un `#tasks(...)` est présent, pas
  // seulement quand des variables `exN-colonnes` sont déclarées ci-dessous
  if (usesTasks) {
    lines.push(
      '#tasks-setup(columns: "auto-fit", auto-fit-mode: "uniform", max-columns: 4)',
    )
  }
  // en mode export, chaque `#tasks(...)` porte déjà ses valeurs littérales
  // (voir `exerciseBody`) : `tasksPrefixes` est alors toujours vide, ces
  // variables de plomberie (propres à la palette de mise en page) n'ont pas
  // à être déclarées.
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
  lines.push(
    ...pageFooter(options.headerStyle, options.showFooter, exportMode).map(
      (line) => `  ${line}`,
    ),
  )
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
    if (usesQrCode) lines.push(`  qr-position: ${QRCODE_POSITION},`)

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
  // la page de garde suit les réglages (`couleur`) et précède l'en-tête :
  // ses aides sont déclarées ici, seulement quand un modèle est choisi
  if (coverTemplate !== 'aucune') {
    lines.push('// ----- Page de garde -----')
    lines.push(MATHALEA_COVER_FIELD_HELPER)
    if (coverTemplate === 'can') {
      lines.push(`#let mathalea-logo = ${MATHALEA_LOGO_IMAGE}`)
      lines.push(MATHALEA_COVER_CAN_HELPER)
    } else {
      lines.push(MATHALEA_COVER_HELPER)
    }
  }
  lines.push('')
  if (figures.length > 0) {
    lines.push('// ----- Figures (SVG embarqués) -----')
    for (const [index, figure] of figures.entries()) {
      const figNum = index + 1
      lines.push(`#let fig-${figNum} = ${figure}`)
      lines.push(
        `#let fig-${figNum}-zoom = ${carryOver.figureZoom?.[figNum] ?? 1}`,
      )
      lines.push(
        `#let fig-${figNum}-align = ${carryOver.figureAlign?.[figNum] ?? 'center'}`,
      )
    }
    lines.push('')
  }
  // exercices statiques sans source .typ/_cor.typ (énoncé/correction juste
  // une image scannée) : une variable de zoom par énoncé/correction
  // concerné, ajustable dans la palette de l'aperçu (voir `htmlToTypst`,
  // branché dessus via `exercise.isStaticImage`/`isStaticCorrectionImage`)
  const staticImageExerciseNums = exercises
    .map((exercise, k) => (exercise.isStaticImage ? k + 1 : null))
    .filter((num): num is number => num != null)
  const staticCorrectionImageExerciseNums = exercises
    .map((exercise, k) => (exercise.isStaticCorrectionImage ? k + 1 : null))
    .filter((num): num is number => num != null)
  if (
    staticImageExerciseNums.length > 0 ||
    staticCorrectionImageExerciseNums.length > 0
  ) {
    lines.push('// ----- Zoom des exercices statiques (image seule) -----')
    for (const num of staticImageExerciseNums) {
      lines.push(`#let exo-${num}-zoom = ${carryOver.exerciseZoom?.[num] ?? 1}`)
    }
    for (const num of staticCorrectionImageExerciseNums) {
      lines.push(
        `#let exo-${num}-corr-zoom = ${carryOver.exerciseCorrectionZoom?.[num] ?? 1}`,
      )
    }
    lines.push('')
  }
  lines.push(...bankLines)
  lines.push('')
  if (coverLines.length > 0) {
    // repère du bloc de couverture : la palette de l'aperçu propose d'y
    // modifier titre, session, matière, durée et consignes (sans objet en
    // mode export) ; un seul repère suffit, les sujets suivants affichent la
    // même page de garde (voir la boucle des versions plus bas)
    if (!exportMode) lines.push('#mathalea-anchor("cover", 0)')
    lines.push(...coverLines)
    lines.push('')
  }
  lines.push('// ----- En-tête -----')
  // repère du bloc de titre : la palette de l'aperçu propose d'y modifier
  // les variables titre, sous-titre et entete (sans objet en mode export, ni
  // quand l'habillage « aucun » n'affiche justement aucun bloc à ce repère)
  if (!exportMode && options.headerStyle !== 'aucun') {
    lines.push('#mathalea-anchor("header", 0)')
  }
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
    if (usesExerciseBank) lines.push('#exo-counter.update(0)')
    lines.push('')
    if (coverLines.length > 0) {
      lines.push(...coverLines)
      lines.push('')
    }
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
 * Littéral tableau Typst. Un tableau d'un seul élément exige une virgule
 * finale (`("a",)`), sans quoi Typst n'y voit qu'une expression parenthésée.
 */
function typstArray(items: string[]): string {
  if (items.length === 0) return '()'
  if (items.length === 1) return `(${items[0]},)`
  return `(${items.join(', ')})`
}

/**
 * Nombre de questions de la fiche, pour la case « Score : ... / n » de la
 * page de garde « Course aux nombres » (mêmes énoncés que ceux du tableau).
 */
function countQuestions(exercises: TypstExerciseInput[]): number {
  return exercises.reduce(
    (total, exercise) =>
      total + (exercise.canQuestions ?? exercise.questions).length,
    0,
  )
}

/**
 * Déclare les textes de la page de garde en variables (`#let couverture-titre
 * = ...`), comme `titre`/`sous-titre`/`entete` pour l'en-tête de la fiche :
 * `coverPageLines` y renvoie plutôt que d'inscrire les valeurs en dur, ce qui
 * permet à la palette de l'aperçu de les modifier par des éditions ciblées
 * (voir `#mathalea-anchor("cover", 0)` dans `buildTypstDocument`), sans
 * régénérer tout le document. Toujours émises quand un modèle est choisi,
 * même les variables inutilisées par ce modèle (`couverture-session` et
 * `couverture-matiere` pour « can », `couverture-note-fin` pour
 * « évaluation ») : une variable Typst non lue ne produit ni erreur ni
 * avertissement, et les garder simplifie la palette (mêmes variables quel
 * que soit le modèle).
 */
function coverDeclarationLines(cover: TypstCoverOptions): string[] {
  if (cover.template === 'aucune') return []
  const consignes = typstArray(
    cover.consignes
      .filter((consigne) => consigne.trim() !== '')
      .map(typstString),
  )
  return [
    `#let couverture-titre = ${typstString(cover.titre)}`,
    `#let couverture-session = ${typstString(cover.session)}`,
    `#let couverture-matiere = ${typstString(cover.matiere)}`,
    `#let couverture-duree = ${typstString(cover.duree)}`,
    `#let couverture-consignes = ${consignes}`,
    `#let couverture-note-fin = ${typstString(cover.noteFin)}`,
  ]
}

/**
 * Appel de la page de garde : les textes (`couverture-titre`...) réfèrent aux
 * variables déclarées par `coverDeclarationLines`, éditables sur l'aperçu.
 * Seul le barème reste inscrit en dur (réglé dans le volet, pas sur l'aperçu).
 */
function coverPageLines(
  cover: TypstCoverOptions,
  nbQuestions: number,
): string[] {
  if (cover.template === 'aucune') return []
  if (cover.template === 'can') {
    return [
      '#mathalea-couverture-can(',
      '  duree: couverture-duree,',
      `  nb-questions: ${nbQuestions},`,
      '  consignes: couverture-consignes,',
      ')',
    ]
  }
  const layout = COVER_TEMPLATE_LAYOUT[cover.template]
  const bareme = cover.showBareme
    ? typstArray(cover.bareme.map((points) => String(points)))
    : '()'
  const lines = [
    '#mathalea-couverture(',
    '  titre: couverture-titre,',
    '  session: couverture-session,',
    '  matiere: couverture-matiere,',
    '  duree: couverture-duree,',
    '  consignes: couverture-consignes,',
    `  bareme: ${bareme},`,
  ]
  if (layout.identite) lines.push('  identite: true,')
  if (layout.colonneNote) lines.push('  colonne-note: true,')
  if (layout.hasNoteFin) lines.push('  note-fin: couverture-note-fin,')
  lines.push(')')
  return lines
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
  // aucun bloc de titre : la fiche commence directement par les exercices.
  // Avec plusieurs versions, l'étiquette « Sujet A/B... » n'a alors nulle
  // part où s'afficher — c'est un compromis accepté du réglage.
  if (style === 'aucun') return []
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
 * Pied de page (texte éditable `pied-page`, pagination, titre) selon
 * l'habillage. Renvoie l'argument `footer: ...` du `#set page(...)` —
 * `footer: none,` quand `showFooter` est décoché, quel que soit l'habillage.
 *
 * Repère d'édition : `here().page()` (numéro de page **physique**, à la
 * différence de `counter(page)` que les sujets suivants remettent à 1) limite
 * l'icône à la toute première page du document, comme le titre et la page de
 * garde (un seul point d'édition, même si le pied de page, lui, se répète
 * sur chaque page).
 */
function pageFooter(
  style: HeaderStyle,
  showFooter: boolean,
  exportMode: boolean,
): string[] {
  if (!showFooter) return ['footer: none,']
  const pagination = '#counter(page).display("1 / 1", both: true)'
  const anchorLines = exportMode
    ? []
    : ['  #if here().page() == 1 [#mathalea-anchor("footer", 0)]']
  if (style === 'cadre') {
    return [
      'footer: context [',
      ...anchorLines,
      '  #set text(size: 8pt, style: "italic")',
      '  #line(length: 100%, stroke: 0.4pt)',
      '  #v(-2pt)',
      '  #grid(columns: (1fr, auto, 1fr),',
      '    align(left)[#pied-page],',
      `    align(center)[${pagination}],`,
      '    align(right)[#if sous-titre != "" { sous-titre } else { titre }],',
      '  )',
      '],',
    ]
  }
  if (style === 'cartouche') {
    return [
      'footer: context [',
      ...anchorLines,
      '  #set text(size: 8pt, fill: couleur)',
      '  #line(length: 100%, stroke: 0.6pt + couleur.lighten(30%))',
      '  #v(-2pt)',
      '  #grid(columns: (1fr, auto, 1fr),',
      '    align(left)[#pied-page],',
      `    align(center)[${pagination}],`,
      '    align(right)[#emph(titre)],',
      '  )',
      '],',
    ]
  }
  return [
    'footer: context [',
    ...anchorLines,
    '  #set text(size: 8pt, fill: gray)',
    '  #line(length: 100%, stroke: 0.4pt + gray.lighten(30%))',
    '  #v(-2pt)',
    '  #grid(columns: (1fr, auto, 1fr),',
    '    align(left)[#pied-page],',
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
