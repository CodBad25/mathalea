import seuilFctAff from '../can/2e/can2F21'
export const titre = 'Déterminer un seuil avec une fonction affine'
export const dateDePublication = '27/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2F21 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '029b7'

export const refs = {
  'fr-fr': ['1A-C10-14'],
  'fr-ch': [],
}
export default class Auto1AC12a extends seuilFctAff {
  constructor() {
    super()
    this.versionQcm = true
  }
}
