import Transformations from '../6e/_Transformations'
export const titre =
  "Trouver l'image d'un point par une symétrie axiale ou centrale ou par une translation"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * Transformations : trouver un point numéroté par une des transformations sauf rotation et homothetie
 * @author Jean-claude Lhote

 * Pas de version LaTeX
 */
export const uuid = 'cf7ce'

export const refs = {
  'fr-fr': ['4G10'],
  'fr-ch': ['10ES2-1'],
}
export default class Transformations4e extends Transformations {
  constructor() {
    super()
    this.sup = '4-7-8'
  }
}
