import EqResolvantesThales from '../3e/3L13-2'
export const titre = 'Déterminer une quatrième proportionnelle dans un tableau'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '15/12/2020'
export const dateDeModifImportante = '15/06/2024'
export const uuid = 'a6b5b'
export const refs = {
  'fr-fr': ['4P10-2', 'BP2AutoL1'],
  'fr-ch': ['9FA3-4'],
}
export default class TableauxEtQuatriemeProportionnelle extends EqResolvantesThales {
  constructor() {
    super()
    this.exo = '4P10-2'
    this.consignePluriel =
      'Déterminer la quatrième proportionnelle dans les tableaux suivants.'
    this.consigneSingulier =
      'Déterminer la quatrième proportionnelle dans le tableau suivant.'
    this.sup = 1
    this.clavierAvecFraction = true
  }
}
