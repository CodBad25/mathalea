import ExerciceLabyrintheMultiples from '../6e/auto6N3D-2'
export const titre = 'Parcourir un labyrinthe de multiples'
export const amcReady = true
export const amcType = 'AMCOpen'
export const interactifReady = true

export const dateDeModifImportante = '30/03/2023'
export const uuid = '40ae0'
export const refs = {
  'fr-fr': ['CM2NIH-1'],
  'fr-2016': ['c3C10-2'],
  'fr-ch': [],
}
export default class LabyrintheDeMultiplesCM extends ExerciceLabyrintheMultiples {
  constructor() {
    super()
    this.niveau = 'CM'
    this.sup = 4
    this.sup2 = 3
    this.sup3 = 1
    this.sup4 = 1
  }
}
