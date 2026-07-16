import { texNombre } from '../../../lib/outils/texNombre'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Trouver $a+1$ ou $a-1$ connaissant $2a$'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 * Date de publication
*/
export const uuid = 'cc70a'

export const refs = {
  'fr-fr': ['can5L01', '5N5B-flash1'],
  'fr-ch': [],
}
export default class MoitiePlusOuMoinsUn extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const a = this.quotaRandint('a', 21, 35, [30]) / 10
    if (this.quotaChoice('plusOuMoinsUn', [true, false])) {
      this.reponse = a / 2 + 1
      this.question = `On a  $2\\times a=${texNombre(a)}$, combien vaut $a+1$ ?`
      this.correction = `$2\\times a=${texNombre(a)}$, donc le nombre $a$ est égal à $\\dfrac{${texNombre(a)}}{2}=${texNombre(a / 2)}$.<br>Donc $a+1=${texNombre(a / 2)}+1=${texNombre(a / 2 + 1)}$.`
    } else {
      this.reponse = a / 2 - 1
      this.question = `On a  $2\\times a=${texNombre(a)}$, combien vaut $a-1$ ?`
      this.correction = `$2\\times a=${texNombre(a)}$, donc le nombre $a$ est égal à $\\dfrac{${texNombre(a)}}{2}=${texNombre(a / 2)}$.<br>Donc $a-1=${texNombre(a / 2)}-1=${texNombre(a / 2 - 1)}$.`
    }
  }
}
