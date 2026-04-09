import NombreDeFacesEtDAretes from '../../5e/5G53'

export const titre = 'Compter les arêtes et les faces'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote
 * Créé le 7/11/2021

 */
export const uuid = '86ea3'

export const refs = {
  'fr-fr': ['can6G06'],
  'fr-ch': [],
}
export default class NombreDeFacesEtDAretesExo extends NombreDeFacesEtDAretes {
  version: number
  constructor() {
    super()
    this.nbQuestions = 1
    this.version = 3
    this.besoinFormulaireNumerique = false
  }
}
