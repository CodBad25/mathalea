import { courbe } from '../../lib/2d/Courbe'
import { repere } from '../../lib/2d/reperes'
import { tableauSignesFonction } from '../../lib/mathFonctions/etudeFonction'
import { choice } from '../../lib/outils/arrayOutils'
import type FractionEtendue from '../../modules/FractionEtendue'
import { mathalea2d } from '../../modules/mathalea2d'

import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'd7202'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Développer une identité remarquable'
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ8FMt2026 extends ExerciceQcmA {
  // sens = +1 : parabole vers le haut ; sens = -1 : vers le bas. Racines r1 < r2 (écart 4).
  private appliquerLesValeurs(sens: number, r1: number, r2: number): void {
    const a = 0.25 // écart de racines 4 => sommet à ∓1
    const xV = (r1 + r2) / 2
    const rMin = Math.min(r1, r2)
    const rMax = Math.max(r1, r2)

    const f = (x: number | FractionEtendue) =>
      sens * a * (Number(x) - r1) * (Number(x) - r2)
    const fInverse = (x: number | FractionEtendue) => -f(x) // signes inversés (mauvais sens)
    const fSommet = (x: number | FractionEtendue) => sens * (Number(x) - xV) // une seule racine, au sommet
    const fDecale = (x: number | FractionEtendue) =>
      sens * a * (Number(x) - (r1 + 1)) * (Number(x) - (r2 - 1)) // racines mal lues

    // --- GRAPHIQUE (ÉNONCÉ) ---
    const xMin = rMin - 5
    const xMax = rMax + 3
    const yMin = sens > 0 ? -2 : -6
    const yMax = sens > 0 ? 6 : 2

    const r = repere({
      xMin,
      xMax,
      yMin,
      yMax,
      thickHauteur: 0.1,
      grilleSecondaire: true,
      grilleSecondaireXDistance: 1,
      grilleSecondaireYDistance: 1,
      xLabelMin: xMin + 1,
      xLabelMax: xMax - 1,
      yLabelMin: yMin + 1,
      yLabelMax: yMax - 1,
      axeXStyle: '->',
      axeYStyle: '->',
    })

    const figure = mathalea2d(
      {
        xmin: xMin - 0.5,
        xmax: xMax + 0.5,
        ymin: yMin - 0.05,
        ymax: yMax + 0.05,
        pixelsParCm: 25,
        scale: 0.6,
        style: 'margin: auto',
      },
      r,
      courbe(f, { repere: r, color: 'red', epaisseur: 2 }),
    )

    this.enonce = `On considère la représentation graphique d'une fonction $f$ polynôme du second degré, définie sur $\\mathbb{R}$.<br><br>
${figure}<br>
Le tableau de signes de cette fonction $f$ est :`

    // --- RÉPONSES (tableaux de signes) ---
    const opts = {
      step: 1,
      tolerance: 0.1,
      substituts: [
        { antVal: -20, antTex: '-\\infty' },
        { antVal: 20, antTex: '+\\infty' },
      ],
    }
    this.reponses = [
      `${tableauSignesFonction(f, -20, 20, opts)}`,
      `${tableauSignesFonction(fInverse, -20, 20, opts)}`, // signes inversés
      `${tableauSignesFonction(fSommet, -20, 20, opts)}`, // racine au sommet
      `${tableauSignesFonction(fDecale, -20, 20, opts)}`, // racines mal lues
    ]

    // --- CORRECTION ---
    this.correction = `La courbe coupe l'axe des abscisses en $x=${rMin}$ et $x=${rMax}$.<br>`
    this.correction += `La fonction est positive lorsque sa courbe représentative est située au-dessus de l'axe des abscisses et elle est négative lorsque sa courbe est au-dessous de l'axe des abscisses.`
    this.correction += `On lit donc le tableau de signes suivant :<br>`
    this.correction += `${tableauSignesFonction(f, -20, 20, opts)}`
  }

  versionOriginale: () => void = () => {
    // Sujet de l'image : parabole vers le haut, racines 2 et 6  =>  + 0 - 0 +
    this.appliquerLesValeurs(1, 2, 6)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }
    const sens = choice([1, -1])
    const r1 = choice([1, 2, 3, 4])
    const r2 = r1 + 4
    this.appliquerLesValeurs(sens, r1, r2)
  }

  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionAleatoire()
  }
}
