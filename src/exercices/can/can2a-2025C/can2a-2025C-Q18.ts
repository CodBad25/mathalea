import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { ecritureAlgebrique, ecritureAlgebriqueSauf1, ecritureParentheseSiNegatif, reduirePolynomeDegre3, rienSi1 } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
export const titre = 'Calculer l\'image d\'un nombre par une fonction polynôme du second degré'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'qaqh1'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['NR'],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class Can2a2025CQ18 extends ExerciceCan {
  enonce(a?: number, b?: number, c?: number, x0?: number): void {
    if (a == null || b == null || c == null || x0 == null) {
      a = randint(2, 3) 
      b = randint(-5, 5, [0])
      c = randint(-5, 5)
      x0 = randint(-3, -1)
    }

    const resultat = a * x0 * x0 + b * x0 + c

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.reponse = String(resultat)

    this.question = `Soit la fonction $f$ définie par $f(x)=${reduirePolynomeDegre3(0, a, b, c)}$.<br>
    Quelle est l'image de $${x0}$ par $f$ ?<br>`
  

    this.correction = `$f(${x0})=${rienSi1(a)}\\times ${ecritureParentheseSiNegatif(x0)}^2${ecritureAlgebriqueSauf1(b)}\\times ${ecritureParentheseSiNegatif(x0)}${ecritureAlgebrique(c)}=${a * x0 * x0}${ecritureAlgebrique(b * x0)}${ecritureAlgebrique(c)}=${miseEnEvidence(String(resultat))}$`

    this.canEnonce = `Soit la fonction $f$ définie par $f(x)=${reduirePolynomeDegre3(0, a, b, c)}$.<br>
    Quelle est l'image de $${x0}$ par $f$ ?`
    this.canReponseACompleter = ''
  }

  nouvelleVersion(): void {
    this.canOfficielle ? this.enonce(2, 1, -1, -2) : this.enonce()
  }
}
