import ExoRose from '../6e/_Roses'
export const titre = 'Résoudre une Rose multiplicative avec des fractions'
export const interactifReady = true
export const interactifType = 'custom'
export const amcReady = true
export const amcType = 'AMCOpen'
export const dateDePublication = '12/08/2022'

/**
 * Travailler les multiplications de fractions
 * @author Jean-claude Lhote
 */

export const uuid = '4713e'

export const refs = {
  'fr-fr': ['4C22-4', 'BP2AutoH16'],
  'fr-ch': ['10NO5-9'],
}
export default class RoseAdditive4F extends ExoRose {
  // c'est l'ExoRose zéro contenu dans _Roses.js
  constructor() {
    super()
    this.operation = 'multiplication'
    this.typeDonnees = 'fractions positives'
    this.besoinFormulaire2Numerique = ['Nombre de facteurs (entre 3 et 5)', 5]
  }
}
