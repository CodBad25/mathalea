import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { reduirePolynomeDegre3 } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { context } from '../../../modules/context'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Développer avec les égalités remarquables'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '25/10/2021'
export const dateDeModifImportante = '12/07/2025'
/**
 * utilisation des égalités remarquables pour développer
 * @author Gilles Mora, Nicolas Talabardon (création des distracteurs, finalisation de la version QCM et quelques mises en forme)
 */
export const uuid = '4c675'
export const refs = {
  'fr-fr': ['can2L06'],
  'fr-ch': [],
}
export default class DevelopperEgalitesRemarquables extends ExerciceSimple {
  constructor() {
    super()
    this.versionQcmDisponible = true
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecVariable
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.optionsDeComparaison = { developpementEgal: true }
  }

  nouvelleVersion() {
    const inconnue = choice(['x', 'y', 'a'])
    const a = randint(1, 9)
    const b = randint(2, 5)
    const expression1 = `$(${inconnue}+${a})^2$` // (x+a)^2
    const expression2 = `$(${inconnue}-${a})^2$` // (x-a)^2
    const expression3 = `$(${inconnue}-${a})(${inconnue}+${a})$` // (x-a)(x+a)
    const expression4 = `$(${b}${inconnue}+${a})^2$` // (bx+a)^2 avec b>1
    const expression5 = `$(${b}${inconnue}-${a})^2$` // (bx-a)^2 avec b>1
    const expression6 = `$(${b}${inconnue}-${a})(${b}${inconnue}+${a})$` // (bx-a)(bx+a) avec b>1
    switch (
      randint(1, 6) //, 'b'
    ) {
      case 1:
        if (this.versionQcm) {
          this.question = `La forme développée de ${expression1} est :` // (x+a)²
        } else {
          this.question = `Développer  ${expression1}.` // (x+a)²
        }
        this.reponse = `$${reduirePolynomeDegre3(0, 1, 2 * a, a ** 2, inconnue)}$`
        this.correction = `On utilise l'égalité remarquable $(a+b)^2=a^2+2ab+b^2$ avec $a=${inconnue}$ et $b=${a}$.<br>
$\\begin{aligned}
           (${inconnue}+${a})^2&=${inconnue}^2+2 \\times ${a} \\times ${inconnue}+${a}^2\\\\
            &=${miseEnEvidence(`${inconnue}^2+${2 * a}${inconnue}+${a * a}`)}
            \\end{aligned}$`

        this.distracteurs = [
          `$${reduirePolynomeDegre3(0, 1, 0, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, -2 * a, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, a, a * a, inconnue)}$`,
        ]
        break
      case 2:
        if (this.versionQcm) {
          this.question = `La forme développée de ${expression2} est :` // (x-a)²
        } else {
          this.question = `Développer ${expression2}.` // (x-a)²
        }
        this.reponse = `$${reduirePolynomeDegre3(0, 1, -2 * a, a ** 2, inconnue)}$`
        this.correction = `On utilise l'égalité remarquable $(a-b)^2=a^2-2ab+b^2$ avec $a=${inconnue}$ et $b=${a}$.<br>
      $\\begin{aligned}
            (${inconnue}-${a})^2&=${inconnue}^2-2 \\times ${a} \\times ${inconnue}+${a}^2\\\\
            &=${miseEnEvidence(`${inconnue}^2-${2 * a}${inconnue}+${a * a}`)}
            \\end{aligned}$`

        this.distracteurs = [
          `$${reduirePolynomeDegre3(0, 1, 0, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, -2 * a, -a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, 2 * a, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, a, a * a, inconnue)}$`,
        ]
        break
      case 3:
        if (this.versionQcm) {
          this.question = `La forme développée de ${expression3} est :` // (x-a)(x+a)
        } else {
          this.question = `Développer ${expression3}.` // (x-a)(x+a)
        }
        this.correction = `On utilise l'égalité remarquable $(a+b)(a-b)=a^2-b^2$ avec $a=${inconnue}$ et $b=${a}$.<br>
 $\\begin{aligned}
           (${inconnue}-${a})(${inconnue}+${a})&=${inconnue}^2-${a}^2\\\\
            &=${miseEnEvidence(`${inconnue}^2-${a * a}`)}
            \\end{aligned}$`
        this.reponse = `$${reduirePolynomeDegre3(0, 1, 0, -1 * a ** 2, inconnue)}$`
        this.distracteurs = [
          `$${reduirePolynomeDegre3(0, 1, 0, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, -2 * a, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, 2 * a, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, -2 * a, -a * a, inconnue)}$`,
        ]
        break

      case 4:
        if (this.versionQcm) {
          this.question = `La forme développée de ${expression4} est :` // (bx+a)²  b>1
        } else {
          this.question = `Développer ${expression4}.` // (bx+a)²  b>1
        }
        this.correction = `On utilise l'égalité remarquable $(a+b)^2=a^2+2ab+b^2$ avec $a=${b}${inconnue}$ et $b=${a}$.<br>
 $\\begin{aligned}
         (${b}${inconnue}+${a})^2&=(${b}${inconnue})^2+2 \\times ${b}${inconnue} \\times ${a} + ${a}^2\\\\
            &=${miseEnEvidence(`${b * b}${inconnue}^2+${2 * b * a}${inconnue}+${a * a}`)}
            \\end{aligned}$`
        this.reponse = `$${reduirePolynomeDegre3(0, b ** 2, 2 * a * b, a ** 2, inconnue)}$`
        this.distracteurs = [
          `$${reduirePolynomeDegre3(0, b * b, 0, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, b * b, a * b, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, 2 * a, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, 1, a, a * a, inconnue)}$`,
        ]
        break
      case 5:
        if (this.versionQcm) {
          this.question = `La forme développée de ${expression5} est :` // (bx-a)² b>1
        } else {
          this.question = `Développer ${expression5}.` // (bx-a)² b>1
        }
        this.correction = `On utilise l'égalité remarquable $(a-b)^2=a^2-2ab+b^2$ avec $a=${b}${inconnue}$ et $b=${a}$.<br>
        $\\begin{aligned}
         (${b}${inconnue}-${a})^2&=(${b}${inconnue})^2-2 \\times ${b}${inconnue} \\times ${a} + ${a}^2\\\\
            &=${miseEnEvidence(`${b * b}${inconnue}^2-${2 * b * a}${inconnue}+${a * a}`)}
            \\end{aligned}$`
        this.reponse = `$${reduirePolynomeDegre3(0, b ** 2, -2 * a * b, a ** 2, inconnue)}$`
        this.distracteurs = [
          `$${reduirePolynomeDegre3(0, b * b, 0, -a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, b * b, 0, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, b * b, 2 * b * a, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, b * b, b * a, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, b * b, -2 * b * a, a * a, inconnue)}$`,
        ]
        break
      case 6:
      default:
        if (this.versionQcm) {
          this.question = `La forme développée de ${expression6} est :` // (bx-a)(bx+a) b>1
        } else {
          this.question = `Développer ${expression6}.` // (bx-a)(bx+a) b>1
        }
        this.correction = `On utilise l'égalité remarquable $(a+b)(a-b)=a^2-b^2$ avec $a=${b}${inconnue}$ et $b=${a}$.<br>
   $\\begin{aligned}
             (${b}${inconnue}-${a})(${b}${inconnue}+${a})&=(${b}${inconnue})^2-${a}^2\\\\
              &=${miseEnEvidence(`${b ** 2}${inconnue}^2-${a * a}`)}
              \\end{aligned}$`
        this.reponse = `$${reduirePolynomeDegre3(0, b ** 2, 0, -1 * a ** 2, inconnue)}$`
        this.distracteurs = [
          `$${reduirePolynomeDegre3(0, b * b, 0, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, b * b, -2 * a * b, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, b * b, 2 * a * b, a * a, inconnue)}$`,
          `$${reduirePolynomeDegre3(0, b * b, -2 * a * b, -a * a, inconnue)}$`,
        ]
        break
    }
    if (context.isHtml) {
      this.question += '<br>'
    }
  }
}
