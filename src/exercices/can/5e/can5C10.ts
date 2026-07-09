import ExerciceDecomposerEnFacteursPremiers from '../../5e/5N1L-4'
export const interactifReady = true
export const interactifType = 'mathLive'
export const titre = 'Décomposer en produit de facteurs premiers'
export const uuid = '1b91d'
export const refs = {
  'fr-fr': ['can5C10', '5N1L-flash1'],
  'fr-ch': ['NR'],
}
export default class DecomposerFacteursPremierSimple extends ExerciceDecomposerEnFacteursPremiers {
  constructor() {
    super()
    this.nbQuestions = 1
    this.sup2 = false
    this.sup = 1

    this.consigne = 'Décomposer en produit de facteurs premiers :'
  }
}
