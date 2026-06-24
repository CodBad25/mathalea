import { cercle } from '../../lib/2d/cercle'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { labelPoint } from '../../lib/2d/textes'
import { texteSurSegment } from '../../lib/2d/texteSurSegment'
import { tracePoint } from '../../lib/2d/TracePoint'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer le périmètre d'un cercle"
export const dateDePublication = '19/06/2026'

export const uuid = 'c84f2'

export const refs = {
  'fr-fr': ['1A-G02-4'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer le périmètre d'un cercle à partir de son rayon ou de son diamètre.
 * @author Stéphane Guyon
 */
export default class PerimetreCercleQcm extends ExerciceQcmA {
  private appliquerLesValeurs(rayon: number, donneLeDiametre: boolean) {
    const diametre = 2 * rayon
    const valeurAvecPi314 = 3.14 * diametre

    const O = pointAbstrait(0, 0, 'O', 'below')
    const A = pointAbstrait(-2.5, 0)
    const B = pointAbstrait(2.5, 0)
    const cercleC = cercle(O, 2.5)
    cercleC.epaisseur = 2

    const segmentMesure = donneLeDiametre ? segment(A, B) : segment(O, B)
    segmentMesure.epaisseur = 1.5
    segmentMesure.pointilles = 5
    const mesure = donneLeDiametre ? diametre : rayon
    const objets = [
      cercleC,
      segmentMesure,
      tracePoint(O),
      labelPoint(O),
      texteSurSegment(
        `$${mesure}\\text{ cm}$`,
        donneLeDiametre ? A : O,
        B,
        'black',
        0.6,
      ),
    ]

    this.enonce = `Le cercle ci-dessous, sur lequel on a codé un ${donneLeDiametre ? 'diamètre' : 'rayon'}, n'est pas représenté à l'échelle.<br>
${mathalea2d(
  Object.assign(
    { pixelsParCm: 25, scale: 0.8, center: true },
    fixeBordures(objets),
  ),
  objets,
)}
La valeur exacte de son périmètre est `

    this.reponses = [
      `$${diametre}\\pi\\text{ cm}$`,
      donneLeDiametre
        ? `$\\pi\\times ${diametre}^2\\text{ cm}$`
        : `$\\pi\\times ${rayon}^2\\text{ cm}$`,
      `$${texNombre(valeurAvecPi314, 2)}\\text{ cm}$`,
      donneLeDiametre
        ? `$${rayon ** 2}\\pi\\text{ cm}$`
        : `$${rayon}\\pi\\text{ cm}$`,
    ]

    this.correction = donneLeDiametre
      ? `Le périmètre d'un cercle de diamètre $D$ est $P=\\pi\\times D$.<br>
Ainsi, $P=\\pi\\times ${diametre}=${miseEnEvidence(`${diametre}\\pi\\text{ cm}`)}$.`
      : `Le périmètre d'un cercle de rayon $r$ est $P=2\\times\\pi\\times r$.<br>
Ainsi, $P=2\\times\\pi\\times ${rayon}=${miseEnEvidence(`${diametre}\\pi\\text{ cm}`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(4, false)
  }

  versionAleatoire = () => {
    this.appliquerLesValeurs(randint(3, 9), randint(1, 2) === 1)
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
