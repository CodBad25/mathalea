import ppcmEngrenages from '../3e/3A12'
export const titre = 'Utiliser des multiples appliqués aux engrenages'
export const interactifReady = false
export const dateDeModifImportante = '14/11/2021'
export const uuid = 'c3c84'

export const refs = {
  'fr-fr': ['2N20-7'],
  'fr-ch': ['10NO1A-12'],
}
export default class PpcmEngrenages2nde extends ppcmEngrenages {
  constructor() {
    super()
    this.sup = true
    this.besoinFormulaireCaseACocher = false
  }
}
