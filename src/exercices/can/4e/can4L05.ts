import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
  ecritureParentheseSiNegatif,
  rienSi1,
} from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Développer avec la simple distributivité'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDeModifImportante = '28/07/2025'
/**
 * @author Gilles Mora
 */
export const uuid = '56a2d'

export const refs = {
  'fr-fr': ['can4L05'],
  'fr-ch': [],
}
export default class DeveloppementNiveau1 extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecVariable
    this.versionQcmDisponible = true
    this.optionsChampTexte = { texteAvant: '<br>$A=$' }
  }

  nouvelleVersion() {
    let a, b, k, inconnue
    switch (this.quotaRandint('cas', 1, 2)) {
      case 1: // developpement k*(a+b)
        a = randint(-5, 4, 0)
        b = randint(1, 10) * choice([-1, 1])
        k = randint(2, 7) * choice([-1, 1])
        inconnue = choice(['x', 'y'])

        this.question = this.versionQcm
          ? `La forme développée de $A=(${rienSi1(a)}${inconnue}${ecritureAlgebrique(b)})\\times${ecritureParentheseSiNegatif(k)}$ est : `
          : `Donner la forme développée et réduite de $A=(${rienSi1(a)}${inconnue}${ecritureAlgebrique(b)})\\times${ecritureParentheseSiNegatif(k)}$.`
        this.correction = `On développe en utilisant la simple distributivité : <br>
           $\\begin{aligned}
           A&=(${rienSi1(a)}${inconnue}${ecritureAlgebrique(b)})\\times${ecritureParentheseSiNegatif(k)}\\\\
           &=${k}\\times ${a < 0 ? `(${rienSi1(a)}${inconnue})` : `${rienSi1(a)}${inconnue}`}+${ecritureParentheseSiNegatif(k)}\\times${ecritureParentheseSiNegatif(b)}\\\\
           &=${miseEnEvidence(`${k * a}${inconnue}${ecritureAlgebrique(k * b)}`)}
           \\end{aligned}$`

        this.reponse = this.versionQcm
          ? `$${k * a}${inconnue}${ecritureAlgebrique(k * b)}$`
          : `${k * a}${inconnue}${ecritureAlgebrique(k * b)}`
        // Distracteurs basés sur les erreurs courantes
        this.distracteurs = [
          // Erreur: oubli de distribuer sur le terme constant
          `$${rienSi1(k * a)}${inconnue}${ecritureAlgebrique(b)}$`,

          // Erreur: oubli de distribuer sur le terme en x
          `$${rienSi1(a)}${inconnue}${ecritureAlgebrique(k * b)}$`,

          // Erreur: distribution incorrecte des signes
          `$${rienSi1(k * a)}${inconnue}${ecritureAlgebrique(-k * b)}$`,
          //
        ]
        break

      case 2: // developpement kx*(ax+b)
        a = randint(-5, 5, 0)
        b = randint(1, 9) * choice([-1, 1])
        k = randint(1, 10) * choice([-1, 1])
        inconnue = choice(['x', 'y'])

        this.question = this.versionQcm
          ? `La forme développée de $A=${rienSi1(k)}${inconnue}(${rienSi1(a)}${inconnue}${ecritureAlgebrique(b)})$ est : `
          : `Donner la forme développée et réduite de $A=${rienSi1(k)}${inconnue}(${rienSi1(a)}${inconnue}${ecritureAlgebrique(b)})$.`

        this.correction = `On développe en utilisant la simple distributivité : <br>
           $\\begin{aligned}
           A&=${rienSi1(k)}${inconnue}(${rienSi1(a)}${inconnue}${ecritureAlgebrique(b)})\\\\
           &=${rienSi1(k)}${inconnue}\\times ${a < 0 ? `(${rienSi1(a)}${inconnue})` : `${rienSi1(a)}${inconnue}`} ${ecritureAlgebriqueSauf1(k)}${inconnue}\\times ${ecritureParentheseSiNegatif(b)}\\\\
           &=${miseEnEvidence(`${k * a}${inconnue}^2${ecritureAlgebrique(k * b)}${inconnue}`)}
           \\end{aligned}$`

        this.reponse = this.versionQcm
          ? `$${k * a}${inconnue}^2${ecritureAlgebrique(k * b)}${inconnue}$`
          : `${k * a}${inconnue}^2${ecritureAlgebrique(k * b)}${inconnue}`
        this.distracteurs = [
          // Erreur: oubli de l'exposant 2 sur x dans le premier terme
          `$${rienSi1(k * a)}${inconnue}${ecritureAlgebrique(k * b)}${inconnue}$`,

          // Erreur: oubli de distribuer k sur le terme constant
          `$${rienSi1(k * a)}${inconnue}^2${ecritureAlgebriqueSauf1(b)}${inconnue}$`,

          // Erreur: mauvaise gestion des exposants (x² sur les deux termes)
          `$${rienSi1(k * a)}${inconnue}^2${ecritureAlgebrique(k * b)}${inconnue}^2$`,
        ]
        break
    }

    this.canReponseACompleter = '\\hspace*{-1.5cm}$A=\\ldots$'
  }
}
