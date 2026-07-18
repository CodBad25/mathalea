import {
  ecritureNombreRelatif,
  ecritureNombreRelatifc,
} from '../../../lib/outils/ecritures'
import ExerciceSimple from '../../ExerciceSimple'
import { randint } from '../../../modules/outils'
export const interactifType = 'mathLive'
export const interactifReady = true
export const titre = 'Trouver un  entier relatif (addition à trou)'
export const dateDePublication = '19/10/2023'
/**
 * @author  Gilles Mora (J'ai repris l'ex 5R20-2)
 *

 */
export const uuid = '2745a'

export const refs = {
  'fr-fr': ['can5C27', '5N2G-flash2'],
  'fr-ch': ['NR'],
}
export default class AdditionRelatifATrou extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.sup = 20
  }

  nouvelleVersion() {
    let a = this.quotaRandint('a', 1, this.sup)
    let b = this.quotaRandint('b', 1, this.sup)
    const k = this.quotaChoice('k', [
      [-1, -1],
      [-1, 1],
      [1, -1],
    ]) // Les deux nombres relatifs ne peuvent pas être tous les deux positifs
    a = a * k[0]
    b = b * k[1]
    const termes = [
      ecritureNombreRelatif(a),
      '\\ldots\\ldots',
      ecritureNombreRelatifc(a),
      ecritureNombreRelatifc(b),
    ]
    const rang1 = randint(0, 1)
    const rang2 = 1 - rang1
    this.question =
      "Quel nombre doit-on écrire pour que l'égalité soit correcte ? <br>"
    this.question +=
      '$ ' +
      termes[rang1] +
      ' + ' +
      termes[rang2] +
      ' = ' +
      ecritureNombreRelatif(a + b) +
      ' $'

    this.correction =
      '$ ' +
      termes[rang1 + 2] +
      ' + ' +
      termes[rang2 + 2] +
      ' = ' +
      ecritureNombreRelatifc(a + b) +
      ' $'
    this.reponse = b

    this.canEnonce = 'Compléter.'
    this.canReponseACompleter =
      '$ ' +
      termes[rang1] +
      ' + ' +
      termes[rang2] +
      ' = ' +
      ecritureNombreRelatif(a + b) +
      ' $'
  }
}
