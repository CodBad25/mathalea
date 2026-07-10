import PatternIteratif from './auto5N5C'

export const titre =
  'Identifier des régularités et poursuivre une suite de motifs évolutive'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '26/06/2026'

/**
 *
 * @author Eric Elter
 */

export const uuid = 'e99f1'

export const refs = {
  'fr-fr': ['auto5N5A'],
  'fr-2016': ['5I13-1'],
  'fr-ch': [],
}
export default class PatternIteratifPoursuite extends PatternIteratif {
  constructor() {
    super()
    this.sup2 = '1'
    this.nbQuestions = 2
  }
}
