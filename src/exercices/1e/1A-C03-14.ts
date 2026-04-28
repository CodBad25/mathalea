import calculPuissancesNegativeFraction from '../can/2e/can2C28'
export const titre = 'Calculer $\\dfrac{1}{a}$ à la puissance $-1$ ou $-2$'
export const dateDePublication = '02/02/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C28 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '7233e'

export const refs = {
  'fr-fr': ['1A-C03-14'],
  'fr-ch': [],
}
export default class Auto1AC03n extends calculPuissancesNegativeFraction {
  constructor() {
    super()
    this.versionQcm = true
  }
}
