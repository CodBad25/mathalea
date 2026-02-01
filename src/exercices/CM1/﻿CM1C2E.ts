import MultiplierDecimauxParametres from '../6e/6N2E'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'

export const titre =
  'Poser des multiplications entre un nombre décimal et un petit entier'

export const dateDePublication = '01/02/2026'

/**
 * @author Eric Elter
 */

export const uuid = 'sdk4s'

export const refs = {
  'fr-fr': ['CM1C2E'],
  'fr-ch': [],
}
export default class MultiplierDecimauxParametresCM1 extends MultiplierDecimauxParametres {
  constructor() {
    super()
    this.version = 'CM1'
    this.besoinFormulaire4Numerique = false
    this.sup4 = 1
    this.besoinFormulaire2Numerique = [
      'Chiffre du second facteur (Mettre 10 pour laisser le hasard faire)',
      10,
    ]
    this.sup2 = 10
  }
}
