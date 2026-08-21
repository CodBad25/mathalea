import ComparerAvecFctRef from './can2F3-06_old'

export const titre = 'Comparer deux nombres avec la fonction inverse'
export const interactifReady = true
export const interactifType = 'qcm'
export const dateDePublication = '18/08/2026'
export const uuid = 'a25f6'
export const refs = { 'fr-fr': ['can2F22-07'], 'fr-ch': [] }

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora et Stéphane Guyon
 */
export default class ComparerAvecFonctionInverse extends ComparerAvecFctRef {
  constructor() {
    super()
    this.typeQuestionFixe = 1
  }
}
