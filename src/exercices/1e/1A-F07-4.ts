import EquationDroite from '../can/2e/can2G31-03'
export const titre = "Lire graphiquement l'équation réduite d’une droite"
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true

/**
 * Clone de can2G31-03 pour les auto 1er
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
