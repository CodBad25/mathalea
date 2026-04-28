import DeveloppementDouble from '../can/2e/can2L13'
export const titre = 'Développer avec la double distributivité'
export const dateDePublication = '28/07/2025'
export const dateDeModifImportante = '25/03/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2L13 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '106e7'

export const refs = {
  'fr-fr': ['1A-C09-3'],
  'fr-ch': ['11QCM-4', '1mQCM-7'],
}
export default class Auto1AC9b extends DeveloppementDouble {
  constructor() {
    super()
    this.versionQcm = true
  }
}
