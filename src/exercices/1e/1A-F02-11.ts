import ordonneePointDroite from '../can/2e/can2G30-06'
export const titre =
  "Calculer l'ordonnée d'un point sur une droite (non définie explicitement)"
export const dateDePublication = '06/08/2025'
export const amcReady = true
export const interactifReady = true

/**
 * Clone de can2G30-06 pour les auto 1er
 * @author Gilles Mora
 */

export const dateDeModifImportante = '29/09/2026'

export const uuid = 'af81c'

export const refs = {
  'fr-fr': ['1A-F02-11'],
  'fr-ch': [],
}
export default class Auto1AF2c extends ordonneePointDroite {
  constructor() {
    super()
    this.versionQcm = false
  }
}
