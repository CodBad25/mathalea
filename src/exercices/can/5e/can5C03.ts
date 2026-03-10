import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer une différence d’entiers'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '62e1f'

export const refs = {
  'fr-fr': ['can5C03'],
  'fr-ch': [],
}
export default class DifferenceEntiers5e extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const b = randint(41, 69, [50, 60])
    const a = randint(2, 30) + 100
    this.reponse = a - b
    this.question = `Calculer $${a} - ${b}$.`
    this.correction = `$${a} - ${b}=${a - b}$`
    this.correction += texteEnCouleur(`<br> Mentalement : <br>
    On décompose le calcul $${a} - ${b}$ en  $(100+${a - 100})- ${b}$.<br>
    On obtient : <br>
    
    $\\begin{aligned}
    \\underbrace{100-${b}}_{${100 - b}}+${a - 100}&=${100 - b}+${a - 100}\\\\
    &=${a - b}
    \\end{aligned}$<br>
       Cela donne :  $${a} - ${b}=${a - b}$.
      `)
  }
}
