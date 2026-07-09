import { choice } from '../../../lib/outils/arrayOutils'
import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Trouver le reste d’une division euclidienne'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = 'bc6a9'

export const refs = {
  'fr-fr': ['can5C06', 'auto5N1B-flash1'],
  'fr-ch': [],
}
export default class ResteDivision5e extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const a = choice([25, 20, 50, 40, 15])
    const b = randint(5, a - 1)
    const c = randint(3, 9)
    const d = c * a + b
    this.question = `Quel est le reste de la division de $${d}$ par $${a}$ ?`
    this.correction = `$${d}=${a} \\times ${c} + ${b}$ avec $${b}<${a}$ donc le reste de la division de $${d}$ par $${a}$ est $${b}$.<br>`
    this.correction += texteEnCouleur(`Mentalement : <br>
    On cherche le plus grand multiple de $${a}$ inférieur à $${d}$. C'est $${a} \\times ${c}=${a * c}$.<br>
    Comme $${d}=${a * c}+${b}$, on en déduit que le reste de la division euclidienne de $${d}$ par $${a}$ est  $${b}$.`)
    this.reponse = b
  }
}
