import { grille } from '../../lib/2d/Grille'
import { point } from '../../lib/2d/PointAbstrait'
import { labelPoint } from '../../lib/2d/textes'
import { tracePoint } from '../../lib/2d/TracePoint'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'

export const titre = 'Déterminer graphiquement un coefficient de colinéarité'
export const dateDePublication = '24/03/2026'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Déterminer graphiquement un coefficient de colinéarité sur une grille.
 * @author Nathan Scheinmann
 */
export const uuid = '2d848'

export const refs = {
  'fr-fr': [],
  'fr-ch': ['3G90-9'],
}

const BORNES = {
  minX: 1,
  maxX: 9,
  minY: 1,
  maxY: 7,
} as const

const DIRECTIONS = [
  [1, 1],
  [1, 2],
  [2, 1],
  [1, -1],
  [1, -2],
  [2, -1],
] as const

function intervalleDepart(
  deplacement: number,
  borneMin: number,
  borneMax: number,
) {
  return [
    Math.max(borneMin, borneMin - deplacement),
    Math.min(borneMax, borneMax - deplacement),
  ] as const
}

function pointsTousDistincts(...points: Array<{ x: number; y: number }>) {
  return new Set(points.map(({ x, y }) => `${x};${y}`)).size === points.length
}

export default class CoefficientColineariteGraphique extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.formatInteractif = 'fillInTheBlank'
  }

  nouvelleVersion() {
    const [dx, dy] = choice(DIRECTIONS)
    const longueurAB = randint(1, 3)
    const longueurCD = randint(1, 3, [longueurAB])
    const signe = choice([-1, 1])
    const coefficient = new FractionEtendue(signe * longueurCD, longueurAB)

    const abx = longueurAB * dx
    const aby = longueurAB * dy
    const cdx = signe * longueurCD * dx
    const cdy = signe * longueurCD * dy

    const [xminA, xmaxA] = intervalleDepart(abx, BORNES.minX, BORNES.maxX)
    const [yminA, ymaxA] = intervalleDepart(aby, BORNES.minY, BORNES.maxY)
    const [xminC, xmaxC] = intervalleDepart(cdx, BORNES.minX, BORNES.maxX)
    const [yminC, ymaxC] = intervalleDepart(cdy, BORNES.minY, BORNES.maxY)

    let xA = 0
    let yA = 0
    let xB = 0
    let yB = 0
    let xC = 0
    let yC = 0
    let xD = 0
    let yD = 0

    do {
      xA = randint(xminA, xmaxA)
      yA = randint(yminA, ymaxA)
      xB = xA + abx
      yB = yA + aby
      xC = randint(xminC, xmaxC)
      yC = randint(yminC, ymaxC)
      xD = xC + cdx
      yD = yC + cdy
    } while (
      !pointsTousDistincts(
        { x: xA, y: yA },
        { x: xB, y: yB },
        { x: xC, y: yC },
        { x: xD, y: yD },
      ) ||
      (xC - xA) * dy === (yC - yA) * dx
    )

    const A = point(xA, yA, 'A', 'below')
    const B = point(xB, yB, 'B', 'above')
    const C = point(xC, yC, 'C', 'below')
    const D = point(xD, yD, 'D', 'above')

    const objets = [
      grille(0, 0, 10, 8, 'gray', 1, 1),
      tracePoint(A, B, C, D),
      labelPoint(A, B, C, D),
    ]

    this.reponse = {
      champ1: {
        value: coefficient.texFractionSimplifiee,
        options: { fractionEgale: true },
      },
    }

    this.consigne =
      mathalea2d(
        {
          xmin: -0.5,
          ymin: -0.5,
          xmax: 10.5,
          ymax: 8.5,
          pixelsParCm: 20,
          mainlevee: false,
          amplitude: 0.5,
          scale: 0.6,
          style: 'margin: auto',
        },
        objets,
      ) + '<br>Compléter :'
    this.question = '\\overrightarrow{CD}={%{champ1}}\\overrightarrow{AB}'

    this.correction = `On lit sur la grille :
    $\\overrightarrow{AB}\\begin{pmatrix}${abx}\\\\${aby}\\end{pmatrix}$ et
    $\\overrightarrow{CD}\\begin{pmatrix}${cdx}\\\\${cdy}\\end{pmatrix}$.<br>
    Les vecteurs $\\overrightarrow{AB}$ et $\\overrightarrow{CD}$ sont colinéaires de ${signe === 1 ? 'même sens' : 'sens contraire'}.<br>
    Comme
    $\\begin{pmatrix}${cdx}\\\\${cdy}\\end{pmatrix}=
    ${coefficient.texFractionSimplifiee}\\begin{pmatrix}${abx}\\\\${aby}\\end{pmatrix}$,
    on obtient
    $\\overrightarrow{CD}=${miseEnEvidence(coefficient.texFractionSimplifiee)}\\overrightarrow{AB}$.`
  }
}
