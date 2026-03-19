import CoefficientDirecteur from '../3e/3F20-4'
export const titre =
  "Reconnaitre coefficient directeur et ordonnée à l'origine d'une fonction affine"
export const dateDePublication = '19/05/2025'
export const interactifReady = true
export const interactifType = 'mathLive'

export const uuid = '80d4f'
export const refs = {
  'fr-fr': ['2F10-9'],
  'fr-ch': ['1mF1-13', '10FA5-18', '11FA8-15'],
}
export default class CoefficientDirecteur2nde extends CoefficientDirecteur {
  constructor() {
    super()
    this.sup = 13
    this.sup2 = false
    this.sup3 = false
  }
}
