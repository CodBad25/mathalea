import ProbaEvenementContraire from '../can/3e/can3S02'
export const titre = 'Calculer la probabilité d’un évènement contraire'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can3S02 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '78ab0'

export const refs = {
  'fr-fr': ['1A-P02-1'],
  'fr-ch': [],
}
export default class Auto1AP2 extends ProbaEvenementContraire {
  constructor() {
    super()
    this.versionQcm = true
  }
}
