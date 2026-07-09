import EcrireUneExpressionNumerique from './_Ecrire_une_expression_numerique'
export const titre = 'Traduire une phrase par une expression et la calculer'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDeModifImportante = '21/09/2023'
export const uuid = '2c600'
export const refs = {
  'fr-fr': ['5N5B-4'],
  'fr-2016': ['5L14-5'],
  'fr-ch': ['10FA1-7'],
}
export default class TraduireUnePhraseParUneExpressionLitteraleEtCalculer extends EcrireUneExpressionNumerique {
  constructor() {
    super()
    this.version = 3
    this.litteral = true
    this.sup4 = '1-2-3'
  }
}
