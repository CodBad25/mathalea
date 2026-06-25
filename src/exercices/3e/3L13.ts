import ExerciceEquation1 from '../4e/4L20'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const titre = 'Résoudre une équation du premier degré'
export const dateDeModifImportante = '02/04/2024'
export const uuid = 'f239f'
export const refs = {
  'fr-fr': ['3L13', 'BP2RES10'],
  'fr-ch': ['11FA6-3'],
}
export default class ExerciceEquation3e extends ExerciceEquation1 {
  constructor() {
    super()
    this.sup = true
    this.sup2 = 8
    this.sup3 = false
  }
}
