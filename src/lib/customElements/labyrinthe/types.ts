/**
 * Types du modèle, du moteur de rendu et du snapshot pour le composant Labyrinthe.
 * L'objectif est de séparer strictement la logique métier (modèle) du rendu (DOM),
 * au moyen d'un snapshot immuable échangé entre ces deux couches.
 * Ce fichier ne contient que des définitions de types et d'interfaces (aucune logique d'exécution).
 */

/**
 * Orientation globale du chemin à générer.
 */
export type Orientation = 'horizontal' | 'vertical'

/**
 * Coordonnées d'une cellule (ligne/colonne, indexées à partir de 0).
 */
export interface Coords {
  row: number
  col: number
}

/**
 * État d'une cellule tel qu'utilisé par le modèle et transmis au renderer.
 * - isGood: appartient au bon chemin
 * - clicked: a été cliquée par l'utilisateur
 * - text: contenu textuel/LaTeX à afficher (optionnel si non encore fourni)
 */
export interface CellState {
  isGood: boolean
  clicked: boolean
  text?: string
}

/**
 * Grille de cellules.
 */
export type CellGrid = CellState[][]

/**
 * Représentation sérialisée de l'état utilisateur.
 * Exemple actuel: "r-c|r-c|..." (p. ex. "0-1|2-3").
 * Cette représentation est interne et peut évoluer.
 */
export type SerializedState = string

/**
 * Données complètes et immuables décrivant l'état du jeu et de la grille.
 * Le renderer consomme uniquement ce snapshot pour produire le DOM.
 */
export interface GameSnapshot {
  seed: string | null
  orientation: Orientation
  rows: number
  cols: number
  start: Coords
  end: Coords
  grid: CellGrid

  // État de partie
  win: boolean
  gameOver: boolean
  correctClicks: number
  badAnswers: number
}

/**
 * Détail de l'événement de fin de partie émis par le Custom Element.
 */
export interface GameEndDetail {
  win: boolean
  correctClicks: number
  totalGood: number
  totalBad: number
  state: SerializedState
}

/**
 * Options de configuration du modèle.
 */
export interface ModelConfig {
  seed?: string | null
  orientation?: Orientation
  rows?: number
  cols?: number
  width?: number | null
  height?: number | null
}

/**
 * Interface du moteur de rendu mathématique (ex: KaTeX, MathLive, ...).
 * Le renderer DOM peut déléguer la composition mathématique via cette interface.
 */
export interface LatexOptions {
  correction?: boolean
  align?: 'c' | 'l' | 'r'
  borders?: boolean
  rowSeparators?: boolean
}

export interface MathRenderer {
  typeset(root: Element | ShadowRoot): void
}

/**
 * Interface du renderer DOM (sans logique métier).
 * Il ne fait que projeter un snapshot dans le Shadow DOM.
 */
export interface LabyrintheRenderer {
  /**
   * Construit/Met à jour la vue en fonction du snapshot.
   * @param width Largeur optionnelle d'une cellule en em
   * @param height Hauteur optionnelle d'une cellule en em
   */
  render(root: ShadowRoot, snapshot: GameSnapshot, width?: number | null, height?: number | null): void

  /**
   * Affiche la correction visuelle (met en évidence toutes les bonnes cases).
   */
  showCorrection(root: ShadowRoot, snapshot: GameSnapshot): void

  /**
   * Active/Désactive l'interaction visuelle (accessibilité, pointeurs, etc.).
   */
  setDisabled(root: ShadowRoot, disabled: boolean): void
}

/**
 * Interface du modèle (logique métier pure, sans DOM).
 * Il gère la génération du chemin, l'état de jeu, la sérialisation et le contenu.
 */
export interface LabyrintheModel {
  /**
   * Met à jour la configuration (seed, orientation, dimensions, ...).
   */
  configure(opts: ModelConfig): void

  /**
   * Régénère une nouvelle grille/chemin selon la configuration courante.
   * Remet à zéro l'état de partie (clics, victoire/défaite).
   */
  regenerate(): void

  /**
   * Enregistre les bonnes et mauvaises valeurs qui seront distribuées dans la grille.
   * Le modèle associe ces valeurs aux cellules selon le masque du chemin.
   */
  setValues(good: string[], bad: string[]): void

  /**
   * Applique le clic utilisateur sur une cellule.
   */
  clickCell(row: number, col: number): void

  /**
   * Expose un snapshot immuable de l'état courant.
   */
  snapshot(): GameSnapshot

  /**
   * Sérialise l'état utilisateur (au format interne).
   */
  serializeState(): SerializedState

  /**
   * Restaure l'état utilisateur depuis une chaîne sérialisée.
   */
  restoreState(state: SerializedState): void

  /**
   * Métriques utiles (dérivables mais souvent demandées).
   */
  numberOfGoodAnswers(): number
  numberOfIncorrectAnswers(): number

  // LaTeX export helpers
  generateLatex(options?: LatexOptions): string
  generateLatexCorrection(options?: Omit<LatexOptions, 'correction'>): string

  // Deterministic random number generation (uses seeded RNG if available)
  randomInt(min: number, max: number): number
  random(): number
}
