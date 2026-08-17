import ArrondirUneValeur6e from '../6e/6N1K'
export const titre = 'Arrondir une valeur'
export const interactifReady = true
export const interactifType = 'qcm'
export const dateDeModifImportante = '27/10/2021'
export const uuid = 'bba9b'
export const refs = {
  'fr-fr': ['2N13-1', 'BP2AutoS1'],
  'fr-ch': ['10NO3E-8'],
}
export default class ArrondirUneValeur2nde extends ArrondirUneValeur6e {
  constructor() {
    super()
    this.version = 2
    this.sup = 5
    this.besoinFormulaireNumerique = false
  }
}
