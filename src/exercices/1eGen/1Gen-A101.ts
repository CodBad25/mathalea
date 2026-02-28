import ModeliserSuites from '../1e/1AL10-1'
export const titre =
  "Modéliser une situation avec une suite"
export const dateDePublication = '29/07/2025'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2F24 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '21517'

export const refs = {
  'fr-fr': ['1Gen-A101'],
  'fr-ch': [],
}
export default class ModeliserSuites2 extends ModeliserSuites {
  constructor() {
    super()  
      this.nbQuestions = 1
    this.sup = '11'
    this.sup2=false
    this.spacing = 1.5
    this.spacingCorr = 1.5
    this.besoinFormulaireTexte = [
      'Type de questions',
      [
        'Nombres séparés par des tirets  :',
        '1 : Les abeilles',
        "2 : La retenue d'eau",
        '3 : Les vélos',
        '4 : Capital sur un compte',
        '5 : Abonnement spectacle',
        '6 : Prêt à la consommation',
        '7 : La température  (forme explicite)',
        '8 : La salle de sport (forme explicite) ',
        '9 : Location de voiture (forme explicite)',
        "10 : Budget d'une association (forme explicite)",
        '11 : Mélange',
      ].join('\n'),
    ]
  }
}
