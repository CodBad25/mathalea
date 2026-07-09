import ExerciceDecomposerEnFacteursPremiers from '../5e/5N1L-4'
export const titre =
  'Décomposer un nombre entier en produit de (petits) facteurs premiers'
export const dateDeModifImportante = '02/11/2021'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCOpen'
export const uuid = '1eaf7'
export const refs = {
  'fr-fr': ['4A11-0'],
  'fr-ch': ['9NO4-16'],
}
export default class ExerciceDecomposerEnFacteursPremiers4e extends ExerciceDecomposerEnFacteursPremiers {
  constructor() {
    super()
    this.nbQuestions = 4
    this.sup = 3 // 5 facteurs par défaut
    this.sup2 = true // une multiplication par 100 une fois sur quatre
    this.besoinFormulaire4CaseACocher = [
      'Décomposition avec des puissances',
      false,
    ]
  }
}
