import Exercice2F204 from '../2e/2F30-4'

export const titre = 'Résoudre graphiquement une équation'
export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '13/4/2025'

export const uuid = '816b8'
export const refs = {
  'fr-fr': ['BP2AutoP1', 'BP1RGEI06'],
  'fr-ch': [],
}

export default class ExerciceEquations extends Exercice2F204 {
  constructor() {
    super()
    this.besoinFormulaireTexte = false
    this.sup = '1'
  }
}
