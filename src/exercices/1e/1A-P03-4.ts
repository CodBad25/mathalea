import CalculProbaSimple from '../can/3e/can3S01'
export const titre = 'Calculer une probabilité dans un cas simple'
export const dateDePublication = '06/01/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can3S01 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '79057'

export const refs = {
  'fr-fr': ['1A-P03-4', '2A-P3-4'],
  'fr-ch': [],
}
export default class Auto1AP03d extends CalculProbaSimple {
  constructor() {
    super()
    this.versionQcm = true
  }
}
