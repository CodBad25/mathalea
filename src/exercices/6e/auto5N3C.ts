import EgaliteATrousMultiplicatives from './6N3C'

export const titre =
  'Faire vivre la notion de nombre quotient en complétant des multiplications à trou'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const dateDePublication = '30/08/2026'

/**
 * @author Éric Elter
 */

export const uuid = '6a15e'

export const refs = {
  'fr-fr': ['auto5N3C', 'auto5N5D'],
  'fr-ch': [],
}
export default class EgaliteATrousMultiplicativesV1 extends EgaliteATrousMultiplicatives {
  constructor() {
    super()
    this.sup2 = '1-5'
    this.correctionDetaillee = true
  }
}
