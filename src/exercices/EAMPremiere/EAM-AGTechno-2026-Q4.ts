import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureParentheseSiNegatif } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '6eba5'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Convertir des degrés Celsius en degrés Fahrenheit'
export const dateDePublication = '29/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Jean-Claude Lhote
 *
 */
export default class AutoQ4AGt2026 extends ExerciceQcmA {
   private appliquerLesValeurs(
    temperatureCelsius: number,
    debutPhrase: string,
    finPhrase: string,
  ): void {
    const sol = texNombre(1.8 * temperatureCelsius + 32, 2)
    const dist1 = texNombre(temperatureCelsius + 32, 2) // oubli du × 1,8
    const dist2 = texNombre(0.18 * temperatureCelsius + 32, 2)
    const dist3 = texNombre(temperatureCelsius, 2)
    this.enonce = `On considère la formule suivante permettant de transformer des degrés Celsius ($^\\circ \\text{C}$) en degrés Fahrenheit ($^\\circ \\text{F}$) : $F =1,8C +32$<br>
Où $F$ désigne la température en $^\\circ \\text{F}$ et $C$ désigne la température en $^\\circ \\text{C}$.<br>
${debutPhrase} $${texNombre(temperatureCelsius, 2)}\\,^\\circ \\text{C}$, ${finPhrase} en degrés Fahrenheit est donc :<br>`

    this.correction = `On applique la formule de conversion :<br>
$F = 1,8\\times ${ecritureParentheseSiNegatif(temperatureCelsius)} + 32 =${texNombre(1.8 * temperatureCelsius, 2)} + 32 = ${miseEnEvidence(`${sol}\\,^\\circ \\text{F}`)}$.`

    this.reponses = [sol, dist1, dist2, dist3].map(
      (x) => `$${x}\\,^\\circ \\text{F}$`,
    )
  }

  versionOriginale: () => void = () => {
    // Version de l'image : 500 élèves, 20 %  => 100
    this.appliquerLesValeurs(
      100,
      "Sachant que l'eau bout à ",
      "la température d'ébulition de l'eau",
    )
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }
    // Températures « rondes » pour un calcul mental accessible.
    const positifs = [
      10, 20, 30, 40, 50, 60, 70, 80, 90, 200, 300, 400, 500, 600, 700, 800,
      900, 1000,
    ]
    const negatifs = [-10, -20, -30, -40, -50, -60, -70, -80, -90, -100, -200]

    let compteur = 0
    do {
      const temperatureCelsius = choice([...positifs, ...negatifs])
      this.appliquerLesValeurs(
        temperatureCelsius,
        'On considère une température de',
        'sa conversion',
      )
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
