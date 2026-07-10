import Proportions from '../2e/2S10-2'
export const titre = 'Appliquer un pourcentage'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

export const dateDePublication = '04/04/2022'

export const refs = {
  'fr-fr': ['5P1B-2'],
  'fr-2016': ['5P14-1'],
  'fr-ch': [],
}
export const uuid = '542be'
export default class ExercicePourcentage5e2 extends Proportions {
  constructor() {
    super()
    this.sup = 1
    this.besoinFormulaireNumerique = false
  }
}
