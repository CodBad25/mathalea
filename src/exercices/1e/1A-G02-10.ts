import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer le volume d'un cône"
export const dateDePublication = '23/06/2026'

export const uuid = 'b3a06'

export const refs = {
  'fr-fr': ['1A-G02-10'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer le volume exact d'un cône à partir du rayon de sa base et de sa hauteur.
 * @author Stéphane Guyon
 */
export default class VolumeConeQcm extends ExerciceQcmA {
  private appliquerLesValeurs(rayon: number, hauteur: number) {
    const produit = rayon ** 2 * hauteur
    const coefficientVolume = produit / 3
    const coefficientAvecDivisionParDeux = produit / 2
    const volumeAvecPiDecimal = coefficientVolume * 3.14

    this.enonce = `Un cône a pour rayon de base $${rayon}\\text{ cm}$ et pour hauteur $${hauteur}\\text{ cm}$.<br>
La valeur exacte de son volume est :`

    this.reponses = [
      `$${texNombre(coefficientVolume)}\\pi\\text{ cm}^3$`,
      `$${texNombre(volumeAvecPiDecimal)}\\text{ cm}^3$`,
      `$${texNombre(coefficientAvecDivisionParDeux)}\\pi\\text{ cm}^3$`,
      `$${texNombre(coefficientVolume)}\\text{ cm}^3$`,
    ]

    this.correction = `Le volume d'un cône de rayon de base $r$ et de hauteur $h$ est donné par la formule :<br>
$V=\\dfrac{\\pi r^2h}{3}$.<br>
Ici, $r=${rayon}\\text{ cm}$ et $h=${hauteur}\\text{ cm}$.<br>
Donc $V=\\dfrac{\\pi\\times ${rayon}^2\\times ${hauteur}}{3}=\\dfrac{${produit}\\pi}{3}=${miseEnEvidence(`${texNombre(coefficientVolume)}\\pi\\text{ cm}^3`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(3, 6)
  }

  versionAleatoire = () => {
    let rayon: number
    let hauteur: number
    do {
      rayon = randint(2, 9)
      hauteur = randint(3, 12)
    } while ((rayon ** 2 * hauteur) % 6 !== 0)
    this.appliquerLesValeurs(rayon, hauteur)
  }

  constructor() {
    super()
    this.options = { vertical: false, ordered: false }
    this.nbQuestions = 1
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire4CaseACocher = false
    this.versionAleatoire()
  }
}
