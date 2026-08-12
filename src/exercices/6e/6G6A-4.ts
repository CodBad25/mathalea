import ConstruireUnTriangle from './6G6A-1'
export const titre =
  'Construire un triangle particulier avec les instruments et auto-vérification'
export const interactifReady = false
export const dateDePublication = '17/12/2022'

/**
 * Construire un triangle quelconque avec les instruments et auto-vérification
 *
 * @author Mickael Guironnet
 */
export const uuid = 'e1e64'

export const refs = {
  'fr-fr': ['6G6A-4'],
  'fr-2016': ['6G21-3'],
  'fr-ch': ['9ES1C-10'],
}
export default class ConstruireUnTriangleParticulier extends ConstruireUnTriangle {
  constructor() {
    super()

    this.sup = 9
    this.nbQuestions = 6
  }
}
