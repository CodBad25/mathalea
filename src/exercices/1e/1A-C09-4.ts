import DeveloppementNiveau1 from '../can/4e/can4L05'
export const titre = 'Développer avec la simple distributivité'
export const dateDePublication = '23/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can4L05 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'aa40c'

export const refs = {
  'fr-fr': ['1A-C09-4'],
  'fr-ch': [],
}
export default class Auto1AC9c extends DeveloppementNiveau1 {
  constructor() {
    super()
    this.versionQcm = true
  }
}
