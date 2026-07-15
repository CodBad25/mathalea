import PoucentageP2 from '../can/4e/can4P09'
export const titre = 'Calculer avec un pourcentage de proportion'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can5P11 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'c40dc'

export const refs = {
  'fr-fr': ['1A-R02-4', '2A-R2-4'],
  'fr-ch': [],
}
export default class Auto1AR5b extends PoucentageP2 {
  constructor() {
    super()
    this.versionQcm = true
  }
}
