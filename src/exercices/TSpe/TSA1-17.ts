import N2PlusRacineDeN from '../can/TSpe/canTSpeS07'
export const titre = 'Limite de $n^m-n^p$'
export const dateDePublication = '04/08/2025'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de CanTspeE01 pour les auto 1er
 * @author Stéphane Guyon
 */

export const uuid = '1b8d4'

export const refs = {
  'fr-fr': ['TSA1-17'],
  'fr-ch': [],
}
export default class N2PlusRacineDeNUn extends N2PlusRacineDeN {
  constructor() {
    super()
    this.nbQuestions = 2
  }
}
