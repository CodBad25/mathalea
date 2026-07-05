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
  /** Facteur d'espacement entre les questions (1 par défaut) */
  spacing?: number
}

export interface A4Options {
  columns: number
  fontSizePt: number
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
  /** Affiche le pied de page (numérotation des pages) */
  showFooter: boolean
  /** Libellé des titres : « Exercice 1 », « Question 1 »... */
  exerciseLabel: string
  /** Ajoute les pages de corrigé (numérotées à part) */
  showCorrection: boolean
  /** Nombre de versions du sujet (données aléatoires différentes) */
  nbVersions: number
  /** Niveau de zoom (en %) utilisé quand zoomMode vaut 'fixed' */
  zoom: number
  /** 'fixed' : zoom manuel ; 'width'/'page' : zoom recalculé pour adapter la page à l'espace disponible */
  zoomMode: 'fixed' | 'width' | 'page'
}

export const defaultA4Options: A4Options = {
  columns: 2,
  fontSizePt: 11,
  pageFormat: 'A4',
  orientation: 'portrait',
  marginHMm: 12,
  marginVMm: 12,
  showHeader: true,
  showExerciseTitles: true,
  showFooter: true,
  exerciseLabel: 'Exercice',
  showCorrection: false,
  nbVersions: 1,
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
