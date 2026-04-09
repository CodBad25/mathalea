import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { arrondi } from '../../../lib/outils/nombres'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer une somme (partie entière/décimale)'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '16/11/2021'

/**
 * @author Jean-claude Lhote
 * Date de publication septembre 2021

 */
export const uuid = '42453'

export const refs = {
  'fr-fr': ['canc3N05'],
  'fr-ch': ['NR'],
}
export default class CompositionDeNombreDecimalC3 extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.formatChampTexte = KeyboardType.clavierDeBase
  }

  nouvelleVersion() {
    const a = randint(1, 9)
    const b = randint(1, 9, a)
    const c = randint(1, 9, [a, b])
    switch (choice([1, 2, 3])) {
      case 1:
        this.reponse = arrondi(a + b / 10 + c / 100, 2)
        this.question = `Calculer $${a} + ${texNombre(b / 10 + c / 100, 2)}$.`
        this.correction = `$${a} + ${texNombre(b / 10 + c / 100, 2)}=${texNombre(this.reponse, 2)}$`
        break
      case 2:
        this.reponse = arrondi(a + b / 100 + c / 1000, 3)
        this.question = `Calculer $${a} + ${texNombre(b / 100 + c / 1000, 3)}$.`
        this.correction = `$${a}+ ${texNombre(b / 100 + c / 1000, 3)}=${texNombre(this.reponse, 3)}$`
        break
      case 3:
        this.reponse = arrondi(a + b / 10 + c / 1000, 3)
        this.question = `Calculer $${a} + ${texNombre(b / 10 + c / 1000, 3)}$.`
        this.correction = `$${a} + ${texNombre(b / 10 + c / 1000, 3)}=${texNombre(this.reponse, 3)}$`
        break
    }
  }
}
