import MoyenneStat from '../can/3e/can3S05'
export const titre = 'Calculer une moyenne'
export const dateDePublication = '23/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can3S05 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '51125'

export const refs = {
  'fr-fr': ['1A-S02-8', '2A-S2-8', '3AutoP03-1'],
  'fr-ch': ['QCM9-1'],
}
export default class Auto1AS4 extends MoyenneStat {
  constructor() {
    super()
    this.versionQcm = true
  }
}
