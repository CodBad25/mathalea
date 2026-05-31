import PaternRatio from '../5e/5P12-2'
export const titre = "Trouver le terme général d'un pattern géométrique"
export const dateDePublication = '30/05/2026'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * @author Éric Elter
 */

export const uuid = 'fe750'

export const refs = {
  'fr-fr': ['3L16'],
  'fr-ch': [],
}
export default class PaternRatio3eme extends PaternRatio {
  constructor() {
    super()
    this.niveau = '3e'
    this.sup2 = '4'
    this.sup3 = '101-102'
  }
}
