import CalculDeVolumes from '../5e/5M20-1'
export const titre = 'Calculer des volumes'
export const amcReady = true
export const amcType = 'AMCHybride'
export const interactifReady = true

export const dateDeModifImportante = '17/04/2025'
export const uuid = 'acb80'
export const refs = {
  'fr-fr': ['3G43', 'BP2G20', '3AutoM07-1'],
  'fr-ch': ['11GM2A-3', '11GM2B-4', '11GM2C-3'],
}
export default class CalculDeVolumes3e extends CalculDeVolumes {
  constructor() {
    super()
    this.sup = 1
    /** @type {number | string} */
    this.sup4 = 8
    this.classe = 3
    /** @type {boolean | [string, string]} */
    this.besoinFormulaire4Texte = [
      'Type de solides',
      'Nombres séparés par des tirets :\n1  : Cubes\n2 : Pavés droits\n3 : Cylindres\n4 : Prismes droits\n5 : Cônes\n6 : Pyramides à base carrée\n7 : Pyramides à base triangulaire rectangle\n8 : Pyramides à base triangulaire quelconque\n9 : Boules\n10 : Mélange',
    ]
  }
}
