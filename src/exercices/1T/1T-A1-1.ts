import EcritureFractionnaire from '../5e/5N11-3'
export const titre = 'Écriture fractionnaire, écriture décimale, pourcentage'
export const dateDePublication = '19/06/2022'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcType = 'AMCNum'
export const amcReady = true

/**
 * Clone de 5N11-3 pour les 1er
 * @author Rémi Angot
 */

export const uuid = 'c988f'

export const refs = {
  'fr-fr': ['1T-A1-1', 'BP2AutoC5'],
  'fr-ch': [],
}
export default class EcritureFractionnaire1T extends EcritureFractionnaire {
  constructor() {
    super()
    this.sup = 1
  }
}
