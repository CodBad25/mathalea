import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'b4584'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Effectuer une application numérique '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ7AGns2026 extends ExerciceQcmA {
  private appliquerLesValeurs(U: number, P: number, distracteurs?: string[]): void {
    this.enonce = `La résistance $R$ (en ohms) d'un appareil est donnée par la formule $R = \\dfrac{U^2}{P}$ où $U$ est la tension (en volts) et $P$ la puissance (en watts).<br><br>`
    this.enonce += `Quelle est la résistance d'un appareil lorsque la tension est de $${U}$ volts et la puissance de $${P}$ watts ?`

    // Calcul de la bonne réponse avec FractionEtendue pour une simplification automatique
    const repFrac = new FractionEtendue(U * U, P).simplifie()
    const bonneReponse = `$${repFrac.texFSD}$`

    if (distracteurs && distracteurs.length >= 3) {
      this.reponses = [bonneReponse, distracteurs[0], distracteurs[1], distracteurs[2]]
    } else {
      // Génération des erreurs classiques liées à cette formule
      const mauvaisesReponses = [
        `$${new FractionEtendue(2 * U, P).simplifie().texFSD}$`, // Erreur 1 : Oubli du carré (multiplie par 2 au lieu d'élever au carré)
        `$${new FractionEtendue(P, U * U).simplifie().texFSD}$`, // Erreur 2 : Inversion de la fraction (P / U^2)
        `$${new FractionEtendue(P, 2 * U).simplifie().texFSD}$`, // Erreur 3 : Inversion + Oubli du carré
        `$${new FractionEtendue(U, P).simplifie().texFSD}$`      // Erreur 4 : Pas de carré du tout (U / P)
      ]

      // Filtrage simple pour éviter les doublons accidentels avec la bonne réponse
      const mauvaisesReponsesUniques: string[] = []
      for (const rep of mauvaisesReponses) {
        if (rep !== bonneReponse && !mauvaisesReponsesUniques.includes(rep)) {
          mauvaisesReponsesUniques.push(rep)
        }
      }

      this.reponses = [
        bonneReponse,
        mauvaisesReponsesUniques[0],
        mauvaisesReponsesUniques[1],
        mauvaisesReponsesUniques[2]
      ]
    }

    this.correction = `On remplace $U$ par $${U}$ et $P$ par $${P}$ dans la formule :<br>`
    this.correction += `$R = \\dfrac{${U}^2}{${P}} = \\dfrac{${U * U}}{${P}} = ${miseEnEvidence(repFrac.texFSD)}$`
  }

  versionOriginale: () => void = () => {
    // Reproduction exacte de la question 7 de l'image
    // Attention : 20^2 / 80 = 400 / 80 = 5. La bonne réponse est donc 5.
    this.appliquerLesValeurs(20, 80, [
      `$\\dfrac{1}{2}$`,
      `$\\dfrac{1}{5}$`,
      `$2$`
    ])
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    // Liste de 6 cas offrant une bonne variété de résultats (entiers et fractions)
    const casValeurs = [
      [20, 80],   // R = 400 / 80 = 5
      [10, 50],   // R = 100 / 50 = 2
      [10, 200],  // R = 100 / 200 = 1/2
      [30, 90],   // R = 900 / 90 = 10
      [10, 500],  // R = 100 / 500 = 1/5
      [40, 200]   // R = 1600 / 200 = 8
    ]

    let compteur = 0
    do {
      const [U, P] = choice(casValeurs)
      this.appliquerLesValeurs(U, P)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}