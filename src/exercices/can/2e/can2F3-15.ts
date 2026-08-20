import ResoudreEquationsFonctionDeReference from './can2F3-03_old'

export const titre = 'Résoudre une équation avec la fonction inverse'
export const interactifReady = true
export const interactifType = 'qcm'
export const dateDePublication = '18/08/2026'

export const uuid = '7e4b1'

export const refs = {
  'fr-fr': ['can2F3-15'],
  'fr-ch': [],
}

/**
 * @author Stéphane Guyon
 * @author Gilles Mora
 */
export default class EquationFonctionInverse extends ResoudreEquationsFonctionDeReference {
  constructor() {
    super()
    this.typeQuestionFixe = 3
    this.besoinFormulaire3Numerique = false
  }
}
