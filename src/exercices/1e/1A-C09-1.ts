import FatorisationEgR from '../can/2e/can2L12'
export const titre = 'Factoriser avec une égalité remarquable'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2L12 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'c4664'

export const refs = {
  'fr-fr': ['1A-C09-1'],
  'fr-ch': [],
}
export default class Auto1AC9 extends FatorisationEgR {
  constructor() {
    super()
    this.versionQcm = true
  }
}
