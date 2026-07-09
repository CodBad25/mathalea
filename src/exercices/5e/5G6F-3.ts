import TracerQuadrilatèresParticuliers from '../CM2/CM2G3D-1'

export const titre =
  'Construire des quadrilatères particuliers et auto-vérification'
export const interactifReady = false
export const dateDePublication = '19/12/2022'

/**
 * Tracer des quadrilatères particuliers et auto-vérification
 *
 * @author Mickael Guironnet
 */

export const uuid = 'b3a4c'

export const refs = {
  'fr-fr': ['5G6F-3'],
  'fr-2016': ['6G21-5', '5G41-2'],
  'fr-ch': [],
}
export default class ConstruireQuadrilatèresParticuliers extends TracerQuadrilatèresParticuliers {
  constructor() {
    super()
    this.sup = '1-2-3-4-5-6'
  }
}
