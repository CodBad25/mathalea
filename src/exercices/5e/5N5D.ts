import EcrireUneExpressionNumerique from './_Ecrire_une_expression_numerique'
export const titre = 'Traduire une expression par une phrase'
export const amcReady = true
export const amcType = 'AMCOpen'
export const interactifReady = true
export const interactifType = 'listeDeroulante'
export const dateDeModifImportante = '21/09/2023'
export const uuid = '458ae'
export const refs = {
  'fr-fr': ['5N5D'],
  'fr-2016': ['5L10-3'],
  'fr-ch': ['9FA2-6', '10FA1-6'],
}
export default class TraduireUneExpressionLitteraleParUnePhrase extends EcrireUneExpressionNumerique {
  constructor() {
    super()
    this.version = 2
    this.litteral = true
    this.sup4 = '2-3'
  }
}
