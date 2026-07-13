import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygone } from '../../lib/2d/polygones'
import { labelPoint } from '../../lib/2d/textes'
import { texteSurSegment } from '../../lib/2d/texteSurSegment'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer le périmètre d'un quadrilatère"
export const dateDePublication = '19/06/2026'

export const uuid = '7c2e1'

export const refs = {
  'fr-fr': ['1A-G02-1', '2A-G3-1'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer le périmètre d'un quadrilatère représenté à main levée.
 * @author Stéphane Guyon
 */
export default class PerimetreQuadrilatereQcm extends ExerciceQcmA {
  private appliquerLesValeurs(
    longueurs: [abEnCm: number, bcEnMm: number, cdEnCm: number, daEnMm: number],
  ) {
    const [abEnCm, bcEnMm, cdEnCm, daEnMm] = longueurs
    const bcEnCm = bcEnMm / 10
    const daEnCm = daEnMm / 10
    const perimetreEnCm = abEnCm + bcEnCm + cdEnCm + daEnCm
    const perimetreAvecVirguleDecaleeADroite = perimetreEnCm * 10
    const perimetreAvecErreurDePuissance = perimetreEnCm / 10
    const sommeDesValeursSansUnites = abEnCm + bcEnMm + cdEnCm + daEnMm

    const A = pointAbstrait(0, 0, 'A', 'below left')
    const B = pointAbstrait(5, 0.5, 'B', 'below right')
    const C = pointAbstrait(4.2, 3.5, 'C', 'above right')
    const D = pointAbstrait(-0.8, 2.6, 'D', 'above left')
    const quadrilatere = polygone([A, B, C, D])
    quadrilatere.epaisseur = 2

    const objets = [
      quadrilatere,
      labelPoint(A, B, C, D),
      texteSurSegment(`$${abEnCm}\\text{ cm}$`, B, A, 'black', 0.7),
      texteSurSegment(`$${bcEnMm}\\text{ mm}$`, C, B, 'black', 0.7),
      texteSurSegment(`$${cdEnCm}\\text{ cm}$`, D, C, 'black', 0.7),
      texteSurSegment(`$${daEnMm}\\text{ mm}$`, A, D, 'black', 0.7),
    ]

    this.enonce = `Le quadrilatère $ABCD$ ci-dessous n'est pas représenté à l'échelle.<br>

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
)}
Son périmètre est égal à `

    this.reponses = [
      `$${perimetreEnCm}\\text{ cm}$`,
      `$${perimetreAvecVirguleDecaleeADroite}\\text{ cm}$`,
      `$${sommeDesValeursSansUnites}\\text{ cm}$`,
      `$${texNombre(perimetreAvecErreurDePuissance, 1)}\\text{ cm}$`,
    ]

    this.correction = `Pour additionner les longueurs, il faut d'abord les exprimer dans la même unité :<br>
$${bcEnMm}\\text{ mm}=${bcEnCm}\\text{ cm}$ et $${daEnMm}\\text{ mm}=${daEnCm}\\text{ cm}$.<br>
Le périmètre d'un quadrilatère est la somme des longueurs de ses quatre côtés.<br>
$\\begin{aligned}
P_{ABCD}&=AB+BC+CD+DA\\\\
&=${abEnCm}+${bcEnCm}+${cdEnCm}+${daEnCm}\\\\
&=${miseEnEvidence(`${perimetreEnCm}\\text{ cm}`)}.
\\end{aligned}$`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs([3, 40, 5, 20])
  }

  versionAleatoire = () => {
    this.appliquerLesValeurs([
      randint(2, 9),
      10 * randint(2, 9),
      randint(2, 9),
      10 * randint(2, 9),
    ])
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
