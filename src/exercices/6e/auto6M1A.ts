import ExerciceConversions from './_Exercice_conversions'
export const titre =
  'Connaître la signification des préfixes de milli à kilo, voire tera'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '28/07/2025'

/**
 * @author Éric Elter
 */

export const uuid = '7d71b'

export const refs = {
  'fr-fr': ['auto6M1A'],
  'fr-2016': ['6N35'],
  'fr-ch': [''],
}
export default class Reglages6N35 extends ExerciceConversions {
  constructor() {
    super()
    this.sup = 3
    this.sup3 = true
    this.sup4 = false
    this.correctionDetailleeDisponible = true
    this.valUnitaire = true
    this.besoinFormulaire2CaseACocher = false
    this.nbQuestions = 6
    this.comment +=
      '<br>Cet exercice est limité en nombre de questions, au peu de choix possibles.'
  }
}
