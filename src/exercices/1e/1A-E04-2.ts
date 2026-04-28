import EvolSuccessives from '../can/2e/can2C25'
export const titre =
  'Déterminer une évolution globale après deux évolutions successives'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can5P01 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'a7d80'

export const refs = {
  'fr-fr': ['1A-E04-2'],
  'fr-ch': [],
}
export default class Auto1AE4a extends EvolSuccessives {
  constructor() {
    super()
    this.versionQcm = true
  }
}
