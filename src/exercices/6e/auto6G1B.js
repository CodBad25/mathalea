import VocabulaireDesTriangles from '../5e/VocabulaireDesTriangles'
export const titre = 'Utiliser le vocabulaire des triangles'
export const interactifReady = false

/**
 * Vocabulaire des triangles
 * @author Sébastien Lozano
 */
export const uuid = 'b5eaf'

export const refs = {
  'fr-fr': ['auto6G1B'],
  'fr-2016': ['6G20-2'],
  'fr-ch': [],
}
export default class VocabulaireDesTriangles6e extends VocabulaireDesTriangles {
  constructor() {
    super()
    this.classe = 6
  }
}
