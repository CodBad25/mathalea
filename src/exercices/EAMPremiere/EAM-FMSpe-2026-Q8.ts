import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '7b0d3'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Simplifier une expression avec des puissances de 10'
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ8FMs2026 extends ExerciceQcmA {
  private appliquerLesValeurs(
    a: number,
    b: number,
    c: number,
    d: number,
    E: number,
    repOrigine?: string,
    d1Origine?: string,
    d2Origine?: string,
    d3Origine?: string,
  ): void {
    this.enonce = `On considère le nombre $A = \\dfrac{10^{${a}} \\times 10^{${b}}}{(10^{${c}})^{${d}}}$.<br>`
    this.enonce += `On peut affirmer que :`

    let correct: string
    let d1: string, d2: string, d3: string

    // Si on a forcé les réponses (pour la version originale calquée sur l'image)
    if (repOrigine && d1Origine && d2Origine && d3Origine) {
      correct = repOrigine
      d1 = d1Origine
      d2 = d2Origine
      d3 = d3Origine
    } else {
      correct = `A = ${texNombre(Math.pow(10, E), 5)}`

      if (E < 0) {
        // La réponse est une puissance "négative" (ex: 0,001)
        // -> on met le piège du signe "-" comme dans l'image
        d1 = `A = ${texNombre(-Math.pow(10, E), 5)}` // ex: -0,001
        d2 = `A = ${texNombre(Math.pow(10, -E), 5)}` // ex: 1000
        d3 = `A = ${texNombre(Math.pow(10, E - 1), 5)}` // ex: 0,0001
      } else {
        // La réponse est une puissance "positive" (ex: 1000)
        // -> AUCUN distracteur négatif
        d1 = `A = ${texNombre(Math.pow(10, -E), 5)}` // ex: 0,001
        d2 = `A = ${texNombre(Math.pow(10, E - 1), 5)}` // ex: 100
        d3 = `A = ${texNombre(Math.pow(10, E + 1), 5)}` // ex: 10000
      }
    }

    this.reponses = [`$${correct}$`, `$${d1}$`, `$${d2}$`, `$${d3}$`]

    const numExp = a + b
    const denExp = c * d
    const bStr = b < 0 ? `(${b})` : `${b}`

    // Rédaction adaptative et complète de la correction
    this.correction = `Pour simplifier cette expression, on utilise les propriétés des puissances de $10$ :<br>`
    this.correction += `$\\begin{aligned}`
    this.correction += `A &= \\dfrac{10^{${a}} \\times 10^{${b}}}{(10^{${c}})^{${d}}} \\\\[0.5em]`
    this.correction += `A &= \\dfrac{10^{${a} + ${bStr}}}{10^{${c} \\times ${d}}} \\\\[0.5em]`
    this.correction += `A &= \\dfrac{10^{${numExp}}}{10^{${denExp}}} \\\\[0.5em]`
    this.correction += `A &= 10^{${numExp} - ${denExp}} \\\\[0.5em]`
    this.correction += `A &= 10^{${E}} \\\\[0.5em]`
    this.correction += `A &= ${texNombre(Math.pow(10, E), 5)}`
    this.correction += `\\end{aligned}$<br><br>`
    this.correction += `La bonne réponse est donc $${miseEnEvidence(correct)}$.`
  }

  versionOriginale: () => void = () => {
    // Valeurs strictes de l'image
    this.appliquerLesValeurs(
      201,
      -4,
      2,
      100,
      -3,
      'A = 0,001',
      'A = -0,001',
      'A = 0,000\\,1',
      'A = 1\\,000',
    )
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      // Ordre de grandeur final visé (100, 1000, 0.01 ou 0.001)
      const E = choice([-3, -2, 2, 3])

      // On crée des nombres cohérents pour les exposants du dénominateur
      const c = choice([2, 3, 4, 5, 10])
      const d = choice([10, 20, 50, 100])
      const cd = c * d

      // L'exposant "a" tourne autour de ce produit
      const a = randint(cd - 5, cd + 5)

      // On calcule le "b" manquant pour retomber exactement sur l'exposant cible E
      const b = E + cd - a

      // On évite les cas triviaux (où l'un des exposants du numérateur vaut 0)
      if (b === 0 || a === 0) continue

      this.appliquerLesValeurs(a, b, c, d, E)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
