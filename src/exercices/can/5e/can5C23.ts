import { choice } from '../../../lib/outils/arrayOutils'
import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { arrondi } from '../../../lib/outils/nombres'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Multiplier par 1,5 ou 2,5 ou ...'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '08/12/2022'
/**
 * @author  Gilles Mora
 *
 *
 */

export const uuid = 'cb5d5'

export const refs = {
  'fr-fr': ['can5C23'],
  'fr-ch': [],
}
export default class MultiplierPar extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const a = randint(6, 29, [10, 20, 30])
    const b = choice([15, 25, 35, 45, 55]) / 10

    this.question = `Calculer $${a}\\times ${texNombre(b, 1)}$.`
    this.correction = `$${a}\\times ${texNombre(b, 1)}=${texNombre(a * b, 1)}$`
    this.reponse = arrondi(a * b, 1)
    this.correction += texteEnCouleur(`
    <br> Mentalement : <br>
    $${a}\\times ${texNombre(b, 1)}=${a}\\times ${Math.floor(b)}+\\underbrace{${a}\\times 0,5}_{\\text{La moitié de }${a}}
    =${a * Math.floor(b)}+${texNombre(a / 2, 1)}=${texNombre(this.reponse, 1)}$  `)
  }
}
