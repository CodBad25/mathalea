import CalculComplexeFraction from '../can/3e/can3C19'
export const titre = 'Effectuer un calcul complexe avec des fractions'
export const dateDePublication = '06/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can3C19 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '1252f'

export const refs = {
  'fr-fr': ['1A-C02-2'],
  'fr-ch': ['11QCM-6', '1mQCM-9'],
}
export default class Auto1AC2c extends CalculComplexeFraction {
  constructor() {
    super()
   this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut effectuer un calcul fractionnaire.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li> Vous devez identifier les priorités opératoires. Quelle opération dois-je commencer à effectuer ?</li>
    <li> Vous devez vous rappeler des règles de calculs avec les fractions :
     <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li> Pour additionner ou soustraire des fractions, il faut les mettre au même dénominateur. </li>
    <li> Pour multiplier des fractions, il faut multiplier les numérateurs entre eux et les dénominateurs entre eux. </li>
    <li> Pour diviser des fractions, il faut multiplier la première fraction par l'inverse de la seconde. </li>
   </ul>
     </li>
  </ul>
 
  </a>`
    this.versionQcm = true
  }
}
