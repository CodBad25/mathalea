import PoucentageProportion from '../can/6e/can6P07'
export const titre = 'Déterminer un pourcentage de proportion'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can6P07 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '9b4e6'

export const refs = {
  'fr-fr': ['1A-R01-1'],
  'fr-ch': [],
}
export default class Auto1AR1 extends PoucentageProportion {
  constructor() {
    super()
    this.versionQcm = true
  }
}
