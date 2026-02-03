import DivisionDecimaleCM2 from './CM2N4E'
export const dateDePublication = '01/02/2026'
export const amcReady = true
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcType = 'AMCNum'
export const titre =
  'Poser et effectuer des divisions décimales avec un dividende entier et un diviseur à un chiffre'

/**
 * @author Eric Elter
 */

export const uuid = 'dadpc'

export const refs = {
  'fr-fr': ['CM2N4D'],
  'fr-ch': [],
}
export default class DivisionDecimaleParUnEntierCM2 extends DivisionDecimaleCM2 {
  constructor() {
    super()
    this.besoinFormulaire2Numerique = false
    this.sup2 = 1
  }
}
