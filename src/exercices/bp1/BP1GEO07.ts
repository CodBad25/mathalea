import ReconnaitreDesSolides from '../6e/auto6G8A'
export const titre = 'Reconnaitre des solides'
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const dateDePublication = '30/07/2026'

/**
 * Clone de auto6G8A pour le Bac Pro Première.
 * Retirer les prismes parmi les types de solides proposés.
 */

export const uuid = 'c93a3'

export const refs = {
  'fr-fr': ['BP1GEO07'],
  'fr-ch': [],
}
export default class ExerciceBP1GEO07 extends ReconnaitreDesSolides {
  constructor() {
    super()
    this.besoinFormulaireTexte = false
    this.sup = '2-3-4-5-6-7'
  }
}
