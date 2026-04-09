import Transformations from '../../6e/_Transformations'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const titre = 'Trouver le symétrique d’un point'

/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '135d4'

export const refs = {
  'fr-fr': ['can6G01', '6G7B-flash1'],
  'fr-ch': ['NR'],
}
export default class SymetriqueD1Point extends Transformations {
  constructor() {
    super()
    this.sup = 1
    this.can = true
  }
}
