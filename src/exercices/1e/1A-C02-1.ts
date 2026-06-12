import ProgrammeCalcul2 from '../can/2e/can2C16'
export const titre = 'Calculer avec un programme de calcul'
export const dateDePublication = '04/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C16 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'dac3c'

export const refs = {
  'fr-fr': ['1A-C02-1'],
  'fr-ch': [],
}
export default class Auto1AC2b extends ProgrammeCalcul2 {
  constructor() {
    super()
     this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut traduire la consigne donnée en français en mathématique.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li> Identifiez les mots clés (inverse, somme, double, carré, ...), rappelez vous leur signification mathématique.</li>
    <li> En faisant bien attention à <strong>l'ordre des mots</strong>, ecrivez le programme de calcul en respectant bien les priorités. </li>
  </ul>
 <strong>Attention au piège de l'ordre des mots :</strong><br>
 "L'école du directeur" ne veut pas dire la même chose que "le directeur de l'école". <br>
 A vous de bien identifier la bonne traduction mathématique.
  </a>`
    this.versionQcm = true
  }
}
