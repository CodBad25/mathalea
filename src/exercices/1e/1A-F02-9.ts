import CoordonneesPointIntersectionAxeAbscissesDroite from '../can/2e/can2G31-08'
export const titre =
  'Calculer les coordonnées du point d’intersection entre l’axe des abscisses et une droite'
export const dateDePublication = '26/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true

/**
 * Clone de can2L03 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '08208'

export const refs = {
  'fr-fr': ['1A-F02-9', '2A-F2-3'],
  'fr-ch': ['1mQCM-5'],
}
export default class Auto1AF2a extends CoordonneesPointIntersectionAxeAbscissesDroite {
  constructor() {
    super()
    this.versionQcm = true
  }
}
