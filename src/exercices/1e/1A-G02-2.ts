import { codageAngleDroit } from '../../lib/2d/CodageAngleDroit'
import { codageSegments } from '../../lib/2d/CodageSegment'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygone } from '../../lib/2d/polygones'
import { labelPoint } from '../../lib/2d/textes'
import { texteSurSegment } from '../../lib/2d/texteSurSegment'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer l'aire d'un quadrilatère codé"
export const dateDePublication = '19/06/2026'

export const uuid = 'b71d6'

export const refs = {
  'fr-fr': ['1A-G02-2'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer l'aire d'un rectangle identifié grâce aux codages.
 * @author Stéphane Guyon
 */
export default class AireQuadrilatereCodeQcm extends ExerciceQcmA {
  private appliquerLesValeurs(longueurEnCm: number, largeurEnMm: number) {
    const largeurEnCm = largeurEnMm / 10
    const aireEnCm2 = longueurEnCm * largeurEnCm
    const perimetreEnCm = 2 * (longueurEnCm + largeurEnCm)

    const A = pointAbstrait(0, 0, 'A', 'below left')
    const B = pointAbstrait(5, 0, 'B', 'below right')
    const C = pointAbstrait(5, 3, 'C', 'above right')
    const D = pointAbstrait(0, 3, 'D', 'above left')
    const quadrilatere = polygone([A, B, C, D])
    quadrilatere.epaisseur = 2

    const objets = [
      quadrilatere,
      labelPoint(A, B, C, D),
      codageAngleDroit(B, A, D),
      codageSegments('//', 'black', A, B, C, D),
      codageSegments('X', 'black', B, C, D, A),
      texteSurSegment(`$${longueurEnCm}\\text{ cm}$`, B, A, 'black', 0.7),
      texteSurSegment(`$${largeurEnMm}\\text{ mm}$`, C, B, 'black', 0.7),
    ]

    this.enonce = `Le quadrilatère $ABCD$ ci-dessous n'est pas représenté en vraie grandeur.<br>
Calculer son aire.<br>
${mathalea2d(
  Object.assign(
    { pixelsParCm: 25, scale: 0.8, center: true },
    fixeBordures(objets, {
      rxmin: -0.6,
      rxmax: 0.6,
      rymin: -0.15,
      rymax: 0.45,
    }),
  ),
  objets,
)}`

    this.reponses = [
      `$${aireEnCm2}\\text{ cm}^2$`,
      `$${perimetreEnCm}\\text{ cm}$`,
      `$${perimetreEnCm}\\text{ cm}^2$`,
      `$${aireEnCm2}\\text{ cm}$`,
    ]

    this.correction = `Les côtés opposés de $ABCD$ ont la même longueur et l'un de ses angles est droit : $ABCD$ est donc un rectangle.<br>
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
