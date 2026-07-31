import NouvelleCaledonieDec20Exo1Q4 from '../QCMBrevet/A2020/NCD20E1Q4'

export const titre = "Déterminer la moyenne d'une série (QCM)"
export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '12/4/2025'

export const uuid = '06a67'
export const refs = {
  'fr-fr': ['BP2AutoD3', 'BP1AUTO046'],
  'fr-ch': ['9QCM-3'],
}

export default class ExerciceMoyenneTemperaturesQCM extends NouvelleCaledonieDec20Exo1Q4 {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire4CaseACocher = false
    this.sup = false
    this.sup4 = false
  }
}
