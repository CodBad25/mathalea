import { choice } from '../../outils/arrayOutils'
import { Figure2D } from '../Figures2D'
import { point } from '../PointAbstrait'
import { Segment, segment } from '../segmentsVecteurs'
/**
 * @author Jean-claude Lhote
 * @param nx nombre de studs en x
 * @param ny nombre
 * @param options
 * @returns
 */
export function briqueLego(options?: {
  nx?: number
  ny?: number
  fillStyle?: string
  strokeStyle?: string
  lineWidth?: number
  studFillStyle?: string
  studStrokeStyle?: string
}): Figure2D {
  let nx = options?.nx || 2
  let ny = options?.ny || 2
  if (nx < 1 || ny < 1) {
    nx = 1
    ny = 1
  }
  const color = choice([
    'blue',
    'brown',
    'green',
    'cyan',
    'darkgray',
    'pink',
    'orange',
    'red',
    'magenta',
    'purple',
    'violet',
    'white',
    'yellow',
  ])
  const fillStyle = options?.fillStyle || color
  const strokeStyle = options?.strokeStyle || 'black'
  const lineWidth = options?.lineWidth || 1
  const studFillStyle = options?.studFillStyle || color
  const studStrokeStyle = options?.studStrokeStyle || 'black'

  const width = nx / 2
  const height = ny / 2

  const codeSvg = `
<rect x="${-width * 10}" y="${-height * 10}" width="${width * 20}" height="${height * 20}" fill="${fillStyle}" stroke="${strokeStyle}" stroke-width="${lineWidth}" />
${Array.from({ length: nx }, (_, i) =>
  Array.from(
    { length: ny },
    (_, j) =>
      `<circle cx="${-width * 10 + 5 + i * 10}" cy="${-height * 10 + 5 + j * 10}" r="3" fill="${studFillStyle}" stroke="${studStrokeStyle}" stroke-width="${lineWidth}" />`,
  ).join(''),
).join('')}
`.trim()

  const codeTikz = `
\\draw[fill=${fillStyle}, draw=${strokeStyle}, line width=${lineWidth}pt] (${(-width / 2).toFixed(1)},${(-height / 2).toFixed(1)}) rectangle (${(width / 2).toFixed(1)},${(height / 2).toFixed(1)});
\\foreach \\x in {0,...,${nx - 1}} {
  \\foreach \\y in {0,...,${ny - 1}} {
    \\fill[${studFillStyle}] (${(-width / 2 + 0.25).toFixed(2)}+\\x/2,${(-height / 2 + 0.25).toFixed(2)}+\\y/2) circle (0.15);
    \\draw[draw=${studStrokeStyle}, line width=${lineWidth}pt] (${(-width / 2 + 0.25).toFixed(2)}+\\x/2,${(-height / 2 + 0.25).toFixed(2)}+\\y/2) circle (0.15);
  }
}
`.trim()

  const axes: Segment[] = []
  if (nx === ny) {
    axes.push(
      segment(
        -width * 0.6 - 0.2,
        -height * 0.6 - 0.2,
        width * 0.6 + 0.2,
        height * 0.6 + 0.2,
      ),
    )
    axes.push(
      segment(
        -width * 0.6 - 0.2,
        height * 0.6 + 0.2,
        width * 0.6 + 0.2,
        -height * 0.6 - 0.2,
      ),
    )
  }
  axes.push(segment(-width * 0.6 - 0.2, 0, width * 0.6 + 0.2, 0))
  axes.push(segment(0, -height * 0.6 - 0.2, 0, height * 0.6 + 0.2))
  return new Figure2D({
    codeSvg,
    codeTikz,
    width: nx / 2,
    height: ny / 2,
    axes,
    centre: point(0, 0),
  })
}
