import CalculToutAvecPartie from '../can/2e/can2C23'
export const titre = 'Calculer le tout connaissant une partie'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can5P11 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'c8a75'

export const refs = {
  'fr-fr': ['1A-R02-3'],
  'fr-ch': [],
}
export default class Auto1AR5a extends CalculToutAvecPartie {
  constructor() {
    super()
    this.versionQcm = true
  }
}
