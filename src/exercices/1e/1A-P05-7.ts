import ProbaCond from '../can/1e/can1P11'
export const titre =
  'Calculer une probabilité conditionnelle (tirage sans remise dans une urne)'
export const dateDePublication = '20/02/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'
/**
 * Clone de can3S01 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'da49c'

export const refs = {
  'fr-fr': ['1A-P05-7'],
  'fr-ch': [],
}
export default class Auto1AP057 extends ProbaCond {
  constructor() {
    super()
    this.versionQcm = true
  }
}
