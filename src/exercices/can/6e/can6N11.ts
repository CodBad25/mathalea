import SommeFractionsDecimales from '../../6e/6N1F'
export const interactifReady = true
export const interactifType = 'mathLive'
export const titre = "Écrire sous forme d'une fraction décimale"

export const dateDePublication = '20/01/2022'

/**
 * @author Éric Elter
 * Créé le 20/01/2022

 */
export const uuid = '79452'

export const refs = {
  'fr-fr': ['can6N11', 'auto6N2B-flash2'],
  'fr-ch': [],
}
export default class SommeFractionsDecimalesCAN extends SommeFractionsDecimales {
  constructor() {
    super()
    this.nbQuestions = 1
    this.can = true
    this.sup = '1-2'
    this.sup2 = 2
  }
}
