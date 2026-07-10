import ÉcrireUneExpressionLitterale from '../5e/5N5A'
export const interactifReady = true
export const interactifType = 'qcm'
export const titre = 'Écrire une expression littérale'
export const dateDePublication = '29/11/2025'
export const uuid = '95789'
export const refs = {
  'fr-fr': ['3AutoN10-1'],
  'fr-ch': [],
}
export default class ÉcrireUneExpressionLitteraleAuto3eme extends ÉcrireUneExpressionLitterale {
  constructor() {
    super()
    this.nbQuestions = 1
    this.sup2 = '1-2-3-5-6-7'
    this.besoinFormulaireCaseACocher = false
    this.sup = true
  }
}
