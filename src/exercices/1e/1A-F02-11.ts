import ordonneePointDroite from '../can/2e/can2G25'
export const titre =
  "Calculer l'ordonnée d'un point sur une droite (non définie explicitement)"
export const dateDePublication = '06/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2G25 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '27154'

export const refs = {
  'fr-fr': ['1A-F02-11'],
  'fr-ch': ['1mQCM-2', '2mQCM-3'],
}
export default class Auto1AF2c extends ordonneePointDroite {
  constructor() {
    super()
    this.versionQcm = true
  }
}
