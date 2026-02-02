import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { ecritureParentheseSiNegatif } from '../../../lib/outils/ecritures'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'
import { arrondi } from '../../../lib/outils/nombres'
import { creerNomDePolygone } from '../../../lib/outils/outilString'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer les coordonnées du milieu'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDeModifImportante = '29/11/2023'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 * Date de publication septembre 2021
*/
export const uuid = '8bc88'

export const refs = {
  'fr-fr': ['can2G04'],
  'fr-ch': [],
}
export default class CalculCoordonneesMilieu extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierFullOperations
  }

  nouvelleVersion() {
    let a, b, c, d
    const nom = creerNomDePolygone(2, 'MPQDO')
    switch (choice(['a', 'b'])) {
      case 'a':
        a = randint(-10, 10)
        b = randint(-10, 10, 0)
        c = randint(-10, 10)
        d = randint(-10, 10, 0)
        this.question = `Dans un repère du plan, on donne $${nom[0]}(${a}\\,;\\,${c})$ et $${nom[1]}(${b}\\,;\\,${d})$.<br>
        Déterminer les coordonnées du milieu $M$ de $[${nom[0] + nom[1]}]$ sous forme décimale.<br><br>`
        this.optionsChampTexte = { texteAvant: '$M$ a pour coordonnées :' }
        this.correction = `Les coordonnées du milieu $M$ sont données par :
        $\\left(\\dfrac{${a}+${b}}{2}\\,;\\,\\dfrac{${c}+${d}}{2}\\right)=
        \\left(\\dfrac{${texNombre(a + b, 0)}}{2}\\,;\\,\\dfrac{${texNombre(c + d, 0)}}{2}\\right)=
        ${miseEnEvidence('(')} ${miseEnEvidence(`${texNombre((a + b) / 2, 1)}`)}\\,${miseEnEvidence(';')}\\,${miseEnEvidence(`${texNombre((c + d) / 2, 1)}`)} ${miseEnEvidence(')')}$<br><br>`
        this.correction += texteEnCouleur(
          ` Mentalement : <br>
        On calcule les moyennes des abscisses et des ordonnées des deux points.
         `,
          'blue',
        )
        this.reponse = `(${arrondi((a + b) / 2, 1)};${arrondi((c + d) / 2, 1)})`

        break
      case 'b':
        a = randint(-9, 9, 0)
        b = randint(-9, 9, 0)

        this.question = `Dans un repère du plan d'origine $O$, on donne $${nom[0]}(${a}\\,;\\,${b})$.<br>
        Déterminer les coordonnées du milieu $M$ de $[O${nom[0]}]$ sous forme décimale.<br><br>`
        this.optionsChampTexte = { texteAvant: '$M$ a pour coordonnées :' }
        this.correction = `Comme les coordonnées du point $O$ sont $(0\\,;\\,0)$, les coordonnées du milieu $M$ sont données par :
        $\\left(\\dfrac{0+${ecritureParentheseSiNegatif(a)}}{2}\\,;\\,\\dfrac{0+${ecritureParentheseSiNegatif(b)}}{2}\\right)
        =${miseEnEvidence('(')} ${miseEnEvidence(`${texNombre(a / 2)}`)}\\,${miseEnEvidence(';')}\\,${miseEnEvidence(`${texNombre(b / 2)}`)} ${miseEnEvidence(')')}$<br><br>`
        this.correction += texteEnCouleur(
          ` Mentalement : <br>
       Puisque le premier point est l'origine du repère, les coordonnées du milieu sont données par la moitié de l'abscisse et de l'ordonnée du deuxième point.
         `,
          'blue',
        )
        this.reponse = `(${arrondi(a / 2, 1)};${arrondi(b / 2, 1)})`

        break
    }
    this.canEnonce = this.question // 'Compléter'
    this.canReponseACompleter = ''
  }
}
