import { choice, completerNombresUniques } from '../../lib/outils/arrayOutils'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '9eba5'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Interprêter les caractéristiques d'une série statistique"
export const dateDePublication = '29/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Jean-Claude Lhote
 *
 */
export default class AutoQ10AGt2026 extends ExerciceQcmA {
  private appliquerLesValeurs(
    min: number,
    q1: number,
    q2: number,
    q3: number,
    max: number,
    choixVariable: 1 | 2 | 3,
  ): void {
    this.enonce = `Les paramètres statistiques d’une série de notes d’un contrôle noté sur 20 sont donnés dans le tableau ci-dessous.<br><br>
    $\\begin{array}{|c|c|c|c|c|}
    \\hline
    \\text{Minimum}&\\text{Premier quartile}&\\text{Médiane}&\\text{Troisième quartile}&\\text{Maximum}\\\\
    \\hline
    ${min}&${q1}&${q2}&${q3}&${max}\\\\
    \\hline
    \\end{array}$<br><br>
    La proportion d’élèves ayant une note inférieure ou égale à $${choixVariable === 1 ? q1 : choixVariable === 2 ? q2 : q3}$ est :`
    let pourcentage = 0
    switch (choixVariable) {
      case 1:
        pourcentage = 25
        break
      case 3:
        pourcentage = 75
        break
      default:
        pourcentage = 50
    }
    const sol = `supérieure ou égale à $${pourcentage}\\,\\%$`

    const dist1 = `inférieure ou égale à $${pourcentage}\\,\\%$`
    const dist2 = `égale à $50\\,\\%$`
    const dist3 = `égale à $100\\,\\%$`

    this.reponses = [sol, dist1, dist2, dist3]

    this.correction = `La valeur de ${choixVariable === 1 ? 'Q1' : choixVariable === 2 ? 'Q2' : 'Q3'} est telle qu'au moins $${pourcentage}\\,\\%$ des notes sont inférieures ou égales à cette valeur.<br>
    Donc la proportion d’élèves ayant une note inférieure ou égale à ${choixVariable === 1 ? q1 : choixVariable === 2 ? q2 : q3} est supérieure ou égale à $${pourcentage}\\,\\%$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(2, 5, 10, 12, 17, 3)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }
    const choixVariable = choice([1, 3]) as 1 | 3
    const min = randint(1, 4)
    const max = randint(17, 19)
    let serie = [min, max]
    serie = completerNombresUniques(serie, 5, max)
      .sort((a, b) => a - b)
      .slice(0, 5) as [number, number, number, number, number]

    this.appliquerLesValeurs(
      serie[0],
      serie[1],
      serie[2],
      serie[3],
      serie[4],
      choixVariable,
    )
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
