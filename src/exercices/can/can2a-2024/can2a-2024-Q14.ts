/**
 * ⚠️ Cet exercice est utilisé dans le test : tests/e2e/tests/view/viewcan.2024.2e.test.ts ⚠️
 */

import { texPrix, texteGras } from '../../../lib/format/style'
import { propositionsQcm } from '../../../lib/interactif/qcm'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer un prix après des évolutions successives'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = 'd51f8'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class NomExercice extends ExerciceSimple {
  constructor() {
    super()

    this.canOfficielle = false
    this.formatInteractif = 'qcm'
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    const valeurs = this.canOfficielle
      ? [100, 10, 99, 99]
      : choice([
          [100, 10, 99, 101],
          [1000, 1, 999.9, 1000.1],
          [1000, 10, 990, 1010],
          [10, 10, 9.9, 10.1],
          [1, 10, 0.99, 1.01],
          [100, 50, 75, 125],
          [10, 50, 7.5, 15],
        ])
    const val1 = valeurs[0] + (valeurs[0] * valeurs[1]) / 100
    const question = `Un article à $${texNombre(valeurs[0])}$ € subit une hausse de $${valeurs[1]}\\,\\%$ puis une baisse de $${valeurs[1]}\\,\\%$.<br>
    Son nouveau prix est maintenant de : `
    //  this.reponse = valeurs[2] Pas de this.reponse pour un qcm !
    this.autoCorrection[0] = {
      options: { ordered: false },
      enonce: question,
      propositions: [
        {
          texte: `$${texNombre(valeurs[2], 2)}$ €`,
          statut: true,
        },
        {
          texte: `$${texNombre(valeurs[0], 2)}$ €`,
          statut: false,
        },
        {
          texte: `$${texNombre(valeurs[3], 2)}$ €`,
          statut: false,
        },
      ],
    }
    const qcm = propositionsQcm(this, 0)

    this.question = question + qcm.texte

    this.correction = ` $${valeurs[1]}\\,\\%$ de  $${texNombre(valeurs[0])}$ € est égal à $${texNombre((valeurs[0] * valeurs[1]) / 100, 2)}$ €. <br>
        Après la hausse de $${valeurs[1]}\\,\\%$, le prix est de $${texNombre(valeurs[0])}$ € $+$ $${texNombre((valeurs[0] * valeurs[1]) / 100, 2)}$ € $=${texNombre(val1, 2)}$ €.<br>
        $${valeurs[1]}\\,\\%$ de  $${texNombre(val1)}$ € est égal à $${texNombre((val1 * valeurs[1]) / 100, 2)}$ €. <br>
        Après la baisse de $${valeurs[1]}\\,\\%$, le prix est de  $${texNombre(val1)}$ € $-$ $${texNombre((val1 * valeurs[1]) / 100, 2)}$ € $=${texNombre(val1 - (val1 * valeurs[1]) / 100)}$ €.<br>
        Le nouveau prix est $${miseEnEvidence(texPrix(valeurs[2]))}$ €. <br>
        ${texteGras('Autre méthode :<br> ')}
        Augmenter de $${valeurs[1]}\\,\\%$ revient à multiplier par $${texNombre(1 + valeurs[1] / 100, 2)}$.<br>
Diminuer de $${valeurs[1]}\\,\\%$ revient à multiplier par $${texNombre(1 - valeurs[1] / 100, 2)}$.<br>
Donc le prix est multiplié par $${texNombre(1 + valeurs[1] / 100)}\\times ${texNombre(1 - valeurs[1] / 100, 2)}$, c'est-à-dire par $${texNombre((1 + valeurs[1] / 100) * (1 - valeurs[1] / 100), 2)}$.<br>
Le prix final est donc inférieur au prix initial (car on multiplie par un nombre inférieur à $1$).
        `
    this.canEnonce = `Un article à $${texNombre(valeurs[0])}$ € subit une hausse de $${texNombre(valeurs[1])}\\,\\%$ puis une baisse de $${texNombre(valeurs[1])}\\,\\%$.<br>
        Son nouveau prix est maintenant de :`
    this.canReponseACompleter = `\\faSquare[regular] $${texNombre(valeurs[2], 2)}$ € <br>\\faSquare[regular] $${texNombre(valeurs[0], 2)}$ €<br>\\faSquare[regular] $${texNombre(valeurs[3], 2)}$ € `
  }
}
