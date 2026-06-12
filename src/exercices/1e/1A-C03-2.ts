import CalculPuissancesOperation from '../can/2e/can2C13'
export const titre = 'Simplifier avec les propriétés des puissances'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C13 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '71eba'

export const refs = {
  'fr-fr': ['1A-C03-2'],
  'fr-ch': [],
}
export default class Auto1AC3b extends CalculPuissancesOperation {
  constructor() {
    super()
    this.versionQcm = true
   
  }
}
