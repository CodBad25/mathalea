import NombreFois4Ou8 from '../can/6e/can6C66'
export const dateDePublication = '01/02/2026'
export const titre = 'Multiplier un nombre par 4 ou 8'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Eric Elter
 */

export const uuid = 'mr56c'

export const refs = {
  'fr-fr': ['CM1C1J'],
  'fr-ch': [],
}
export default class NombreFois4Ou8CM1 extends NombreFois4Ou8 {
  constructor() {
    super()
    this.nbQuestions = 3
  }
}
