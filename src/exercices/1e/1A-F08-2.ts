import TrouverpDroite from '../can/2e/can2G24'
export const titre =
  'Déterminer un coefficient directeur à partir des coordonnées'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2G24 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '10a62'

export const refs = {
  'fr-fr': ['1A-F08-2'],
  'fr-ch': ['11QCM-5', '1mQCM-8'],
}
export default class Auto1AF6d extends TrouverpDroite {
  constructor() {
    super()
    this.versionQcm = true
  }
}
