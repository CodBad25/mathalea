import CompareAireEtPerimetreAvecRectangle from './auto6M2A'

export const dateDePublication = '28/07/2025'
export const titre = 'Comparer périmètres de figures'
export const interactifReady = true
export const interactifType = 'qcm'

/**
 * Comparer périmètres de figures avec ceux d'un rectangle référence
 * @author Éric Elter
 */
export const uuid = '316d2'

export const refs = {
  'fr-fr': ['auto6M1E'],
  'fr-2016': ['6M21-1'],
  'fr-ch': [''],
}
export default class ComparePerimetreAvecRectangle extends CompareAireEtPerimetreAvecRectangle {
  constructor() {
    super()
    this.sup2 = 1
    this.besoinFormulaire2Numerique = false
  }
}
