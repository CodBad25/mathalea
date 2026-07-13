import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer le volume d'un cylindre (sans figure)"
export const dateDePublication = '23/06/2026'

export const uuid = 'e4c72'

export const refs = {
  'fr-fr': ['1A-G02-8', '2A-G3-8'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer le volume d'un cylindre à partir du rayon de sa base et de sa hauteur.
 * @author Stéphane Guyon
 */
export default class VolumeCylindreQcm extends ExerciceQcmA {
  private appliquerLesValeurs(rayon: number, hauteur: number) {
    const coefficientVolume = rayon ** 2 * hauteur
    const volumeAvecPiDecimal = coefficientVolume * 3.14
    const coefficientAvecPerimetreBase = 2 * rayon * hauteur
    const volumeSansPi = coefficientVolume

    this.enonce = `Un cylindre a pour rayon de base $${rayon}\\text{ cm}$ et pour hauteur $${hauteur}\\text{ cm}$.<br>
La valeur exacte de son volume est :`

    this.reponses = [
      `$${coefficientVolume}\\pi\\text{ cm}^3$`,
      `$${texNombre(volumeAvecPiDecimal)}\\text{ cm}^3$`,
      `$${coefficientAvecPerimetreBase}\\pi\\text{ cm}^3$`,
      `$${volumeSansPi}\\text{ cm}^3$`,
    ]

    this.correction = `Le volume d'un cylindre de rayon de base $r$ et de hauteur $h$ est donné par la formule :<br>
$V=\\pi r^2h$.<br>
Ici, $r=${rayon}\\text{ cm}$ et $h=${hauteur}\\text{ cm}$.<br>
Donc $V=\\pi\\times ${rayon}^2\\times ${hauteur}=${miseEnEvidence(`${coefficientVolume}\\pi\\text{ cm}^3`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(4, 7)
  }

  versionAleatoire = () => {
    const rayon = randint(3, 9)
    const hauteur = randint(3, 12)
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
