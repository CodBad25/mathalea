import PuissancesEncadrement from '../4e/4C30-1'
export const titre = 'Encadrer des nombres relatifs avec des puissances de 10'
export const dateDeModifImportante = '06/10/2025'
export const interactifReady = true
export const interactifType = 'multi-mathfield'
export const uuid = '8f56f'
export const refs = {
  'fr-fr': ['2N12-2', 'BP2AutoE1'],
  'fr-ch': ['10NO2-8'],
}
export default class PuissancesEncadrement2nde extends PuissancesEncadrement {
  constructor() {
    super()
    this.sup = 4
    this.classe = 2
    this.besoinFormulaireTexte = [
      'Niveau de difficulté',
      'Nombres séparés par des tirets :\n1 : Nombre entier naturel\n2 : Nombre décimal supérieur à 1\n3 : Nombre décimal positif inférieur à 1\n4 : Mélange',
    ]

    if (this.classe === 2) {
      this.besoinFormulaire2CaseACocher = [
        'Autoriser des nombres négatifs',
        true,
      ]
    }
  }
}
