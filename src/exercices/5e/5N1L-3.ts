import { choice } from '../../lib/outils/arrayOutils'
import { randint } from '../../modules/outils'
import ExerciceLabyrinthe from '../_Exercice_labyrinthe'
export const titre = 'Parcourir un labyrinthe de nombres premiers'

export const dateDePublication = '30/10/2026'
export const interactifReady = true
export const interactifType = 'custom'

export const uuid = 'b7aee'
export const refs = {
  'fr-fr': ['5N1L-3'],
  'fr-2016': ['5A12-3v2'],
  'fr-ch': [],
}
/**
 * @author Rémi Angot
 */

export default class ExerciceLabyrintheNombrePremiers extends ExerciceLabyrinthe {
  consigne =
    'Trouver le chemin qui passe par des nombres premiers.' +
    this.consigneDeplacement

  cols = 6
  rows = 6
  primesBelow100 = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
    73, 79, 83, 89, 97,
  ]

  generateGoodAnswers() {
    return choice(this.primesBelow100)
  }

  generateBadAnswers() {
    return randint(1, 100, this.primesBelow100)
  }
}
