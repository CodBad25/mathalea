/**
 * Une « unité » est le plus petit bloc de contenu que la pagination A4
 * peut déplacer d'une colonne ou d'une page à l'autre :
 * titre d'exercice, consigne ou question.
 */
export interface A4UnitData {
  /** Identifiant stable pour le rendu Svelte keyed */
  id: string
  /** Indice de l'exercice dans le store exercicesParams */
  exerciseIndex: number
  kind: 'title' | 'intro' | 'question' | 'warning' | 'textblock'
  html: string
  /** Style inline complémentaire (interligne propre à l'exercice...) */
  style?: string
  /** Facteur de zoom appliqué aux figures SVG de l'unité */
  svgZoom?: number
  /**
   * Source éditable de l'unité (sans la numérotation) : le HTML avec les
   * formules en `$...$`. Présent uniquement pour les unités modifiables
   * (questions et consignes).
   */
  source?: string
}

/** Réglages propres à la vue A4 pour un exercice donné */
export interface A4ExerciseOverrides {
  /** Zoom des figures SVG (1 par défaut) */
  svgZoom?: number
  /** Facteur d'espacement entre les questions (le réglage global par défaut) */
  spacing?: number
  /**
   * Référence affichée à côté de la numérotation (ex : « 6C10 »).
   * undefined = référence du référentiel ; chaîne vide = référence effacée.
   */
  ref?: string
}

export interface A4Options {
  columns: number
  fontSizePt: number
  /** Police du document : celle de l'app, Verdana ou OpenDyslexic */
  fontFamily: 'default' | 'verdana' | 'opendyslexic'
  /** Format de page */
  pageFormat: 'A4' | 'A5'
  /** Orientation de la page */
  orientation: 'portrait' | 'landscape'
  /** Marge horizontale (gauche/droite) */
  marginHMm: number
  /** Marge verticale (haut/bas) */
  marginVMm: number
  showHeader: boolean
  showExerciseTitles: boolean
  /** Affiche la référence du référentiel à côté de la numérotation */
  showExerciseRefs: boolean
  /** Affiche le pied de page (numérotation des pages) */
  showFooter: boolean
  /** Libellé de la numérotation : « Exercice 1 », « Question 1 »... */
  exerciseLabel: string
  /**
   * Fusionne tous les exercices en un seul : les questions sont numérotées
   * à la suite (le numéro ne se réinitialise pas à chaque exercice)
   */
  mergeExercises: boolean
  /** Ajoute les pages de corrigé (numérotées à part) */
  showCorrection: boolean
  /** Nombre de versions du sujet (données aléatoires différentes) */
  nbVersions: number
  /** Facteur d'espacement global entre les questions (1 par défaut) */
  questionSpacing: number
  /** Facteur d'espacement entre les exercices (1 par défaut) */
  exerciseSpacing: number
  /** Double l'espacement entre les mots (aide à la lecture) */
  doubleWordSpacing: boolean
  /** Niveau de zoom (en %) utilisé quand zoomMode vaut 'fixed' */
  zoom: number
  /** 'fixed' : zoom manuel ; 'width'/'page' : zoom recalculé pour adapter la page à l'espace disponible */
  zoomMode: 'fixed' | 'width' | 'page'
}

export const defaultA4Options: A4Options = {
  columns: 2,
  fontSizePt: 11,
  fontFamily: 'default',
  pageFormat: 'A4',
  orientation: 'portrait',
  marginHMm: 12,
  marginVMm: 12,
  showHeader: true,
  showExerciseTitles: true,
  showExerciseRefs: false,
  showFooter: true,
  exerciseLabel: 'Exercice',
  mergeExercises: false,
  showCorrection: false,
  nbVersions: 1,
  questionSpacing: 1,
  exerciseSpacing: 1,
  doubleWordSpacing: false,
  zoom: 100,
  zoomMode: 'fixed',
}

/**
 * Une section est un ensemble de pages avec sa propre numérotation
 * (recommençant à 1) : le sujet d'une version, ou son corrigé.
 */
export interface A4Section {
  kind: 'subject' | 'correction'
  /** Indice de la version (0 = Sujet A) */
  version: number
  units: A4UnitData[]
  /** pages → colonnes → unités (rempli après mesure et pagination) */
  pages: A4UnitData[][][]
  /** id de la première unité de chaque exercice (sauts de colonne, menu +) */
  firstUnitIds: Record<number, string>
  /** id de la dernière unité de chaque exercice */
  lastUnitIds: Record<number, string>
}
