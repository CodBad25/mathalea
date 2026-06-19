import { apigeomGraduatedLine } from '../../lib/apigeom/apigeomGraduatedLine'
import { wrapperApigeomToMathalea } from '../../lib/apigeom/apigeomZoom'
import { orangeMathalea } from '../../lib/colors'
import { arrondi } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

export const titre = "Lire l'abscisse d'un point sur une droite graduée"
export const dateDePublication = '17/06/2026'

/**
 * Clone QCM de 5R11-2 pour les automatismes de 2de.
 * @author Stéphane Guyon
 * @version 1.0.0
 * @since 17/06/2026
 */
export const uuid = '6d577'

export const refs = {
  'fr-fr': ['1A-G01-1'],
  'fr-ch': [],
}

type GraduationData = {
  x: number
  abs0: number
  xMin: number
  xMax: number
  scale: number
  precision: number
}

export default class Auto2AG10 extends ExerciceQcmA {
  constructor() {
    super()
    this.interactif = true
    this.nbQuestions = 1
    this.options = { vertical: true, ordered: false }
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaireNumerique = false
    this.versionAleatoire()
  }

  private buildGraduationData(): GraduationData {
    const precision = 3
    const abs0 = randint(-10, -2) / 100
    const step = 100
    const stepBis = 10
    const x = arrondi(
      abs0 + randint(0, 6) / step + randint(1, 9) / step / stepBis,
      precision,
    )

    return {
      x,
      abs0,
      xMin: abs0 - 1 / stepBis ** 4,
      xMax: abs0 + 7 / step + 1 / stepBis ** 3,
      scale: step,
      precision,
    }
  }

  private buildLineBoundsFromPoint(x: number) {
    const stepBis = 10
    const abs0 = Math.floor(x * 100) / 100
    return {
      xMin: abs0 - 1 / stepBis ** 4,
      xMax: abs0 + 7 / 100 + 1 / stepBis ** 3,
    }
  }

  private buildDistractors({ x, precision }: GraduationData) {
    const candidates = [
      arrondi(x * 10, precision),
      arrondi(x / 10, precision),
      arrondi(-x, precision),
      arrondi(-x * 10, precision),
      arrondi(-x / 10, precision),
    ]

    const distractors: number[] = []
    for (const candidate of candidates) {
      if (candidate !== x && !distractors.includes(candidate)) {
        distractors.push(candidate)
      }
      if (distractors.length === 3) break
    }

    let power = 2
    while (distractors.length < 3) {
      for (const direction of [1, -1]) {
        const candidate = arrondi(direction * x * 10 ** power, precision)
        if (candidate !== x && !distractors.includes(candidate)) {
          distractors.push(candidate)
        }
        if (distractors.length === 3) break
      }
      power++
    }

    return distractors
  }

  private buildLineWithPoint(
    { scale, xMin: correctXMin, xMax: correctXMax }: GraduationData,
    x: number,
  ): string {
    const { xMin, xMax } =
      x >= correctXMin && x <= correctXMax
        ? { xMin: correctXMin, xMax: correctXMax }
        : this.buildLineBoundsFromPoint(x)
    const { figure, latex } = apigeomGraduatedLine({
      xMin,
      xMax,
      scale,
    })

    figure.create('Point', {
      label: 'A',
      x,
      color: orangeMathalea,
      colorLabel: orangeMathalea,
      shape: 'x',
      labelDxInPixels: 0,
    })

    if (context.isHtml) return wrapperApigeomToMathalea(figure)

    const xA = arrondi((x - xMin) * scale * 10)
    return latex.replace(
      '\\end{tikzpicture}',
      `\\tkzText[above=2mm](${xA},0){A}
      \\tkzDrawPoint[shape=cross out, size=5pt, thick](${xA},0)
\\end{tikzpicture}`,
    )
  }

  versionAleatoire = () => {
    this.interactif = true
    const data = this.buildGraduationData()
    const distractors = this.buildDistractors(data)

    this.enonce = `On considère le point $A$ d'abscisse $${texNombre(data.x, data.precision)}$.<br>
Sur quelle droite graduée le point $A$ est-il correctement placé ?`

    this.correction = `Le point $A$ doit être placé à l'abscisse $${texNombre(data.x, data.precision)}$.<br>
Les autres propositions correspondent à des erreurs classiques : changement de signe ou confusion entre les puissances de 10.`

    this.reponses = [
      this.buildLineWithPoint(data, data.x),
      ...distractors.map((distractor) =>
        this.buildLineWithPoint(data, distractor),
      ),
    ]
  }
}
