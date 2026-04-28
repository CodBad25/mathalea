import EquationsCarree from '../can/2e/can2L14'
export const titre = 'Résoudre une équation du type $(x+a)^2=k$'
export const dateDePublication = '27/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2L14 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '8d5ec'

export const refs = {
  'fr-fr': ['1A-C10-2'],
  'fr-ch': [],
}
export default class Auto1AC10b extends EquationsCarree {
  constructor() {
    super()
    this.versionQcm = true
  }
}
