import ÉcrirePourcentage from '../can/5e/can5P06'
export const titre = 'Écrire sous la forme d’un pourcentage'
export const dateDePublication = '09/12/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C22 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '14552'

export const refs = {
  'fr-fr': ['1A-C04-6'],
  'fr-ch': [''],
}
export default class Auto1AC4f extends ÉcrirePourcentage {
  constructor() {
    super()
    this.versionQcm = true
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut écrire un nombre sous forme de pourcentage.<br>
 

    Se rappeler qu'un pourcentage est une fraction de dénominateur $100$.
  
  </p>`
  }
}
