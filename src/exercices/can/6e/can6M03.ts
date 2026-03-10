import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Convertir en mètres'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote & Gilles Mora
 * Créé pendant l'été 2021

 */
export const uuid = 'd52aa'

export const refs = {
  'fr-fr': ['can6M03', 'auto6M1C-flash2'],
  'fr-ch': [],
}
export default class ConvertirEnM extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let a
    if (choice([true, false])) {
      a = randint(0, 5) * 10 + randint(1, 9)
      this.reponse = a * 1000
      this.question = `$${a}\\text{ km}$ font combien de mètres ?`
      this.correction = `Comme $1\\text{ km}$ $=1000\\text{ m}$, $${a}\\text{ km}$ = $${miseEnEvidence(texNombre(this.reponse))}\\text{ m}$.`

      this.optionsChampTexte = { texteApres: '$\\text{ m}$' }
    } else {
      a = randint(11, 24) * 10 + randint(0, 9)
      this.reponse = a / 100
      this.question = `$${a}\\text{ cm}$ font combien de mètres ?`
      this.correction = `Comme $1\\text{ cm}$ $=0,01\\text{ m}$, $${a}\\text{ cm}$ = $${miseEnEvidence(texNombre(this.reponse))}\\text{ m}$.`

      this.optionsChampTexte = { texteApres: '$\\text{ m}$' }
    }

    this.canReponseACompleter = '$\\dots\\text{ m}$'
  }
}
