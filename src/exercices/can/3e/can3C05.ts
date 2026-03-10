import { rienSi1 } from '../../../lib/outils/ecritures'
import { arrondi } from '../../../lib/outils/nombres'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer avec une puissance de 10'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora
 * Créé pendant l'été 2021

 * Date de publication
*/
export const uuid = 'ce089'

export const refs = {
  'fr-fr': ['can3C05'],
  'fr-ch': [],
}
export default class CalculPuissance10 extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const a = randint(1, 6)
    const n = arrondi(2 * randint(1, 6) + 1) / 2
    const N = arrondi(2 * randint(1, 6, a) + 1) / 2
    const c = randint(1, 3)
    const d = randint(1, 3)
    this.question = `Calculer sous forme décimale $B=${texNombre(n)}\\times 10^{${rienSi1(c)}}+${texNombre(N)}\\times 10^{${rienSi1(d)}}$.`
    this.correction = `$B=${texNombre(n)}\\times 10^{${rienSi1(c)}}+${texNombre(N)}\\times 10^{${rienSi1(d)}}=${texNombre(n * 10 ** c)}+${texNombre(N * 10 ** d)}=${texNombre(n * 10 ** c + N * 10 ** d)}$.`
    this.reponse = arrondi(n * 10 ** c + N * 10 ** d)
  }
}
