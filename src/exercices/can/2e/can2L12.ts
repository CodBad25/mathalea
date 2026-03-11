import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'

import { choice, shuffle } from '../../../lib/outils/arrayOutils'
import { reduireAxPlusB, rienSi1 } from '../../../lib/outils/ecritures'
export const titre = 'Factoriser avec une égalité remarquable'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '04/04/2024'
export const uuid = 'a1cb3'
export const refs = {
  'fr-fr': ['can2L12'],
  'fr-ch': ['11FA3-8', '1mCL2-3'],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class FatorisationEgR extends ExerciceSimple {
  constructor() {
    super()
    this.canOfficielle = false
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecVariable
    this.versionQcmDisponible = true
    this.versionQcm = false
  }

  nouvelleVersion() {
    switch (choice([1, 2, 3])) {
      case 1: // (ax+b)^2
        {
          const a = randint(1, 2)
          const b = randint(1, 6)
          const choix = choice([true, false])
          this.reponse = `$(${reduireAxPlusB(a, b)})^2$`
          let tableau = [
            `$(${reduireAxPlusB(a, -b)})^2$`,
            `$(${reduireAxPlusB(a, b)})(${reduireAxPlusB(a, -b)})$`,
            `$x(${reduireAxPlusB(a ** 2, 2 * a * b)})+${b ** 2}$`,
            `$(${reduireAxPlusB(a, b / 2)})^2$`,
          ]
          tableau = shuffle(tableau)
          this.distracteurs = [tableau[0], tableau[1], tableau[2]]
          if (this.versionQcm) {
            this.question = ` Une  factorisation de    ${
              choix
                ? `$${rienSi1(a ** 2)}x^2+${reduireAxPlusB(2 * a * b, b ** 2)}$`
                : `$${reduireAxPlusB(2 * a * b, b ** 2)}+${rienSi1(a ** 2)}x^2$`
            } est :`
          } else {
            this.question = ` Factoriser : ${this.interactif ? '<br>' : ''} ${
              choix
                ? `$${rienSi1(a ** 2)}x^2+${reduireAxPlusB(2 * a * b, b ** 2)}$${this.interactif ? ' $=$' : '.'}`
                : `$${reduireAxPlusB(2 * a * b, b ** 2)}+${rienSi1(a ** 2)}x^2$${this.interactif ? ' $=$' : '.'}`
            }`
          }
          this.correction = `On reconnaît le développement de l'égalité remarquable : <br>
          $(a+b)^2=a^2+2ab+b^2$ avec $a=${rienSi1(a)}x$ et $b=${b}$.<br>
          On a donc :
    
      ${
        choix
          ? `$${rienSi1(a ** 2)}x^2+${reduireAxPlusB(2 * a * b, b ** 2)}=${miseEnEvidence(`(${reduireAxPlusB(a, b)})^2`)}$`
          : `$${reduireAxPlusB(2 * a * b, b ** 2)}+${rienSi1(a ** 2)}x^2=${miseEnEvidence(`(${reduireAxPlusB(a, b)})^2`)}$`
      }`
        }
        break
      case 2: // (a-b)^2
        {
          const a = randint(1, 2)
          const b = randint(1, 6)
          const choix = choice([true, false])
          const reponses = [
            `$(${reduireAxPlusB(a, -b)})^2$`,
            `$(${reduireAxPlusB(-a, b)})^2$`,
          ]
          if (this.versionQcm) {
            this.reponse = choice(reponses)
          } else {
            this.reponse = reponses
          }
          let tableau = [
            `$(${reduireAxPlusB(a, b)})^2$`,
            `$(${reduireAxPlusB(a, b)})(${reduireAxPlusB(a, -b)})$`,
            `$x(${reduireAxPlusB(a ** 2, -2 * a * b)})+${b ** 2}$`,
            `$(${reduireAxPlusB(a, -b / 2)})^2$`,
          ]
          tableau = shuffle(tableau)
          this.distracteurs = [tableau[0], tableau[1], tableau[2]]
          if (this.versionQcm) {
            this.question = ` Une  factorisation de    ${
              choix
                ? `$${rienSi1(a ** 2)}x^2-${reduireAxPlusB(2 * a * b, b ** 2)}$`
                : `$${reduireAxPlusB(-2 * a * b, b ** 2)}+${rienSi1(a ** 2)}x^2$`
            } est :`
          } else {
            this.question = ` Factoriser : ${this.interactif ? '<br>' : ''} ${
              choix
                ? `$${rienSi1(a ** 2)}x^2-${reduireAxPlusB(2 * a * b, b ** 2)}$${this.interactif ? ' $=$' : '.'}`
                : `$${reduireAxPlusB(-2 * a * b, b ** 2)}+${rienSi1(a ** 2)}x^2$${this.interactif ? ' $=$' : '.'}`
            }`
          }
          this.correction = `On reconnaît le développement de l'égalité remarquable : <br>
        $(a-b)^2=a^2-2ab+b^2$ avec $a=${rienSi1(a)}x$ et $b=${b}$.<br>
        On a donc :
   
    ${
      choix
        ? `$${rienSi1(a ** 2)}x^2${reduireAxPlusB(-2 * a * b, b ** 2)}=${miseEnEvidence(`(${reduireAxPlusB(a, -b)})^2`)}$`
        : `$${reduireAxPlusB(-2 * a * b, b ** 2)}+${rienSi1(a ** 2)}x^2=${miseEnEvidence(`(${reduireAxPlusB(a, -b)})^2`)}$`
    }`
        }
        break
      case 3: // a^2-b^2
        {
          const a = randint(2, 3)
          const b = randint(2, 10)
          const choix = choice([true, false])
          this.reponse = choix
            ? `$(${reduireAxPlusB(a, -b)})(${reduireAxPlusB(a, b)})$`
            : `$(${reduireAxPlusB(a, b)})(${reduireAxPlusB(-a, b)})$`
          this.distracteurs = [
            `$(${reduireAxPlusB(a, -b)})^2$`,
            `$(${reduireAxPlusB(a ** 2, b ** 2)})(${reduireAxPlusB(a ** 2, -b * b)})$`,
            `$(${reduireAxPlusB(a ** 2, b)})(${reduireAxPlusB(a ** 2, -b)})$`,
          ]
          if (this.versionQcm) {
            this.question = ` Une  factorisation de    ${
              choix
                ? `$${rienSi1(a ** 2)}x^2-${b ** 2}$`
                : `$${b ** 2}-${rienSi1(a ** 2)}x^2$`
            } est :`
          } else {
            this.question = ` Factoriser : ${this.interactif ? '<br>' : ''} ${
              choix
                ? `$${rienSi1(a ** 2)}x^2-${b ** 2}$${this.interactif ? ' $=$' : '.'}`
                : `$${b ** 2}-${rienSi1(a ** 2)}x^2$${this.interactif ? ' $=$' : '.'}`
            }`
          }
          this.correction = `On reconnaît le développement de l'égalité remarquable : <br>
          $(a+b)(a-b)=a^2-b^2$ avec $a=${choix ? `${rienSi1(a)}x` : `${b}`}$ et $b=${choix ? `${b}` : `${rienSi1(a)}x`}$.<br>
          On a donc :
      ${
        choix
          ? `$${rienSi1(a ** 2)}x^2-${b ** 2}=${miseEnEvidence(`(${reduireAxPlusB(a, -b)})(${reduireAxPlusB(a, b)})`)}$`
          : `$${b ** 2}-${rienSi1(a ** 2)}x^2=${miseEnEvidence(`(${b}+${rienSi1(a)}x)(${b}-${rienSi1(a)}x)`)}$`
      }`
        }
        break
    }
    this.canEnonce = this.question // 'Compléter'
    this.canReponseACompleter = ''
  }
}
