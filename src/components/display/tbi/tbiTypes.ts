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
 * Contenu d'une ressource statique (annale scannée, banque externe) affichée
 * dans la vue TBI comme de simples images, faute d'énoncé rejouable.
 */
export interface TbiStaticContent {
  /** Images de l'énoncé (une seule le plus souvent) */
  png: string[]
  /** Images de la correction, éventuellement vide */
  pngCor: string[]
  /** Titre lisible de la ressource (ex. « DNB juin 2023 Métropole Ex 3 ») */
  title: string
}

/**
 * Un exercice affiché dans la vue TBI.
 * - `exercise` porte l'énoncé rejouable des exercices dynamiques.
 * - `staticContent` porte les images d'une ressource statique.
 * - les deux sont `null` pour une ressource réellement non prise en charge
 *   (exercice svelte, uuid statique introuvable).
 */
export interface TbiItem {
  exercise: IExercice | null
  staticContent: TbiStaticContent | null
  paramsIndex: number
  uuid: string
  id: string
  /** Identité stable de l'item (clé de rendu, survit aux réordonnancements) */
  key: number
}
