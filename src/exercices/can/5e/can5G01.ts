import Transformations from '../../6e/_Transformations'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const titre = 'Trouver le symétrique d’un point 5e'

/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '6314c'

export const refs = {
  'fr-fr': ['can5G01'],
  'fr-ch': [],
}
export default class SymetriqueD1Point extends Transformations {
  constructor() {
    super()
    this.sup = 2
    this.can = true
  }
}
