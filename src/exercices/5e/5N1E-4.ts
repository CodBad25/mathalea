import EcrireUneExpressionNumerique from './_Ecrire_une_expression_numerique'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const titre = 'Traduire une phrase par une expression et la calculer'
export const dateDeModifImportante = '21/09/2023'
export const uuid = 'cd0d8'
export const refs = {
  'fr-fr': ['5N1E-4'],
  'fr-2016': ['5C12-1'],
  'fr-ch': ['9NO6-4'],
}
export default class TraduireUnePhraseParUneExpressionEtCalculer extends EcrireUneExpressionNumerique {
  constructor() {
    super()
    this.version = 3
    this.sup3 = true
    this.litteral = false
    this.sup4 = 6
    this.besoinFormulaire2CaseACocher = [
      'Utilisation de décimaux (pas de calcul mental)',
      false,
    ]
    this.besoinFormulaire3CaseACocher = ['Présence du signe "fois"', true]
  }
}
