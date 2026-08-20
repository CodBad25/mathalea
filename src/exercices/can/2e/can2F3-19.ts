import ResoudreEquationsFonctionDeReference2 from './can2F3-04_old'

export const titre = 'Résoudre une équation du type −x² + b = c'
export const interactifReady = true
export const interactifType = 'qcm'
export const dateDePublication = '18/08/2026'
export const uuid = '29bc5'
export const refs = { 'fr-fr': ['can2F3-19'], 'fr-ch': [] }

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora et Stéphane Guyon
 */
export default class EquationOpposeCarrePlusB extends ResoudreEquationsFonctionDeReference2 {
  constructor() {
    super()
    this.typeQuestionFixe = 2
    this.besoinFormulaireNumerique = false
  }
}
