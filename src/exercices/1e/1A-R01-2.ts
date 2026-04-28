import PourcentageARetrouver from '../can/4e/can4P07'
export const titre = 'Retrouver un pourcentage'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can4P07 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'cd464'

export const refs = {
  'fr-fr': ['1A-R01-2'],
  'fr-ch': [],
}
export default class Auto1AR1a extends PourcentageARetrouver {
  constructor() {
    super()
    this.versionQcm = true
  }
}
