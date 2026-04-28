import CoeffMul from '../can/2e/can2C24'
export const titre = 'Calculer un coefficient multiplicateur'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can5P11 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '04c8b'

export const refs = {
  'fr-fr': ['1A-E01-3'],
  'fr-ch': ['NR'],
}
export default class Auto1AE1b extends CoeffMul {
  constructor() {
    super()
    this.versionQcm = true
  }
}
