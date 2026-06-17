import CalculPuissancesOperation from '../can/2e/can2C13'
export const titre = 'Simplifier avec les propriétés des puissances'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C13 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '71eba'

export const refs = {
  'fr-fr': ['1A-C03-2'],
  'fr-ch': [],
}
export default class Auto1AC3b extends CalculPuissancesOperation {
  constructor() {
    super()
    this.versionQcm = true
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut simplifier une expression avec des puissances.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Regarder si les puissances ont la même base (le nombre élevé à une puissance) ou le même exposant.</li>
    <li>Se rappeler les propriétés du cours : produit, quotient et puissance d'une puissance.</li>
    <li>Écrire un petit exemple développé au brouillon en cas d'hésitation.</li>
  </ul>
`
  }
}
