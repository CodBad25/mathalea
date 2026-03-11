import CalculDeVolumes from '../5e/5M20-1'
export const titre = 'Calculer des volumes de solides'
export const amcReady = true
export const amcType = 'AMCHybride'
export const interactifReady = true
export const interactifType = ['qcm', 'mathLive']
export const dateDeModifImportante = '10/06/2024'
export const uuid = 'e26ca'
export const refs = {
  'fr-fr': ['5M20'],
  'fr-ch': ['10GM2-1'],
}
export default class CalculDeVolumes5e extends CalculDeVolumes {
  constructor() {
    super()
    this.sup = 1
    this.sup4 = 5
    this.classe = 5
    this.besoinFormulaire4Texte = [
      'Type de solides',
      'Nombres séparés par des tirets :\n1  : Cubes\n2 : Pavés droits\n3 : Cylindres\n4 : Prismes droits\n5 : Mélange',
    ]
  }
}
