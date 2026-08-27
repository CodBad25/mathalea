import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
} from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = "Résoudre $|z-z'|=|z-z''|$"
export const interactifReady = false

export const dateDePublication = '05/02/2025'

export const uuid = '9772d'
export const refs = {
  'fr-fr': ['canTEC2-02'],
  'fr-ch': [],
}

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Stéphane Guyon

*/
export default class NomExercice extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const a = randint(-7, 7, 0)
    const b = randint(-7, 7, 0)
    const c = randint(-7, 7, [0, a])
    const d = randint(-7, 7, [0, b])

    this.question = 'Soit $z\\in\\mathbb{C}$. <br>'
    this.question += `Déterminer l'ensemble des points $M$ du plan complexe, d'affixe $z$, qui vérifient $\\vert z${ecritureAlgebrique(-a)}${ecritureAlgebriqueSauf1(-b)}\\mathrm{i}\\vert=\\vert z${ecritureAlgebrique(-c)}${ecritureAlgebriqueSauf1(-d)}\\mathrm{i}\\vert$`
    this.correction = `Soit $A$ le point du plan complexe d'affixe $z_A=${a}${ecritureAlgebriqueSauf1(b)}\\mathrm{i}$`
    this.correction += `<br>et  $B$ le point du plan complexe d'affixe $z_B=${c}${ecritureAlgebriqueSauf1(d)}\\mathrm{i}$.`
    this.correction += `<br>On sait que $AM=\\vert z-z_A\\vert=\\vert z${ecritureAlgebrique(-a)}${ecritureAlgebriqueSauf1(-b)}\\mathrm{i}\\vert$.<br>`
    this.correction += `<br>et que  $BM=\\vert z-z_B\\vert=\\vert z${ecritureAlgebrique(-c)}${ecritureAlgebriqueSauf1(-d)}\\mathrm{i}\\vert$.<br>`
    this.correction += `<br>On a : $\\vert z${ecritureAlgebrique(-a)}${ecritureAlgebriqueSauf1(-b)}\\mathrm{i}\\vert=\\vert z${ecritureAlgebrique(-c)}${ecritureAlgebriqueSauf1(-d)}\\mathrm{i}\\vert\\iff AM=MB$.`
    this.correction +=
      "<br>La solution est donc l'ensemble des points $M$ qui sont équidistants des points $A$ et $B$.<br>"
    this.correction += `<br>L'ensemble solution est donc $${miseEnEvidence('\\text{la médiatrice du segment [AB]}')}$.`
    this.reponse = ''
  }
}
