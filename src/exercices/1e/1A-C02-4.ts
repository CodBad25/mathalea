import NombreInverse from '../can/2e/can2C15'
export const titre = 'Calculer un nombre connaissant son inverse'
export const dateDePublication = '04/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C15 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'efc17'

export const refs = {
  'fr-fr': ['1A-C02-4'],
  'fr-ch': [],
}
export default class Auto1AC2a extends NombreInverse {
  constructor() {
    super()
    this.tip = `
  <p style="margin: 0 0 10px 0;">
   Il est plus facile de travailler avec une égalité de fractions.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Effectuer d'abord les calculs de fractions dans le membre de droite pour obtenir une égalité de fractions.</li>
    <li>Comparer ensuite les deux membres de l'égalité obtenue.</li>
  </ul>`
    this.versionQcm = true
  }
}
