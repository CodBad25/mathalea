import ConstruireParSymetrie from '../6e/_Construire_par_symetrie'
export const titre = "Construire le symétrique d'un point par symétrie centrale"
export const interactifReady = false
export const amcReady = true
export const amcType = 'AMCOpen'
export const dateDeModifImportante = '14/11/2021'
/**
 * @author Jean-claude Lhote
 */
export const uuid = '8d4bf'

export const refs = {
  'fr-fr': ['5G11-1'],
  'fr-ch': ['9ES6-5'],
}
export default class SymetrieCentralePoint extends ConstruireParSymetrie {
  constructor() {
    super()
    this.figure = false
    this.version = 5
    this.besoinFormulaireNumerique = false
    this.besoinFormulaire3Texte = false
  }
}
