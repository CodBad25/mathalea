import ConversionHeuresMinutesOuMinutesEtSecondes from '../../6e/6M4C-1'
export const titre = 'Convertir minutes<->heures ou secondes<->minutes'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = 'd34e5'

export const refs = {
  'fr-fr': ['can6D04', '6M4C-flash3', '3AutoG06-8'],
  'fr-ch': [],
}
export default class ConvertirMinutesHeures extends ConversionHeuresMinutesOuMinutesEtSecondes {
  constructor() {
    super(true)
    this.nbQuestions = 1

    this.correctionDetailleeDisponible = false
  }
}
