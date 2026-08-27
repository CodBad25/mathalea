import CoeffMul from '../can/2e/can2I20-03'
export const titre = 'Calculer un coefficient multiplicateur'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true

/**
 * Clone de can5P11 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '04c8b'

export const refs = {
  'fr-fr': ['1A-E01-3', '2A-E1-3'],
  'fr-ch': ['NR'],
}
export default class Auto1AE1b extends CoeffMul {
  constructor() {
    super()
    this.versionQcm = true
  }
}
