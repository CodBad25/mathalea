import NotationScientifiqueQCM from '../QCMBrevet/A2020/NCD20E1Q2'

export const titre = 'Identifier une notation scientifique (QCM)'
export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '12/4/2025'

export const uuid = '25ea5'
export const refs = {
  'fr-fr': ['BP2AutoF5'],
  'fr-ch': ['10QCM-7'],
}

export default class NotationQCM extends NotationScientifiqueQCM {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire4CaseACocher = false
    this.sup = false
    this.sup4 = false
  }
}
