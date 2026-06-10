import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'd9c51'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Exprimer une variable à partir d\'une formule '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ5CEs2026 extends ExerciceQcmA {
private appliquerLesValeurs(a: number, b: number, inverserXY: boolean): void {
    // Si inverserXY est true, on part de y = ... pour isoler x. Sinon, l'inverse.
    const var1 = inverserXY ? 'y' : 'x'
    const var2 = inverserXY ? 'x' : 'y'

    this.enonce = `Soient $x$ et $y$ deux réels strictement positifs tels que : $${var1} = \\dfrac{${a}}{${b}+${var2}}$.<br>On peut affirmer que :`

    this.correction = `On cherche à isoler $${var2}$ pour l'exprimer en fonction de $${var1}$ :<br>`
    this.correction += `$\\begin{aligned}`
    this.correction += `${var1} &= \\dfrac{${a}}{${b}+${var2}}\\\\[0.5em]`
    this.correction += `${var1}(${b}+${var2}) &= ${a}\\\\[0.5em]`
    this.correction += `${b}+${var2} &= \\dfrac{${a}}{${var1}}\\\\[0.5em]`
    this.correction += `${var2} &= ${miseEnEvidence(`\\dfrac{${a}}{${var1}} - ${b}`)}`
    this.correction += `\\end{aligned}$`

    // Génération des distracteurs calqués sur les erreurs du sujet d'origine
    const correct = `${var2} = \\dfrac{${a}}{${var1}} - ${b}`
    const d1 = `${var2} = \\dfrac{${a}}{${b}+${var1}}`           // Simple inversion des lettres sans calcul
    const d2 = `${var2} = ${a} - ${b}${var1}`                    // Erreur algébrique : var1(b+var2) = a -> var2 = a - b*var1
    const d3 = `${var2} = \\dfrac{${a * b}}{${b}${var1} - ${a}}` // Erreur de fraction type (réponse 'a' du sujet original)

    this.reponses = [
      `$${correct}$`,
      `$${d1}$`,
      `$${d2}$`,
      `$${d3}$`
    ]
  }

  versionOriginale: () => void = () => {
    // Valeurs exactes du sujet d'origine avec l'équation de départ : x = 5 / (2 + y)
    this.appliquerLesValeurs(5, 2, false)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      // Valeurs entières positives aléatoires
      const a = randint(3, 10)
      const b = randint(2, 8)
      
      // On peut laisser choice([true, false]) pour encore plus de variété, 
      // ou forcer true si tu veux que ce soit systématiquement inversé par rapport à l'original.
      const inverser = choice([true, false]) 
      
      this.appliquerLesValeurs(a, b, inverser)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}