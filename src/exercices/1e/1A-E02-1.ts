import PoucentageE from '../can/5e/can5P01'
export const titre = 'Calculer un prix après une évolution en pourcentage'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can5P01 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '2132c'

export const refs = {
  'fr-fr': ['1A-E02-1'],
  'fr-ch': ['10QCM-6', '9QCM-8'],
}
export default class Auto1AE2 extends PoucentageE {
  constructor() {
    super()
    this.versionQcm = true
  }
}
