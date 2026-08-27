import CoeffDirecteurDroite from '../can/2e/can2G31-01'
export const titre =
  "Déterminer le coefficient directeur d'une droite à partir de son équation réduite"
export const dateDePublication = '25/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true

/**
 * Clone de can2G31-01 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '4a79c'

export const refs = {
  'fr-fr': ['1A-F07-1'],
  'fr-ch': [],
}
export default class Auto1AF6a extends CoeffDirecteurDroite {
  constructor() {
    super()
    this.versionQcm = true
  }
}
