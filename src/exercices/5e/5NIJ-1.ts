import { choice } from '../../lib/outils/arrayOutils'
import { randint } from '../../modules/outils'
import ExerciceLabyrinthe from '../_Exercice_labyrinthe'
export const titre =
  'Parcourir un labyrinthe des multiples basé sur des critères de divisibilité'

export const dateDePublication = '30/10/2026'
export const interactifReady = true
export const interactifType = 'custom'

export const uuid = '424b2'
export const refs = {
  'fr-fr': ['5NIJ-1'],
  'fr-2016': ['5A11-1v2'],
  'fr-ch': [],
}
/**
 * @author Rémi Angot
 */

export default class ExerciceLabyrintheMultiplesDe2a9 extends ExerciceLabyrinthe {
  k!: number
  constructor() {
    super()
    this.cols = 7
    this.rows = 5
    this.orientation = 'horizontal'
    this.sup = choice([3, 9])
    this.besoinFormulaireNumerique = [
      'Critère de divisibilité',
      5,
      '1 : Par 2\n2 : Par 3\n3 : Par 5\n4 : Par 9\n5 : Au hasard',
    ]
  }

  nouvelleVersion(): void {
    switch (this.sup) {
      case 1:
        this.k = 2
        break
      case 2:
        this.k = 3
        break
      case 3:
        this.k = 5
        break
      case 4:
        this.k = 9
        break
      default:
        this.k = choice([2, 3, 5, 9])
    }

    super.nouvelleVersion()
    this.consigne = `Trouver le chemin qui passe par des multiples de ${this.k}.`
    this.consigne += this.consigneDeplacement
  }

  generateGoodAnswers() {
    return randint(11, 50) * this.k
  }

  generateBadAnswers() {
    return randint(11, 50) * this.k + randint(1, this.k - 1)
  }
}
