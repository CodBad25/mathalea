import ProgrammeCalcul2 from '../can/5e/can5C14'
export const titre = 'Écrire une fraction avec un nombre décimal'
export const dateDePublication = '05/01/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C16 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'ba2ec'

export const refs = {
  'fr-fr': ['1A-C04-7'],
  'fr-ch': [],
}
export default class Auto1AC4g extends ProgrammeCalcul2 {
  constructor() {
    super()
    this.versionQcm = true
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut calculer un quotient avec des nombres décimaux.<br>
    Il suffit de transformer le quotient pour obtenir une fraction, avec des nombres entiers au numérateur et dénominateur. Puis selon les situations :
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Réduire la fraction obtenue.</li>
    <li>Tester les propositions en surveillant les erreurs de facteur $10$.</li>
  </ul>`
  }
}
