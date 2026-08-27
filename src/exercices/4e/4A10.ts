import PremierOuPas from '../3e/3A10-1'
export const titre = 'Nombre premier ou pas'
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const uuid = 'bdb18'
export const refs = {
  'fr-fr': ['4A10'],
  'fr-ch': [],
}
export default class PremierOuPas4e extends PremierOuPas {
  constructor() {
    super()
    this.sup2 = false
    this.sup3 = true
  }
}
