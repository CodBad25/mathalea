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
   La méthode la plus rigoureuse consisterait à résoudre l'équation pour trouver la solution.<br>
    N'oubliez pas que dans un QCM, on vous suggère des solutions, qu'il n'y a qu'une seule bonne réponse....<br>
    Vous pouvez donc essayer de trouver la bonne réponse par essais et erreurs, en testant les différentes propositions.

  </p>

 
  </a>`
    this.versionQcm = true
  }
}
