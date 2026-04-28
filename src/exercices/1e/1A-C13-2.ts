import EquationSecondDegreParticuliere from '../can/1e/can1SD17'
export const titre = 'Résoudre une équation $ax^2+bx+c=c$'
export const dateDePublication = '23/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can1L09 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '84f02'

export const refs = {
  'fr-fr': ['1A-C13-2'],
  'fr-ch': [],
}
export default class Auto1AC15 extends EquationSecondDegreParticuliere {
  constructor() {
    super()
    this.versionQcm = true
  }
}
