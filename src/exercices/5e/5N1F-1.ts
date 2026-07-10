import EcrireUneExpressionNumerique from './_Ecrire_une_expression_numerique'
export const titre = 'Traduire une expression par une phrase'
export const amcReady = true
export const amcType = 'AMCOpen'
export const interactifReady = true
export const interactifType = 'listeDeroulante'
export const dateDeModifImportante = '21/09/2023'
export const uuid = 'baa4b'
export const refs = {
  'fr-fr': ['5N1F-1'],
  'fr-2016': ['5C11-1'],
  'fr-ch': ['9NO4-21'],
}
export default class TraduireUneExpressionParUnePhrase extends EcrireUneExpressionNumerique {
  constructor() {
    super()
    this.version = 2
    this.litteral = false
    this.nbQuestions = 5
    this.sup4 = '1-2-3'
  }
}
