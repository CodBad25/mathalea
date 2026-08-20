import ResoudreEquationsFonctionDeReference2 from './can2F3-04_old'

export const titre = 'Résoudre une équation du type 1/x + b = c'
export const interactifReady = true
export const interactifType = 'qcm'
export const dateDePublication = '18/08/2026'
export const uuid = '5cef8'
export const refs = { 'fr-fr': ['can2F3-22'], 'fr-ch': [] }

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora et Stéphane Guyon
 */
export default class EquationInversePlusB extends ResoudreEquationsFonctionDeReference2 {
  constructor() {
    super()
    this.typeQuestionFixe = 5
    this.besoinFormulaireNumerique = false
  }
}
