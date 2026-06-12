import calculPuissancesAvecn from '../can/2e/can2C30'
export const titre = 'Déterminer une puissance dans une égalité'
export const dateDePublication = '23/03/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C30 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'e0d49'

export const refs = {
  'fr-fr': ['1A-C03-16'],
  'fr-ch': [],
}
export default class Auto1AC3p extends calculPuissancesAvecn {
  constructor() {
    super()
    this.versionQcm = true
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut retrouver une valeur de $n$ dans une égalité avec des puissances.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Commencez par transformer l'addition de deux termes identiques en une multiplication par $2$.</li>
    <li>Essayez ensuite d'écrire toutes les puissances avec la même base.</li>
    <li>Quand deux puissances de même base sont égales, comparez leurs exposants.</li>
  </ul>
`
  }
}
