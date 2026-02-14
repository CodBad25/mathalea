import ExerciceCalculsProprietesLn from '../TSpe/TSA5-03'
export const titre =
  'Calculer en utilisant les propriétés des logarithmes'
export const dateDePublication = '4/5/2024'
export const dateDeModifImportante = '18/07/2024'
export const uuid = 'f7928'
export const interactifReady = true
export const interactifType = 'mathLive'
export const refs = {
  'fr-fr': ['TTE-4'],
  'fr-ch': [],
}

/**
 *
 * @author clone de TSpeAN1-0 de Claire Rousset réalisé par Jean-Claude Lhote et Stéphane Guyon pour le clonage
* 
 */
export default class ExerciceCalculsProprietesLog extends ExerciceCalculsProprietesLn {
  constructor() {
    super()
   this.nbQuestions = 2
    this.spacingCorr = 3
      this.sup2 = false
    this.sup = '4'
     this.besoinFormulaireTexte = [
      'Type de question',
      ' Nombres séparés par des tirets :\n1 : Avec $\\log(a^n*b^m)$\n2 : Avec $\\log(a^n/b^m)$\n3 : Mélange',
    ]
  }
}
