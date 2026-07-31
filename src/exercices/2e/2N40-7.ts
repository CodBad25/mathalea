import MultipleDistributivite from '../3e/3L11-3b'

export const titre = 'Additionner des expressions à développer'

export const interactifReady = true
export const interactifType = 'mathLive'

// Gestion de la date de publication initiale
export const dateDePublication = '20/02/2025'
/**
 * Clone de 3L11-1b pour les secondes
 *
 * @author Gilles Mora
 */
export const uuid = '80c0e'

export const refs = {
  'fr-fr': ['2N40-7', 'BP1AUTO073'],
  'fr-ch': ['1mCL1-3', '11FA2-18'],
}
export default class MultipleDistributiviteSeconde extends MultipleDistributivite {
  constructor() {
    super()
    this.sup = 4
    this.sup2 = 4
    this.sup3 = 3
  }
}
