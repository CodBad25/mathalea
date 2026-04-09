import AireCarresRectanglesTriangles from '../5e/5M11'

export const titre = "Calculer l'aire de carré, rectangle ou triangle rectangle"
export const dateDePublication = '30/07/2025'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * Calculer l'aire de carré, rectangle ou triangle rectangle
 * @author Éric Elter (comme clone de 6M11 de Rémi Angot)
 */

export const uuid = 'c6fb2'

export const refs = {
  'fr-fr': ['6M2C'],
  'fr-2016': ['6M11a'],
  'fr-ch': [],
}
export default class AireCarresRectangles extends AireCarresRectanglesTriangles {
  constructor() {
    super()
    this.sup = '1-2'
  }
}
