import SolutionInequation from '../can/2e/can2L30-01'
export const titre = 'Résoudre une inéquation $ax+b>0$'
export const dateDePublication = '23/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true

/**
 * Clone de can2L05 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'f0230'

export const refs = {
  'fr-fr': ['1A-C10-13', '2A-C3-9', 'BP1AUTO050'],
  'fr-ch': [],
}
export default class Auto1AC12 extends SolutionInequation {
  constructor() {
    super()
    this.versionQcm = true
  }
}
