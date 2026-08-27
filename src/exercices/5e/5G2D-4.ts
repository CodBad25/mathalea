import ExerciceConversionsParametrable from '../6e/_Exercice_conversions_parametrable'

export const titre =
  'Convertir des longueurs, masses, capacités, prix ou unités informatiques'
export const dateDePublication = '31/07/2026'
export const interactifReady = true

export const amcReady = true
export const amcType = 'AMCNum'

/**
 * Reprend l'exercice 5G2D-4 (devenu `5G2D-4-old.ts`) avec un paramétrage plus souple :
 * l'enseignant choisit les unités et leur poids d'apparition, le type d'opérations,
 * la présence de nombres décimaux et l'usage de fractions dans la correction.
 *
 * @author Rémi Angot
 */
export const uuid = '504ae'

export const refs = {
  'fr-fr': ['5G2D-4', 'BP2AutoQ2', '3AutoM02'],
  'fr-ch': ['9GM3B-1'],
}

export default class ConvertirDesUnites extends ExerciceConversionsParametrable {
  constructor() {
    super()
    this.nbQuestions = 5
  }
}
