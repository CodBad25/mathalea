import ExerciceCalculsProprietesLn from '../TT/TTE-6'
export const titre = 'Calculer en utilisant les propriétés des logarithmes'
export const dateDePublication = '04/08/2025'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de CanTspeE01 pour les auto 1er
 * @author Stéphane Guyon
 */

export const uuid = '00ec6'

export const refs = {
  'fr-fr': ['TSA5-11'],
  'fr-ch': [],
}
export default class ExerciceCalculsPropLn extends ExerciceCalculsProprietesLn {
  constructor() {
    super()
    this.nbQuestions = 2
    this.sup2 = 2
     this.besoinFormulaireTexte = [
      'Type de question',
      ' Nombres séparés par des tirets :\n1 : Avec $\\ln(a^n*b^m)$\n2 : Avec $\\ln(a^n/b^m)$\n3 : Mélange',
    ]
  }
}
