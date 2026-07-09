import Proportions from '../2e/2S10-2'
export const titre = "Exprimer une proportion sous la forme d'un pourcentage"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

export const dateDePublication = '04/04/2022'

export const refs = {
  'fr-fr': ['5P1B-1'],
  'fr-2016': ['5P14'],
  'fr-ch': [],
}
export const uuid = '4db23'
export default class ExercicePourcentage5e extends Proportions {
  constructor() {
    super()
    this.sup = 2
    this.besoinFormulaireNumerique = false
  }
}
