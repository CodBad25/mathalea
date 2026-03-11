import EqResolvantesThales from '../3e/3L13-2'
export const titre = 'Résoudre des équations du type  $\dfrac{x}{a}=\dfrac{b}{c}$'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDeModifImportante = '04/04/2022'
export const uuid = 'ce00c'
export const refs = {
  'fr-fr': ['4L15-1', 'BP2RES7'],
  'fr-ch': ['10FA3-5', '11FA6-4'],
}
export default class EquationsFractions extends EqResolvantesThales {
  constructor() {
    super()
    this.exo = '4L15-1'
    this.sup = 1
  }
}
