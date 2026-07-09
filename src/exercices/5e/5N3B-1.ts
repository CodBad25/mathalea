import ExerciceAdditionnerSoustraireFractions5ebis from './5N3B'
export const titre =
  'Additionner ou soustraire deux fractions relatives (dénominateurs multiples)'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = ['qcm', 'mathLive']
export const dateDePublication = '11/05/2025'
export const uuid = '6074b'
export const refs = {
  'fr-fr': ['5N3B-1'],
  'fr-2016': ['5N20-1'],
  'fr-ch': ['10NO5-14', '9NO13-10'],
}
export default class ExerciceAdditionnerSoustraireFractions5eter extends ExerciceAdditionnerSoustraireFractions5ebis {
  constructor() {
    super()
    this.sup5 = 50
  }
}
