import PavagesEtTransformations from './_Pavages_et_transformations'

export const titre =
  "Trouver l'image d'une figure par une symétrie axiale dans un pavage carré"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDeModifImportante = '15/01/2023' //  Par EE

/**
 * Exercice en html seulement. Symétrie axiale dans un pavage.
 * @author Jean-claude Lhote
 * Relecture : Novembre 2021 par EE
 */
export const uuid = 'f5569'

export const refs = {
  'fr-fr': ['6G7B-6'],
  'fr-2016': ['6G25-2'],
  'fr-ch': ['9ES6-19'],
}
export default class PavagesEtSymetries extends PavagesEtTransformations {
  constructor() {
    super()
    this.level = 6
    this.besoinFormulaireNumerique = false
  }
}
