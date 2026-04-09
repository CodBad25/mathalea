import PavagesEtTransformations from '../6e/_Pavages_et_transformations'
export const titre = "Trouver le symétrique d'une figure dans un pavage"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * Exercice en html seulement. Symétrie centrale dans un pavage.
 * @author Jean-claude Lhote

 */
export const uuid = '261bf'

export const refs = {
  'fr-fr': ['5G12-1'],
  'fr-ch': ['9ES6-22'],
}
export default class PavagesEtDemiTour extends PavagesEtTransformations {
  constructor() {
    super()
    this.level = 5
    this.besoinFormulaireNumerique = false
  }
}
