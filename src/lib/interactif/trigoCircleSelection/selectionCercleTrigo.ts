import type FractionEtendue from '../../../modules/FractionEtendue'
import { context } from '../../../modules/context'
import { compactTexForSvg } from '../../2d/cercleTrigo'
import {
  normalizeAnglePiFraction,
  trigoCircleAngles,
} from '../../mathFonctions/trigo'
import type { IExercice } from '../../types'
import './TrigoCircleSelectionElement'

export function trigoCircleSelectionValue(
  angles: Array<number | FractionEtendue>,
): number {
  return angles.reduce<number>((sum, angle) => {
    const normalized = normalizeAnglePiFraction(angle)
    const index = trigoCircleAngles.findIndex(
      (entry) =>
        entry.angleRad.num === normalized.num &&
        entry.angleRad.den === normalized.den,
    )
    return index === -1 ? sum : sum + 2 ** index
  }, 0)
}

export function selectionCercleTrigo(
  exercice: IExercice,
  i: number,
  options: {
    showAngleLabels?: boolean
    showCoordinateLabels?: boolean
    style?: string
  } = {},
): string {
  if (!context.isHtml) return ''
  if (exercice.autoCorrection == null) exercice.autoCorrection = []
  if (exercice.autoCorrection[i] == null) exercice.autoCorrection[i] = {}
  exercice.autoCorrection[i].formatInteractif = 'svgSelection'
  const points = trigoCircleAngles.map((angle, index) => ({
    angleDeg: angle.angleDeg,
    value: 2 ** index,
    label: compactTexForSvg(angle.angleTex),
    coordinateLabel: `(${compactTexForSvg(angle.cosTex)};${compactTexForSvg(angle.sinTex)})`,
  }))
  const style = options.style ? ` style="${options.style}"` : ''
  const angleLabels =
    options.showAngleLabels === false ? ' show-angle-labels="false"' : ''
  const coordinates = options.showCoordinateLabels
    ? ' show-coordinate-labels'
    : ''
  return `<trigo-circle-selection-v2 class="mx-2 trigoCircleSelection" id="svgSelectionEx${exercice.numeroExercice}Q${i}"${style}${angleLabels}${coordinates} points="${encodeURIComponent(JSON.stringify(points))}"></trigo-circle-selection-v2><span id="resultatCheckEx${exercice.numeroExercice}Q${i}"></span>`
}
