import TauxCoeff from '../can/2e/can2C10'
export const titre = 'Passer du taux d’évolution au coefficient multiplicateur'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can5P11 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '6ffd3'

export const refs = {
  'fr-fr': ['1A-E01-1', '2A-E1-1'],
  'fr-ch': [],
}
export default class Auto1AE1 extends TauxCoeff {
  constructor() {
    super()
    this.versionQcm = true
  }
}
