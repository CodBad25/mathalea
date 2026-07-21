import OperationsSurDecimaux from '../5e/auto5N2A'
export const titre = 'Multiplier des nombres décimaux à une ou deux décimales'
export const dateDePublication = '20/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * @author Éric Elter
 */

export const uuid = 'c0436'

export const refs = {
  'fr-fr': ['6N2E-6'],
  'fr-ch': [],
}
export default class OperationsSurDecimaux6eMult extends OperationsSurDecimaux {
  constructor() {
    super()
    this.nbQuestions = 3
    this.besoinFormulaireTexte = false
    this.besoinFormulaire3CaseACocher = false
    this.besoinFormulaire4CaseACocher = [
      "Nombre différent de décimales dans les deux facteurs de l'opération",
    ]
    this.sup = '3'
    this.comment =
      "Si le paramètre indique 2 décimales maximum, ce ne sera appliqué qu'à seul des deux facteurs pour permettre un calcul de tête."
  }
}
