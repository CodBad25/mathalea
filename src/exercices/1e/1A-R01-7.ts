import calculAvecPourcentage from '../can/2e/can2C29'
export const titre = 'Retrouver un pourcentage'
export const dateDePublication = '23/03/2026'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C29 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '8fed0'

export const refs = {
  'fr-fr': ['1A-R01-7'],
  'fr-ch': [],
}
export default class Auto1AR1g extends calculAvecPourcentage {
  constructor() {
    super()
    this.versionQcm = true
  }
}
