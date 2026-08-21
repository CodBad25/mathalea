import type { IExercice } from '../../../lib/types'

/** Mode d'affichage de la correction d'une carte TBI */
export type TbiCorrectionMode =
  | 'hidden'
  | 'below'
  | 'perQuestion'
  | 'replace'
  | 'modal'

/**
 * Niveau de détail de la correction affichée dans une carte TBI :
 * la correction entière, ou réduite à ses réponses mises en évidence
 * (même réglage que « Correction minimale » de la vue Typst).
 */
export type TbiCorrectionDetail = 'full' | 'minimal'

/**
 * Un exercice affiché dans la vue TBI.
 * exercise est null pour les exercices non pris en charge (statiques, svelte).
 */
export interface TbiItem {
  exercise: IExercice | null
  paramsIndex: number
  uuid: string
  id: string
  /** Identité stable de l'item (clé de rendu, survit aux réordonnancements) */
  key: number
}
