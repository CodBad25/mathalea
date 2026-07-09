import PerimetreOuAireDeFiguresComposees from '../5e/5G2E-5'

export const titre = 'Calculer périmètre de figures composées'
export const dateDePublication = '27/07/2025'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * Calculer périmètre de figures composées
 * @author Éric Elter (comme clone de 6M11-2 de Rémi Angot)
 */

export const uuid = '7433c'

export const refs = {
  'fr-fr': ['6M1D'],
  'fr-2016': ['6M11-2a'],
  'fr-ch': [],
}
export default class PerimetreDeFiguresComposees extends PerimetreOuAireDeFiguresComposees {
  constructor() {
    super()
    this.besoinFormulaire4Numerique = false
    this.sup4 = 1
    this.sup = '4-5-6'
  }
}
