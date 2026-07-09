import EcrireUneExpressionNumerique from './_Ecrire_une_expression_numerique'
export const titre = 'Traduire une phrase par une expression'
export const dateDeModifImportante = '21/09/2023'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCOpen'
export const uuid = '9d15d'
export const refs = {
  'fr-fr': ['5N1F'],
  'fr-2016': ['5C11'],
  'fr-ch': ['9NO4-20'],
}
export default class TraduireUnePhraseParUneExpression extends EcrireUneExpressionNumerique {
  constructor() {
    super()
    this.version = 1
    this.litteral = false
    this.sup2 = false
    this.nbQuestions = 5
    this.sup4 = '1-2-3'
  }
}
