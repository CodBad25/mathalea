import EcritureDecimalePuissance from '../4e/4C30-3'
export const titre =
  "Donner l'écriture entière ou fractionnaire d'une puissance"
export const dateDePublication = '05/09/2023'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const uuid = 'eb865'
export const refs = {
  'fr-fr': ['3C10-1'],
  'fr-ch': ['10NO3D-25'],
}
export default class EcritureDecimalePuissance3e extends EcritureDecimalePuissance {
  constructor() {
    super()
    this.sup = 3
    this.besoinFormulaireNumerique = [
      'Niveau de difficulté',
      3,
      '1 : Exposants positifs\n2 : Exposants négatifs\n3 : Mélange',
    ]
  }
}
