import SymetrieProprietes from '../5e/5G3B-3'

export const titre = 'Utiliser les propriétés de conservation de la symétrie'
export const dateDePublication = '07/07/2026'
export const interactifReady = true

/**
 * @author Éric Elter
 */

export const uuid = 'f0a09'

export const refs = {
  'fr-fr': ['6G7B-9'],
  'fr-ch': ['10ES3A-1'],
}
export default class SymetrieAxialeProprietes extends SymetrieProprietes {
  constructor() {
    super()
    this.besoinFormulaire3Numerique = false
    this.sup3 = 2
  }
}
