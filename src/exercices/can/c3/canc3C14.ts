import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre =
  'Connaitre les tables de multiplication (avec des divisions)'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '24/01/2023'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 * Date de publication
*/

export const uuid = 'd61d9'

export const refs = {
  'fr-fr': ['canc3C14'],
  'fr-ch': [],
}
export default class TableDivisions extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.formatChampTexte = KeyboardType.clavierNumbers
  }

  nouvelleVersion() {
    switch (choice([1, 1, 2])) {
      case 1:
        {
          const a = randint(2, 9)
          const b = randint(4, 10)
          const c = a * b
          if (choice([true, false])) {
            this.question = `Compléter : <br>$${c}\\div .... =${b}$`
            this.correction = `$${c}\\div ${miseEnEvidence(a)} =${b}$`
            this.canEnonce = 'Compléter.'
            this.canReponseACompleter = `$${c}\\div .... =${b}$`
            this.reponse = a
          } else {
            this.question = `Compléter :<br> $ .... \\div ${a}=${b}$`
            this.correction = `$ ${miseEnEvidence(c)} \\div ${a}=${b}$`
            this.canEnonce = 'Compléter.'
            this.canReponseACompleter = `$ .... \\div ${a}=${b}$`
            this.reponse = c
          }
        }
        break

      case 2:
        {
          const a = randint(3, 9)
          const b = randint(5, 9)
          const c = a * b
          this.reponse = b
          this.question = `Calculer $${c} \\div ${a}$.`
          this.correction = `$${c} \\div ${a}=${miseEnEvidence(b)}$`
        }
        break
    }
  }
}
