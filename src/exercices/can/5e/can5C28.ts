import { choice } from '../../../lib/outils/arrayOutils'
import ExerciceSimple from '../../ExerciceSimple'
import {
  ecritureAlgebrique,
  ecritureParentheseSiNegatif,
} from '../../../lib/outils/ecritures'
import { randint } from '../../../modules/outils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { sp } from '../../../lib/outils/outilString'
export const interactifType = 'mathLive'
export const interactifReady = true
export const titre =
  'Trouver un  entier relatif (addition à trou, écriture simplifiée)'
export const dateDePublication = '19/10/2023'
/**
 * @author  Gilles Mora (J'ai repris l'ex 5R20-2)
 *

 */
export const uuid = 'f9b48'

export const refs = {
  'fr-fr': ['can5C28', '5N2I-flash3'],
  'fr-ch': [],
}
export default class AdditionRelatifATrou2 extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.sup = 20
  }

  nouvelleVersion() {
    let a = randint(1, this.sup)
    let b = randint(1, this.sup)
    const k = choice([
      [-1, -1],
      [-1, 1],
      [1, -1],
    ]) // Les deux nombres relatifs ne peuvent pas être tous les deux positifs
    a = a * k[0]
    b = b * k[1]
    const rang1 = randint(0, 1)
    const rang2 = 1 - rang1
    const termes = [
      rang1 === 0 ? a : ecritureAlgebrique(a),
      (rang2 === 1 ? '+' : '') + '\\ldots',
      rang1 === 0 ? a : ecritureAlgebrique(a),
      rang2 === 1
        ? '+' + miseEnEvidence(String(ecritureParentheseSiNegatif(b)))
        : miseEnEvidence(b),
    ]

    this.question =
      "Quel nombre doit-on écrire pour que l'égalité soit correcte ? <br>"

    this.question +=
      '$ ' + termes[rang1] + '  ' + termes[rang2] + ' = ' + (a + b) + ' $'
    this.canEnonce = 'Compléter.'
    this.canReponseACompleter =
      '$ ' + termes[rang1] + '  ' + termes[rang2] + ' = ' + (a + b) + ' $'
    this.correction =
      '$ ' + termes[rang1 + 2] + termes[rang2 + 2] + ' = ' + (a + b) + ' $'
    if (rang2 === 1 && b < 0)
      this.correction +=
        '<br>$ ' +
        termes[rang1 + 2] +
        sp(1) +
        miseEnEvidence(b) +
        ' = ' +
        (a + b) +
        ' $'
    this.reponse = b
  }
}
