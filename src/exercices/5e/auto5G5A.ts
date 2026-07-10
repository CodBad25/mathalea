import VocabulaireDesTriangles from './VocabulaireDesTriangles'
export const titre = 'Reconnaître des triangles'
export const interactifReady = false

/**
 * @author Éric Elter (pour le clone)
 */
export const uuid = '7353f'

export const refs = {
  'fr-fr': ['auto5G5A'],
  'fr-2016': ['5G20-1b'],
  'fr-ch': [],
}
export default class VocabulaireDesTrianglesAvecFigures extends VocabulaireDesTriangles {
  constructor() {
    super()
    this.sup = true
  }
}
