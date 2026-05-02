import ExerciceLabyrintheMultiplesDe2a9 from './5A11-1v2'
export const dateDePublication = '01/05/2026'
export const interactifReady = true
export const interactifType = 'custom'

export const titre =
  'Parcourir un labyrinthe de multiples basé sur les critères de divisibilité 3 et 9 - V2'

/**
 * @author Éric Elter
 */

export const uuid = '99860'

export const refs = {
  'fr-fr': ['5A11-1v2b'],
  'fr-ch': [],
}
export default class ExerciceLabyrintheDivisibilite3Ou9V2 extends ExerciceLabyrintheMultiplesDe2a9 {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Critère de divisibilité',
      5,
      '1 : Par 3\n2 : Par 9\n3 : Au hasard',
    ]
    this.sup = 3
    this.version = 'Que3et9'
  }
}
