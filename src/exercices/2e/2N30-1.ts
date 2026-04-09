import Exercice from '../6e/auto6N2B-6'
export const titre =
  "Décomposer une fraction (partie entière + fraction inférieure à 1) puis donner l'écriture décimale"
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDeModifImportante = '23/09/2025' // Réparation de l'interactivité par Éric Elter
/**
 * Clone de 6N20-2 pour les 2nde
 */
export const uuid = '45726'

export const refs = {
  'fr-fr': ['2N30-1'],
  'fr-ch': ['NR'],
}

export default class ExerciceFractionsDifferentesEcritures extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
  }
}
