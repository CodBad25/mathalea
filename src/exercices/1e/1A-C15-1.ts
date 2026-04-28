import ProblemeFractions from '../can/2e/can2C20'
export const titre = 'Résoudre un problème avec des fractions'
export const dateDePublication = '04/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C20 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '8a682'

export const refs = {
  'fr-fr': ['1A-C15-1'],
  'fr-ch': [],
}
export default class Auto1AC19a extends ProblemeFractions {
  constructor() {
    super()
    this.versionQcm = true
  }
}
