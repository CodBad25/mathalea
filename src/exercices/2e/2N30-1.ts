import ExerciceFractionsDecomposer from '../5e/auto5N3G'
export const titre =
  "Décomposer une fraction (partie entière + fraction inférieure à 1) puis donner l'écriture décimale"
export const interactifReady = true

export const dateDeModifImportante = '23/09/2025' // Réparation de l'interactivité par Éric Elter
/**
 * Clone de 6N20-2 pour les 2nde
 */
export const uuid = '45726'

export const refs = {
  'fr-fr': ['2N30-1'],
  'fr-ch': ['NR'],
}

export default class ExerciceFractionsDifferentesEcritures extends ExerciceFractionsDecomposer {
  constructor() {
    super()
    this.nbQuestions = 2
  }
}
