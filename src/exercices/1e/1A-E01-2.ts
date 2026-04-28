import CoeffTaux from '../can/2e/can2C11'
export const titre = 'Passer du coefficient multiplicateur au taux d’évolution'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can5P11 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'ae5f6'

export const refs = {
  'fr-fr': ['1A-E01-2'],
  'fr-ch': [],
}
export default class Auto1AE1a extends CoeffTaux {
  constructor() {
    super()
    this.versionQcm = true
  }
}
