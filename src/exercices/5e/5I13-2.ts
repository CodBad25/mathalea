import PatternIteratif from './5I13'

export const titre =
  "Trouver le nombre d'éléments pour une étape donnée dans une suite de motifs évolutive"
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '26/06/2026'

/**
 *
 * @author Eric Elter
 */

export const uuid = 'fb98e'

export const refs = {
  'fr-fr': ['5I13-2'],
  'fr-ch': [],
}
export default class PatternIteratifNbElements extends PatternIteratif {
  constructor() {
    super()
    this.sup2 = '2-3-4'
    this.nbQuestions = 1
  }
}
