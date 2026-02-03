import NombreFois5 from '../can/6e/can6C02'
export const dateDePublication = '01/02/2026'
export const titre = 'Multiplier un nombre par 5'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Eric Elter
 */

export const uuid = 'mr45c'

export const refs = {
  'fr-fr': ['CM1C1K'],
  'fr-ch': [],
}
export default class NombreFois5CM1 extends NombreFois5 {
  constructor() {
    super()
    this.version = 'PairOuImpair'
    this.nbQuestions = 3
  }
}
