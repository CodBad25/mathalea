import CalculExpAvecValeurs from '../can/2e/can2L10-01'
export const titre = 'Calculer une expression avec des valeurs'
export const dateDePublication = '23/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2N40-11 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '42237'

export const refs = {
  'fr-fr': ['1A-C12-1', '2A-C5-1'],
  'fr-ch': ['11QCM-2'],
}
export default class Auto1AC14 extends CalculExpAvecValeurs {
  constructor() {
    super()
    this.versionQcm = true
  }
}
