import ComparerFractionEtEntier from '../6e/can6C68'

export const titre = 'Comparer un entier et une fraction'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '21/06/2026'
/**
 * @author  Jean-Claude Lhot
 */

export const uuid = 'f34be'

export const refs = {
  'fr-fr': ['can4C22'],
  'fr-ch': [],
}
export default class Retrancher1 extends ComparerFractionEtEntier {
  constructor() {
    super()
    this.level = 4
  }
}
