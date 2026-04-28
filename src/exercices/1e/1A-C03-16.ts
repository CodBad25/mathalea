import calculPuissancesAvecn from '../can/2e/can2C30'
export const titre = 'Déterminer une puissance dans une égalité'
export const dateDePublication = '23/03/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C30 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'e0d49'

export const refs = {
  'fr-fr': ['1A-C03-16'],
  'fr-ch': [],
}
export default class Auto1AC3p extends calculPuissancesAvecn {
  constructor() {
    super()
    this.versionQcm = true
  }
}
