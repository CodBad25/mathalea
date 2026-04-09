import Transformations from './_Transformations'
export const titre = "Trouver l'image d'un point par une symétrie axiale"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * Transformations : trouvers un point numéroté par une des transformations du plan. Fonction générale utilisée sur tous les niveaux
 * @author Jean-claude Lhote

 * Pas de version LaTeX
 * Relecture : Novembre 2021 par EE
 */
export const uuid = 'e9d29'

export const refs = {
  'fr-fr': ['6G7B'],
  'fr-2016': ['6G24'],
  'fr-ch': ['9ES6-1'],
}
export default class Transformations6e extends Transformations {
  constructor() {
    super()
    this.sup = 1
  }
}
