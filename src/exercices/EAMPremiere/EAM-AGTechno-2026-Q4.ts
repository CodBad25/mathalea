import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureParentheseSiNegatif } from '../../lib/outils/ecritures'
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
    const dist1 = texNombre(33.8, 2)
    const dist2 = texNombre(0.18 * temperatureCelsius + 32, 2)
    const dist3 = texNombre(temperatureCelsius, 2)
    this.enonce = `On considère la formule suivante permettant de transformer des degrés Celsius ($^\\circ \\text{C}$) en degrés Fahrenheit ($^\\circ \\text{F}$) : $F =1,8C +32$<br>
Où $F$ désigne la température en $^\\circ \\text{F}$ et $C$ désigne la température en $^\\circ \\text{C}$.<br>
${debutPhrase} $${texNombre(temperatureCelsius, 2)}\\,^\\circ \\text{C}$, ${finPhrase} en degrés Fahrenheit est donc :<br>`

    this.correction = `On applique la formule de conversion :<br>
$F = 1{,}8\\times ${ecritureParentheseSiNegatif(temperatureCelsius)} + 32 =${texNombre(1.8 * temperatureCelsius, 2)} + 32 = ${sol}\\,^\\circ \\text{F}$.`

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

    let compteur = 0
    const temperatureFusionCelsius = [
      { plomb: 327 },
      { argent: 962 },
      { or: 1064 },
      { cuivre: 1085 },
      { fer: 1538 },
      { aluminium: 660 },
      { zinc: 420 },
      { étain: 232 },
    ]
    const temperatureLiquefactionCelsius = [
      { azote: -210 },
      { oxygène: -183 },
      { hydrogène: -259 },
      { hélium: -272 },
      { mercure: -39 },
    ]
    do {
      const choix = choice([true, false])
      let debutPhrase = ''
      let finPhrase = ''
      let temperatureCelsius = 0
      if (choix) {
        const element = choice(temperatureFusionCelsius)
        temperatureCelsius = Object.values(element)[0]
        const article = articleOuLiaison(Object.keys(element)[0])
        debutPhrase = `Sachant que ${article}${Object.keys(element)[0]} fond à `
        finPhrase = `la température de fusion ${article === 'le ' ? 'du ' : "de l'"}${Object.keys(element)[0]}`
      } else {
        const element = choice(temperatureLiquefactionCelsius)
        const article = articleOuLiaison(Object.keys(element)[0])
        temperatureCelsius = Object.values(element)[0]
        debutPhrase = `Sachant que ${article}${Object.keys(element)[0]} se liquéfie à `
        finPhrase = `la température de liquefaction ${article === 'le ' ? 'du ' : "de l'"}${Object.keys(element)[0]}`
      }

      this.appliquerLesValeurs(temperatureCelsius, debutPhrase, finPhrase)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}

function articleOuLiaison(mot: string): string {
  const premierCaractere = mot.charAt(0)
  return premierCaractere === 'a' ||
    premierCaractere === 'i' ||
    premierCaractere === 'o' ||
    premierCaractere === 'u' ||
    premierCaractere === 'e' ||
    premierCaractere === 'é' ||
    premierCaractere === 'h'
    ? "l'"
    : 'le '
}
