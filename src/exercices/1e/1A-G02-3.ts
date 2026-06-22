import { codageSegments } from '../../lib/2d/CodageSegment'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygone } from '../../lib/2d/polygones'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { labelPoint } from '../../lib/2d/textes'
import { texteSurSegment } from '../../lib/2d/texteSurSegment'
import { tracePoint } from '../../lib/2d/TracePoint'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { milieu } from '../../lib/2d/utilitairesPoint'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer l'aire d'un quadrilatère codé avec ses diagonales"
export const dateDePublication = '19/06/2026'

export const uuid = 'd42f7'

export const refs = {
  'fr-fr': ['1A-G02-3'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer l'aire d'un rectangle identifié grâce au codage de ses diagonales.
 * @author Stéphane Guyon
 */
export default class AireQuadrilatereDiagonalesCodeesQcm extends ExerciceQcmA {
  private appliquerLesValeurs(longueurEnCm: number, largeurEnMm: number) {
    const largeurEnCm = largeurEnMm / 10
    const aireEnCm2 = longueurEnCm * largeurEnCm
    const perimetreEnCm = 2 * (longueurEnCm + largeurEnCm)

    const A = pointAbstrait(0, 0, 'A', 'below left')
    const B = pointAbstrait(5, 0.6, 'B', 'below right')
    const C = pointAbstrait(4, 3.8, 'C', 'above right')
    const D = pointAbstrait(-1, 3.2, 'D', 'above left')
    const O = milieu(A, C, 'O', 'below')
    const quadrilatere = polygone([A, B, C, D])
    quadrilatere.epaisseur = 2
    const diagonaleAC = segment(A, C)
    const diagonaleBD = segment(B, D)

    const objets = [
      diagonaleAC,
      diagonaleBD,
      quadrilatere,
      codageSegments('//', 'black', A, O, O, C, B, O, O, D),
      tracePoint(O),
      labelPoint(A, B, C, D, O),
      texteSurSegment(`$${longueurEnCm}\\text{ cm}$`, B, A, 'black', 0.7),
      texteSurSegment(`$${largeurEnMm}\\text{ mm}$`, C, B, 'black', 0.7),
    ]

    this.enonce = `Le quadrilatère $ABCD$ ci-dessous  n'est pas représenté à l'échelle.<br>
Calculer son aire.<br>
${mathalea2d(
  Object.assign(
    { pixelsParCm: 25, scale: 0.8, style: 'margin: auto' },
    fixeBordures(objets),
  ),
  objets,
)}`

    this.reponses = [
      `$${aireEnCm2}\\text{ cm}^2$`,
      `$${perimetreEnCm}\\text{ cm}$`,
      `$${perimetreEnCm}\\text{ cm}^2$`,
      `$${aireEnCm2}\\text{ cm}$`,
    ]

    this.correction = `Les quatre demi-diagonales portent le même codage : les diagonales de $ABCD$ se coupent donc en leur milieu et ont la même longueur.<br>
Un quadrilatère dont les diagonales se coupent en leur milieu est un parallélogramme. Si ses diagonales ont aussi la même longueur, alors c'est un rectangle.<br>
On convertit d'abord la largeur en centimètres : $${largeurEnMm}\\text{ mm}=${largeurEnCm}\\text{ cm}$.<br>
L'aire de ce rectangle est :<br>
$\\mathcal{A}=AB\\times BC=${longueurEnCm}\\times ${largeurEnCm}=${miseEnEvidence(`${aireEnCm2}\\text{ cm}^2`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(6, 40)
  }

  versionAleatoire = () => {
    let longueurEnCm: number
    let largeurEnCm: number
    do {
      longueurEnCm = randint(2, 9)
      largeurEnCm = randint(2, 9, longueurEnCm)
    } while (longueurEnCm * largeurEnCm === 2 * (longueurEnCm + largeurEnCm))
    this.appliquerLesValeurs(longueurEnCm, 10 * largeurEnCm)
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
