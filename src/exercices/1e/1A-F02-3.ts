import CalculImageParFonctionAffineFraction from '../can/3e/can3F13'
export const titre = "Calculer l'image d'une fraction par une fonction affine"
export const dateDePublication = '23/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can3F13 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'e3ea1'

export const refs = {
  'fr-fr': ['1A-F02-3'],
  'fr-ch': [],
}
export default class Auto1AF1b extends CalculImageParFonctionAffineFraction {
  constructor() {
    super()
    this.versionQcm = true
  }
}
