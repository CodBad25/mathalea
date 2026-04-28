import EquationDroite from '../can/2e/can2G20'
export const titre = 'Déterminer une équation de droite (graphique)'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2G20 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'c4579'

export const refs = {
  'fr-fr': ['1A-F07-4'],
  'fr-ch': [],
}
export default class Auto1AF6 extends EquationDroite {
  constructor() {
    super()
    this.versionQcm = true
  }
}
