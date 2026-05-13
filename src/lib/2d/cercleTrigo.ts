import { ObjetMathalea2D } from './ObjetMathalea2D'
import {
  coopmathsCorpusLightest,
  noirMathalea,
  orangeMathalea,
  parseHexColor,
} from '../colors'
import {
  angleTex,
  normalizeAnglePiFraction,
  trigoCircleAngles,
} from '../mathFonctions/trigo'
import type FractionEtendue from '../../modules/FractionEtendue'

export type TrigoCircleMarkedPoint = {
  angle: number | FractionEtendue
  color?: string
  radius?: number
  label?: string
}

export type TrigoCircleOptions = {
  radius?: number
  showRadians?: boolean
  showDegrees?: boolean
  showCoordinates?: boolean
  showGuides?: boolean
  showAxisLabels?: boolean
  showBasePoints?: boolean
  guideAngles?: Array<number | FractionEtendue>
  labelAngles?: Array<number | FractionEtendue>
  markedPoints?: TrigoCircleMarkedPoint[]
}

function estimateTextHalfWidth(text: string, fontSize: number): number {
  let w = 0
  for (const ch of text) {
    if (ch === 'π') w += 0.78
    else if (ch === '√') w += 0.72
    else w += 0.58
  }
  return (w * fontSize) / 2
}

function svgFractionLabel(
  cx: number,
  cy: number,
  label: string,
  r: number,
): string {
  const slash = label.indexOf('/')
  if (slash === -1) {
    return `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" class="label">${label}</text>`
  }
  const num = label.slice(0, slash)
  const den = label.slice(slash + 1)
  const hh = r * 0.065
  const fs = r * 0.073
  const bw =
    Math.max(estimateTextHalfWidth(num, fs), estimateTextHalfWidth(den, fs)) +
    r * 0.012
  return (
    `<text x="${cx.toFixed(1)}" y="${(cy - hh).toFixed(1)}" class="frac-part">${num}</text>` +
    `<line x1="${(cx - bw).toFixed(1)}" y1="${(cy - 0.5).toFixed(1)}" x2="${(cx + bw).toFixed(1)}" y2="${(cy - 0.5).toFixed(1)}" class="frac-bar"/>` +
    `<text x="${cx.toFixed(1)}" y="${(cy + hh).toFixed(1)}" class="frac-part">${den}</text>`
  )
}

function svgAxisLabel(x: number, y: number, content: string): string {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="axis-label">${content}</text>`
}

function angleLabelRadiusFactor(angleDeg: number): number {
  const a = Math.round(angleDeg)
  if (a === 45 || a === 135 || a === 225 || a === 315) return 0.56
  if (a === 90 || a === 270) return 0.66
  if (a === 0 || a === 180) return 0.72
  return 0.8
}

export function compactTexForSvg(value: string): string {
  return value
    .replace(/-\\dfrac\{\\sqrt\{3\}\}\{2\}/g, '-√3/2')
    .replace(/\\dfrac\{\\sqrt\{3\}\}\{2\}/g, '√3/2')
    .replace(/-\\dfrac\{\\sqrt\{2\}\}\{2\}/g, '-√2/2')
    .replace(/\\dfrac\{\\sqrt\{2\}\}\{2\}/g, '√2/2')
    .replace(/-\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '-$1/$2')
    .replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\pi/g, 'π')
    .replace(/[{}]/g, '')
    .replace(/\\textnon définie/g, 'non définie')
}

function tikzColor(color: string): string {
  return parseHexColor(color) == null ? color : 'black'
}

function tikzColorDefinition(name: string, color: string): string {
  const parsed = parseHexColor(color)
  if (parsed == null) return ''
  return `\\definecolor{${name}}{HTML}{${parsed.withoutHash}}\n`
}

export class CercleTrigo extends ObjetMathalea2D {
  private options: Required<TrigoCircleOptions>

  constructor(options: TrigoCircleOptions = {}) {
    super()
    const radius = options.radius ?? 2
    this.options = {
      radius,
      showRadians: options.showRadians ?? true,
      showDegrees: options.showDegrees ?? false,
      showCoordinates: options.showCoordinates ?? false,
      showGuides: options.showGuides ?? true,
      showAxisLabels: options.showAxisLabels ?? true,
      showBasePoints: options.showBasePoints ?? true,
      guideAngles: options.guideAngles ?? [],
      labelAngles: options.labelAngles ?? [],
      markedPoints: options.markedPoints ?? [],
    }
    this.bordures = [-radius * 2.05, -radius * 1.9, radius * 2.05, radius * 1.9]
  }

  svg(coeff: number): string {
    const r = this.options.radius * coeff
    const degreeRadius = r * 0.5
    const guideColor = coopmathsCorpusLightest
    const pointR = (r * 0.033).toFixed(1)
    const pointStroke = (r * 0.013).toFixed(1)
    const arrowId = `${this.id}-arr`
    let code = `<g id="${this.id}" class="trigo-circle">`
    code += `<defs>
<marker id="${arrowId}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
<path d="M0,0 L6,3 L0,6 Z" fill="${guideColor}"/>
</marker>
</defs>`
    code += `<style>
.trigo-circle text{font-family:"KaTeX_Math","STIX Two Math","Latin Modern Math",Georgia,serif}
.trigo-circle .axis{stroke:${guideColor};stroke-width:1.2}
.trigo-circle .guide{stroke:${guideColor};stroke-width:.8;opacity:.35}
.trigo-circle .circle{fill:white;stroke:${noirMathalea};stroke-width:1.4}
.trigo-circle .label{fill:${noirMathalea};font-size:${(r * 0.082).toFixed(1)}px;text-anchor:middle;dominant-baseline:middle}
.trigo-circle .frac-part{fill:${noirMathalea};font-size:${(r * 0.073).toFixed(1)}px;text-anchor:middle;dominant-baseline:middle}
.trigo-circle .frac-bar{stroke:${noirMathalea};stroke-width:${(r * 0.005).toFixed(1)}}
.trigo-circle .coord{fill:${noirMathalea};font-size:${(r * 0.068).toFixed(1)}px;text-anchor:middle;dominant-baseline:middle}
.trigo-circle .axis-label{fill:${guideColor};font-size:${(r * 0.082).toFixed(1)}px;text-anchor:middle;dominant-baseline:middle}
.trigo-circle .degree{fill:${coopmathsCorpusLightest};font-size:${(r * 0.065).toFixed(1)}px;text-anchor:middle;dominant-baseline:middle}
</style>`
    code += `<circle class="circle" cx="0" cy="0" r="${r.toFixed(1)}"/>`
    code += `<line class="axis" x1="${(-1.2 * r).toFixed(1)}" y1="0" x2="${(1.22 * r).toFixed(1)}" y2="0" marker-end="url(#${arrowId})"/>`
    code += `<line class="axis" x1="0" y1="${(1.2 * r).toFixed(1)}" x2="0" y2="${(-1.22 * r).toFixed(1)}" marker-end="url(#${arrowId})"/>`
    if (this.options.showAxisLabels) {
      code += svgAxisLabel(1.32 * r, 0.1 * r, 'x')
      code += svgAxisLabel(0.08 * r, -1.32 * r, 'y')
    }
    if (this.options.showGuides) {
      const guideAngles =
        this.options.guideAngles.length > 0
          ? this.options.guideAngles
          : trigoCircleAngles.map((angle) => angle.angleRad)
      for (const guideAngle of guideAngles) {
        const normalized = normalizeAnglePiFraction(guideAngle)
        const radians = (normalized.num / normalized.den) * Math.PI
        code += `<line class="guide" x1="0" y1="0" x2="${(Math.cos(radians) * r).toFixed(1)}" y2="${(-Math.sin(radians) * r).toFixed(1)}"/>`
      }
    }
    for (const angle of trigoCircleAngles) {
      if (this.options.showBasePoints) {
        code += `<circle cx="${(angle.x * r).toFixed(1)}" cy="${(-angle.y * r).toFixed(1)}" r="${pointR}" fill="white" stroke="#216d9a" stroke-width="${pointStroke}"/>`
      }
      if (this.options.showRadians) {
        const mustShowLabel = this.options.labelAngles.length === 0
        if (mustShowLabel) {
          const lr = r * angleLabelRadiusFactor(angle.angleDeg)
          code += svgFractionLabel(
            angle.x * lr,
            -angle.y * lr,
            compactTexForSvg(angle.angleTex),
            r,
          )
        }
      }
      if (this.options.showDegrees) {
        code += `<text x="${(angle.x * degreeRadius).toFixed(1)}" y="${(-angle.y * degreeRadius).toFixed(1)}" class="degree">${angle.angleDeg}°</text>`
      }
      if (this.options.showCoordinates) {
        const cr = r * 1.22
        code += `<text x="${(angle.x * cr).toFixed(1)}" y="${(-angle.y * cr).toFixed(1)}" class="coord">(${compactTexForSvg(angle.cosTex)};${compactTexForSvg(angle.sinTex)})</text>`
      }
    }
    if (this.options.showRadians && this.options.labelAngles.length > 0) {
      for (const labelAngle of this.options.labelAngles) {
        const normalized = normalizeAnglePiFraction(labelAngle)
        const radians = (normalized.num / normalized.den) * Math.PI
        const degrees = (normalized.num / normalized.den) * 180
        const lr = r * angleLabelRadiusFactor(degrees)
        code += svgFractionLabel(
          Math.cos(radians) * lr,
          -Math.sin(radians) * lr,
          compactTexForSvg(angleTex(normalized)),
          r,
        )
      }
    }
    for (const point of this.options.markedPoints) {
      const normalized = normalizeAnglePiFraction(point.angle)
      const radians = (normalized.num / normalized.den) * Math.PI
      const color = point.color ?? orangeMathalea
      const pointRadius = (point.radius ?? 0.055) * coeff
      code += `<circle cx="${(Math.cos(radians) * r).toFixed(1)}" cy="${(-Math.sin(radians) * r).toFixed(1)}" r="${pointRadius.toFixed(1)}" fill="${color}" stroke="${noirMathalea}" stroke-width="0.6"/>`
    }
    code += '</g>'
    return code
  }

  tikz(): string {
    const r = this.options.radius
    let code = [
      `\\draw[->, gray] (${(-1.2 * r).toFixed(3)},0) -- (${(1.26 * r).toFixed(3)},0) node[above] {$x$};`,
      `\\draw[->, gray] (0,${(-1.2 * r).toFixed(3)}) -- (0,${(1.26 * r).toFixed(3)}) node[right] {$y$};`,
      `\\draw[thick] (0,0) circle (${r});`,
    ].join('\n')
    if (this.options.showGuides) {
      const guideAngles =
        this.options.guideAngles.length > 0
          ? this.options.guideAngles
          : trigoCircleAngles.map((angle) => angle.angleRad)
      code +=
        '\n' +
        guideAngles
          .map((guideAngle) => {
            const normalized = normalizeAnglePiFraction(guideAngle)
            const deg = (normalized.num / normalized.den) * 180
            return `\\draw[gray!45, thin] (0,0) -- (${deg}:${r});`
          })
          .join('\n')
    }
    for (const angle of trigoCircleAngles) {
      if (this.options.showBasePoints) {
        code += `\n\\fill (${angle.angleDeg}:${r}) circle (0.45pt);`
      }
      if (this.options.showRadians) {
        const mustShowLabel = this.options.labelAngles.length === 0
        if (mustShowLabel) {
          code += `\n\\node[font=\\tiny] at (${angle.angleDeg}:${(r * 0.78).toFixed(3)}) {$${angle.angleTex}$};`
        }
      }
      if (this.options.showDegrees) {
        code += `\n\\node[font=\\tiny, gray] at (${angle.angleDeg}:${(r * 0.5).toFixed(3)}) {$${angle.angleDeg}^{\\circ}$};`
      }
      if (this.options.showCoordinates) {
        code += `\n\\node[font=\\tiny] at (${angle.angleDeg}:${(r * 1.55).toFixed(3)}) {$\\left(${angle.cosTex};${angle.sinTex}\\right)$};`
      }
    }
    if (this.options.showRadians && this.options.labelAngles.length > 0) {
      for (const labelAngle of this.options.labelAngles) {
        const normalized = normalizeAnglePiFraction(labelAngle)
        const deg = (normalized.num / normalized.den) * 180
        code += `\n\\node[font=\\tiny] at (${deg}:${(r * angleLabelRadiusFactor(deg)).toFixed(3)}) {$${angleTex(normalized)}$};`
      }
    }
    for (let index = 0; index < this.options.markedPoints.length; index++) {
      const point = this.options.markedPoints[index]
      const normalized = normalizeAnglePiFraction(point.angle)
      const deg = (normalized.num / normalized.den) * 180
      const color = point.color ?? orangeMathalea
      const colorName = `trigoPoint${index}`
      code =
        tikzColorDefinition(colorName, color) +
        code +
        `\n\\fill[${parseHexColor(color) == null ? tikzColor(color) : colorName}] (${deg}:${r}) circle (${point.radius ?? 0.055});`
      if (point.label) {
        code += `\n\\node[font=\\scriptsize, ${parseHexColor(color) == null ? tikzColor(color) : colorName}] at (${deg}:${(r * 1.14).toFixed(3)}) {$${point.label}$};`
      }
    }
    return code
  }
}

export function cercleTrigo(options?: TrigoCircleOptions): CercleTrigo {
  return new CercleTrigo(options)
}
