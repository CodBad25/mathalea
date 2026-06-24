import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre =
  "Calculer le volume d'un prisme droit à base triangulaire rectangle"
export const dateDePublication = '24/06/2026'

export const uuid = 'a95f8'

export const refs = {
  'fr-fr': ['1A-G02-12'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer le volume d'un prisme droit dont la base est un triangle rectangle.
 * @author Stéphane Guyon
 */
export default class VolumePrismeDroitBaseTriangleRectangleQcm extends ExerciceQcmA {
  private appliquerLesValeurs(
    coteAngleDroit1: number,
    coteAngleDroit2: number,
    hauteurPrisme: number,
  ) {
    const produitDesTroisCotes =
      coteAngleDroit1 * coteAngleDroit2 * hauteurPrisme
    const aireBase = (coteAngleDroit1 * coteAngleDroit2) / 2
    const volume = aireBase * hauteurPrisme

    this.enonce = `Un prisme droit a pour base un triangle rectangle dont les côtés de l'angle droit mesurent $${coteAngleDroit1}\\text{ cm}$ et $${coteAngleDroit2}\\text{ cm}$.<br>
La hauteur du prisme est $${hauteurPrisme}\\text{ cm}$.<br>
Son volume est égal à `

    this.reponses = [
      `$${texNombre(volume)}\\text{ cm}^3$`,
      `$${texNombre(volume / 3)}\\text{ cm}^3$`,
      `$${texNombre(produitDesTroisCotes)}\\text{ cm}^3$`,
      `$${texNombre(volume / 2)}\\text{ cm}^3$`,
    ]

    this.correction = `
Si $\\mathcal{A}$ désigne l'aire de la base et si $h$ désigne la hauteur du prisme, alors le volume d'un prisme droit est donné par :<br>
$V=\\mathcal{A}\\times h$.<br>
Or la base est un triangle rectangle. Si $a$ et $b$ désignent les deux côtés de l'angle droit, alors :<br>
$\\mathcal{A}=\\dfrac{a\\times b}{2}$.<br>
Donc :<br>
$\\mathcal{A}=\\dfrac{${coteAngleDroit1}\\times ${coteAngleDroit2}}{2}=\\dfrac{${coteAngleDroit1 * coteAngleDroit2}}{2}=${texNombre(aireBase)}\\text{ cm}^2$.<br>
$V=${texNombre(aireBase)}\\times ${hauteurPrisme}=${miseEnEvidence(`${texNombre(volume)}\\text{ cm}^3`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(6, 8, 9)
  }

  versionAleatoire = () => {
    let coteAngleDroit1: number
    let coteAngleDroit2: number
    let hauteurPrisme: number
    do {
      coteAngleDroit1 = randint(3, 12)
      coteAngleDroit2 = randint(3, 12, coteAngleDroit1)
      hauteurPrisme = randint(3, 12)
    } while ((coteAngleDroit1 * coteAngleDroit2 * hauteurPrisme) % 12 !== 0)
    this.appliquerLesValeurs(coteAngleDroit1, coteAngleDroit2, hauteurPrisme)
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
