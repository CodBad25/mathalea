import ExerciceEquation1 from '../4e/4L20'
export const interactifReady = true

export const amcReady = true
export const amcType = 'AMCHybride'
export const titre = 'Résoudre une équation du premier degré'
export const dateDeModifImportante = '18/09/2026'
export const uuid = '0c2da'
export const refs = {
  'fr-fr': ['3L13', 'BP2RES10', 'BP1AUTO021'],
  'fr-ch': ['10FA5C-2'],
}
export default class ExerciceEquation3e extends ExerciceEquation1 {
  constructor() {
    super()
    this.xPlusBEgalCAvecRelatifsNonNuls = true
    this.sup = true
    this.sup2 = 8
    this.sup3 = false
  }
}
