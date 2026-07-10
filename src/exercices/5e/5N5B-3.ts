import EcrireUneExpressionNumerique from './_Ecrire_une_expression_numerique'
export const titre =
  'Calculer une expression littérale complexe pour les valeurs données en détaillant les calculs'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDeModifImportante = '21/09/2023'
export const uuid = '1abc6'
export const refs = {
  'fr-fr': ['5N5B-3'],
  'fr-2016': ['5L14-3'],
  'fr-ch': ['10FA1-3', '11FA1-5'],
}
export default class CalculerUneExpressionLitterale extends EcrireUneExpressionNumerique {
  constructor() {
    super()
    this.version = 4
    this.litteral = true
    this.sup4 = '2-3-4-5'
  }
}
