import PavagesEtTransformations from '../6e/_Pavages_et_transformations'

export const titre =
  "Trouver l'image d'une figure par une translation dans un pavage"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * Exercice en html seulement. Translations dans un pavage.
 * @author Jean-claude Lhote

 */
export const uuid = '48253'

export const refs = {
  'fr-fr': ['4G11-1'],
  'fr-ch': ['10ES2-10'],
}
export default class PavagesEtTranslation extends PavagesEtTransformations {
  constructor() {
    super()
    this.level = 4
    this.besoinFormulaireNumerique = false
  }
}
