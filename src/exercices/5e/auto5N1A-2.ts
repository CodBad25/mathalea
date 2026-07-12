import CriteresDeDivisibilite from './5N1J-2'
export const dateDePublication = '12/07/2026'
export const interactifReady = true
export const interactifType = 'multiMathfield'

export const titre =
  'Utiliser les critères de divisibilité par 2, par 5 ou par 10'

/**
 * @author Éric Elter
 */

export const uuid = '55a42'

export const refs = {
  'fr-fr': ['auto5N1A-2'],
  'fr-ch': [],
}
export default class CriteresDeDivisibilite2ou5ou10 extends CriteresDeDivisibilite {
  constructor() {
    super()
    this.besoinFormulaireNumerique = false
    this.sup = '1'
  }
}
