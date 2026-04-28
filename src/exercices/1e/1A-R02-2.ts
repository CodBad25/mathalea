import ValeursDefPourcentage from '../can/4e/can4P06'
export const titre = 'Déterminer une valeur définie avec un pourcentage'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can5P11 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '1b3f9'

export const refs = {
  'fr-fr': ['1A-R02-2'],
  'fr-ch': ['10QCM-4'],
}
export default class Auto1AR5 extends ValeursDefPourcentage {
  constructor() {
    super()
    this.versionQcm = true
  }
}
