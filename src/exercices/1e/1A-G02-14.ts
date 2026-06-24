import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { fraction } from '../../modules/fractions'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer le volume d'une boule"
export const dateDePublication = '24/06/2026'

export const uuid = 'c2f91'

export const refs = {
  'fr-fr': ['1A-G02-14'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer le volume exact d'une boule à partir de son rayon.
 * @author Stéphane Guyon
 */
export default class VolumeBouleQcm extends ExerciceQcmA {
  private appliquerLesValeurs(rayon: number) {
    const coefficientVolume = fraction(4 * rayon ** 3, 3).texFractionSimplifiee
    const coefficientAvecFacteurInverse = fraction(
      3 * rayon ** 3,
      4,
    ).texFractionSimplifiee
    const coefficientSansFacteurQuatreTiers = fraction(
      rayon ** 3,
      1,
    ).texFractionSimplifiee
    const coefficientAvecAireSphere = fraction(
      4 * rayon ** 2,
      1,
    ).texFractionSimplifiee
    const coefficientAlternative = fraction(2 * rayon ** 3, 1)
      .texFractionSimplifiee
    const quatriemeDistracteur =
      rayon === 3 || rayon === 4
        ? coefficientAlternative
        : coefficientAvecAireSphere

    this.enonce = `Une boule a pour rayon $${rayon}\\text{ cm}$.<br>
La valeur exacte de son volume est `

    this.reponses = [
      `$${coefficientVolume}\\pi\\text{ cm}^3$`,
      `$${coefficientAvecFacteurInverse}\\pi\\text{ cm}^3$`,
      `$${coefficientSansFacteurQuatreTiers}\\pi\\text{ cm}^3$`,
      `$${quatriemeDistracteur}\\pi\\text{ cm}^3$`,
    ]

    this.correction = `Le volume d'une boule de rayon $r$ est donné par la formule :<br>
$V=\\dfrac{4}{3}\\pi r^3$.<br>
Ici, $r=${rayon}\\text{ cm}$.<br>
Donc $V=\\dfrac{4}{3}\\times \\pi\\times ${rayon}^3=${miseEnEvidence(`${coefficientVolume}\\pi\\text{ cm}^3`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(4)
  }

  versionAleatoire = () => {
    const rayon = choice([1, 2, 3, 4, 5, 6, 7, 8])
    this.appliquerLesValeurs(rayon)
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
