import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
  reduireAxPlusB,
} from '../../lib/outils/ecritures'
import FractionEtendue from '../../modules/FractionEtendue'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '02/09/2025'
export const uuid = 'b0831'
// @Author Stéphane Guyon
export const refs = {
  'fr-fr': ['1A-C09-6'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Factoriser une expression algébrique'
export default class Puissances extends ExerciceQcmA {
  versionOriginale: () => void = () => {
    this.enonce = 'Soit $x$ un réel.<br>'
    this.enonce += `À quelle expression est égale $2x^2-5x-3$ ?`
    this.correction = `On cherche parmi les  propositions, lesquelles peuvent donner, après développement, l'expression de l'énoncé. <br>
     $\\begin{aligned}
       (2x+1)(x-3)&=2x^2-6x+x-3\\\\
        &=2x^2-5x-3.
     \\end{aligned}$`

    this.reponses = [
      '$(2x+1)(x-3)$',
      '$(2x-1)(x+3)$ ',
      '$(x+\\dfrac12)(x-3)$ ',
      '$(2x+1)(x+3)$ ',
    ]
  }

  versionAleatoire = () => {
    let compteur = 0 // un compteur pour éviter les boucles infinies si le qcm est vraiment problématique
    do {
      let a1, a2, b1, b2
      do {
        a1 = randint(-4, 4, 0)
        b1 = randint(-4, 4, 0)
        a2 = randint(-4, 4, [0, a1, -a1])
        b2 = randint(-4, 4, [0, b1, -b1])
      } while (a1 * b2 + a2 * b1 === 0)
      const distracteur = new FractionEtendue(b1, a1)
      this.enonce = 'Soit $x$ un réel.<br>'

      this.enonce += `À quelle expression est égale $${a1 * a2}x^2${ecritureAlgebriqueSauf1(a1 * b2 + a2 * b1)}x${ecritureAlgebrique(b1 * b2)}$ ?`
      this.correction = `On cherche parmi les  propositions, lesquelles peuvent donner, après développement, l'expression de l'énoncé. <br>
              $\\begin{aligned}
     \\left (${reduireAxPlusB(a1, b1)}\\right)\\left(${reduireAxPlusB(a2, b2)}\\right)&=${a1 * a2}x^2${ecritureAlgebriqueSauf1(a1 * b2)}x${ecritureAlgebriqueSauf1(a2 * b1)}x${ecritureAlgebrique(b1 * b2)}\\\\
      &=${a1 * a2}x^2${ecritureAlgebriqueSauf1(a1 * b2 + a2 * b1)}x${ecritureAlgebrique(b1 * b2)}\\\\
     \\end{aligned}$`

      this.reponses = [
        `$\\left( ${reduireAxPlusB(a1, b1)}\\right)\\left( ${reduireAxPlusB(a2, b2)}\\right)$`,
        `$\\left( ${reduireAxPlusB(a1, -b1)}\\right)\\left( ${reduireAxPlusB(a2, b2)}\\right)$`,
        `$\\left( ${reduireAxPlusB(a1, -b1)}\\right)\\left( ${reduireAxPlusB(a2, -b2)}\\right)$`,
        `$\\left( x${distracteur.simplifie().ecritureAlgebrique}\\right)\\left( ${reduireAxPlusB(a2, b2)}\\right)$`,
      ]
      compteur++
    } while (
      compteur < 100 &&
      !aLeBonNombreDePropsDifferentes(this, 4, true, {})
    )
    // Ici, on doit avoir une bonne réponse et 3 distracteurs distincts.
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
