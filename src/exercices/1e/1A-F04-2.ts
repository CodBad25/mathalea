import EquationsGSplineNombre from '../can/2e/can2F24'
export const titre =
  "Déterminer le nombre de solutions d'une équation (graphique)"
export const dateDePublication = '29/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2F24 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '21516'

export const refs = {
  'fr-fr': ['1A-F04-2'],
  'fr-ch': ['1mQCM-1', '2mQCM-1'],
}
export default class Auto1AF4a extends EquationsGSplineNombre {
  constructor() {
    super()
    this.versionQcm = true
  }
}
