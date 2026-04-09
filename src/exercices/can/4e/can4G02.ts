import Transformations from '../../6e/_Transformations'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const titre = 'Trouver l’image d’un point par une transformation'
export const dateDeModifImportante = '11/04/2025'
export const dateDePublication = '01/08/2021'

/**
 * @author Jean-claude Lhote
 */
export const uuid = 'a77ed'

export const refs = {
  'fr-fr': ['can4G02'],
  'fr-ch': [],
}
export default class SymetriqueD1Point extends Transformations {
  constructor() {
    super()
    this.can = true
    this.sup = 3
  }
}
