import { context } from '../../modules/context'
import { bleuMathalea } from '../colors'
import type { IExercice } from '../types'
import MathaleaCustomElement from './MathaleaCustomElement'

type ValeurPoint = {
  pointValue: number
  label: string
}

type DemiDroiteInteractiveValue = {
  partsCount: number
  maxT: number
  showwNegative: boolean
  points: ValeurPoint[]
}

type DemiDroiteInteractiveIncomingValue = DemiDroiteInteractiveValue & {
  showNegative?: boolean
}

class DemiDroiteInteractiveElement extends MathaleaCustomElement {
  static readonly elementTag = 'demi-droite-interactive'

  private pointsColor = bleuMathalea
  private x0 = 0
  private initialX0 = 0
  private tMax = 2
  private initialTMax = 2
  private partsCount = 1
  private initialPartsCount = 1
  private minT = 2
  private maxT = 10
  private showNegative = false
  private initialShowNegative = false
  private allowMultiplePoints = false
  private points: ValeurPoint[] = []
  private initialPoints: ValeurPoint[] = []
  private isPointPlacementArmed = false
  private isPointEraseArmed = false
  private svg: SVGSVGElement | null = null
  private controls: HTMLDivElement | null = null
  id: string = ''

  static create(options: DemiDroiteInteractiveOptions = {}): string {
    const idAttribute = options.id ? ` id="${options.id}"` : ''
    const x0 = options.x0 ?? 0
    const initialT = options.initialT ?? 2
    const minT = options.minT ?? 2
    const maxT = options.maxT ?? 10
    const partsCount = options.partsCount ?? 1
    const showNegative = options.showNegative ?? false
    const multiplePoints = options.multiplePoints ?? false
    const interactivityOn = options.interactivityOn ?? true
    const pointsColor = options.pointsColor ?? bleuMathalea
    const pointsAttribute = escapeHtmlAttribute(
      JSON.stringify(options.points ?? []),
    )

    return `<demi-droite-interactive${idAttribute} x0="${x0}" initial-t="${initialT}" min-t="${minT}" max-t="${maxT}" show-negative="${showNegative}" multiple-points="${multiplePoints}" interactivity-on="${interactivityOn}" parts-count="${partsCount}" points="${pointsAttribute}" points-color="${pointsColor}"></demi-droite-interactive>`
  }

  connectedCallback() {
    this.pointsColor = this.getAttribute('points-color') ?? bleuMathalea
    this.id = String(this.getAttribute('id'))
    this.minT = Number(this.getAttribute('min-t') ?? '2')
    this.maxT = Number(this.getAttribute('max-t') ?? '10')
    this.initialTMax = Number(
      this.getAttribute('initial-t') ?? String(this.minT),
    )
    this.tMax = this.initialTMax
    this.tMax = Math.max(this.minT, Math.min(this.maxT, this.tMax))
    this.initialX0 = Number(this.getAttribute('x0') ?? '0')
    this.x0 = this.initialX0
    this.initialPartsCount = Math.max(
      1,
      Number(this.getAttribute('parts-count') ?? '1'),
    )
    this.partsCount = this.initialPartsCount
    this.showNegative = this.getAttribute('show-negative') === 'true'
    this.initialShowNegative = this.showNegative
    this.allowMultiplePoints = this.getAttribute('multiple-points') === 'true'
    this.interactivityOn = this.getAttribute('interactivity-on') !== 'false'
    this.initialPoints = this.parsePointsAttribute(this.getAttribute('points'))
    this.points = this.initialPoints.map((point) => ({ ...point }))

    this.style.display = 'block'
    this.render()
  }

  private parsePointsAttribute(pointsAttribute: string | null): ValeurPoint[] {
    if (!pointsAttribute) return []

    try {
      const parsed = JSON.parse(pointsAttribute)
      if (!Array.isArray(parsed)) return []

      return parsed
        .filter((point) => point && Number.isFinite(Number(point.pointValue)))
        .map((point, index) => ({
          pointValue: Number(point.pointValue),
          label:
            typeof point.label === 'string' && point.label.length > 0
              ? point.label
              : String.fromCharCode(65 + index),
        }))
    } catch {
      return []
    }
  }

  public get value(): DemiDroiteInteractiveValue {
    return {
      partsCount: this.partsCount,
      maxT: this.tMax,
      showwNegative: this.showNegative,
      points: this.points.map((point) => ({ ...point })),
    }
  }

  public set value(nextValue: DemiDroiteInteractiveIncomingValue | null) {
    if (nextValue === null) {
      this.points = []
      this.isPointPlacementArmed = false
      this.render()
      return
    }

    const maxT = Number(nextValue.maxT)
    if (Number.isFinite(maxT)) {
      this.tMax = Math.max(this.minT, Math.min(this.maxT, maxT))
    }

    const partsCount = Number(nextValue.partsCount)
    if (Number.isFinite(partsCount)) {
      this.partsCount = Math.max(1, Math.floor(partsCount))
    }

    const incomingShowNegative =
      nextValue.showwNegative ?? nextValue.showNegative
    this.showNegative = incomingShowNegative === true

    const availableValues = this.getAvailableValues()
    const valuesSet = new Set(availableValues)
    const rawPoints = Array.isArray(nextValue.points) ? nextValue.points : []
    const sanitizedPoints = rawPoints
      .filter((point) => Number.isFinite(Number(point.pointValue)))
      .map((point) => ({
        pointValue: Number(point.pointValue),
        label: typeof point.label === 'string' ? point.label : '',
      }))
      .filter((point) => valuesSet.has(point.pointValue))

    this.points = sanitizedPoints.map((point, index) => ({
      pointValue: point.pointValue,
      label: point.label || String.fromCharCode(65 + index),
    }))

    this.isPointPlacementArmed = false
    this.render()
  }

  public getValue(): DemiDroiteInteractiveValue {
    return this.value
  }

  public disableControls(): void {
    this.clearPlacementMode()
    this.interactivityOn = false
    this.render()
  }

  private getAxisStartValue(): number {
    if (this.showNegative) {
      return -this.initialTMax
    }
    return this.x0
  }

  private getParts(): number {
    return Math.max(1, this.partsCount)
  }

  private getAvailableValues(): number[] {
    const values = new Set<number>()
    const axisStartValue = this.getAxisStartValue()
    values.add(axisStartValue)
    values.add(this.tMax)

    const integerStart = Math.ceil(axisStartValue)
    const integerEnd = Math.floor(this.tMax)
    for (
      let integerValue = integerStart;
      integerValue <= integerEnd;
      integerValue++
    ) {
      values.add(integerValue)
    }

    const n = this.getParts()
    for (let k = 1; k < n; k++) {
      values.add(axisStartValue + (k * (this.tMax - axisStartValue)) / n)
    }

    return Array.from(values).sort((a, b) => a - b)
  }

  private valueExistsOnAxis(testValue: number): boolean {
    return this.getAvailableValues().some(
      (value) => Math.abs(value - testValue) < 1e-9,
    )
  }

  private createButton(
    text: string,
    onClick: () => void,
    selected = false,
    description?: string,
  ): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.innerHTML = text
    if (description) {
      button.title = description
      button.setAttribute('aria-label', description)
    }
    button.style.padding = '0.2rem 0.55rem'
    button.style.border = '1px solid #999'
    button.style.borderRadius = '6px'
    button.style.background = selected ? '#d9e7ff' : '#fff'
    button.style.boxShadow = selected
      ? 'inset 0 1px 3px rgba(0, 0, 0, 0.18)'
      : 'none'
    button.style.transform = selected ? 'translateY(1px)' : 'none'
    button.style.cursor = 'pointer'
    button.style.fontSize = '0.92rem'
    button.addEventListener('click', onClick)
    return button
  }

  private clearPlacementMode() {
    this.isPointPlacementArmed = false
    this.isPointEraseArmed = false
  }

  private resetToInitialState() {
    this.x0 = this.initialX0
    this.tMax = Math.max(this.minT, Math.min(this.maxT, this.initialTMax))
    this.partsCount = this.initialPartsCount
    this.showNegative = this.initialShowNegative
    this.points = this.initialPoints.map((point) => ({ ...point }))
    this.clearPlacementMode()
    this.render()
    this.emitChange()
  }

  private removePoint(pointValue: number, label: string) {
    const pointIndex = this.points.findIndex(
      (point) =>
        Math.abs(point.pointValue - pointValue) < 1e-9 && point.label === label,
    )
    if (pointIndex === -1) return

    this.points.splice(pointIndex, 1)
    this.render()
    this.emitChange()
  }

  private emitChange() {
    this.dispatchEvent(new CustomEvent('change', { bubbles: true }))
  }

  private nextLabel(): string {
    const charCode = 65 + this.points.length
    return String.fromCharCode(charCode)
  }

  private placePoint(pointValue: number) {
    if (this.allowMultiplePoints) {
      this.points.push({ pointValue, label: this.nextLabel() })
    } else {
      this.points = [{ pointValue, label: 'A' }]
    }
    this.render()
    this.emitChange()
  }

  render() {
    this.innerHTML = ''

    if (this.interactivityOn) {
      this.controls = document.createElement('div')
      this.controls.style.display = 'flex'
      this.controls.style.flexWrap = 'wrap'
      this.controls.style.gap = '0.5rem'
      this.controls.style.alignItems = 'center'
      this.controls.style.marginBottom = '0.6rem'
      const tMinus = this.createButton(
        'Max-',
        () => {
          this.clearPlacementMode()
          if (this.tMax > this.minT) {
            this.tMax--
            this.points = this.points.filter((point) =>
              this.valueExistsOnAxis(point.pointValue),
            )
            this.render()
            this.emitChange()
          }
        },
        false,
        'Diminuer la valeur de T',
      )
      const tPlus = this.createButton(
        'Max+',
        () => {
          this.clearPlacementMode()
          if (this.tMax < this.maxT) {
            this.tMax++
            this.render()
            this.emitChange()
          }
        },
        false,
        'Augmenter la valeur de T',
      )

      const dMinus = this.createButton(
        '|-',
        () => {
          this.clearPlacementMode()
          if (this.partsCount > 1) {
            this.partsCount--
            this.points = this.points.filter((point) =>
              this.valueExistsOnAxis(point.pointValue),
            )
            this.render()
            this.emitChange()
          }
        },
        false,
        'Diminuer le nombre de graduations intermédiaires',
      )
      const dPlus = this.createButton(
        '|+',
        () => {
          this.clearPlacementMode()

          this.partsCount++
          this.render()
          this.emitChange()
        },
        false,
        'Augmenter le nombre de graduations intermédiaires',
      )

      const deletePoints = this.createButton(
        '⌫',
        () => {
          this.clearPlacementMode()
          this.isPointEraseArmed = true
          this.render()
        },
        this.isPointEraseArmed,
        'Supprimer un point placé',
      )

      const resetAxis = this.createButton(
        '↺',
        () => {
          this.resetToInitialState()
        },
        false,
        'Réinitialiser la demi-droite',
      )

      const addPoint = this.createButton(
        this.allowMultiplePoints
          ? 'Ajouter un point (A, B, ...)'
          : 'Placer le point',
        () => {
          this.isPointEraseArmed = false
          this.isPointPlacementArmed = true
          this.render()
        },
        this.isPointPlacementArmed,
        this.allowMultiplePoints
          ? 'Activer le mode ajout de points'
          : 'Activer le mode placement du point',
      )
      if (this.minT < this.maxT) {
        this.controls.append(tMinus, tPlus)
      }
      this.controls.append(dMinus, dPlus, deletePoints, resetAxis, addPoint)
      this.appendChild(this.controls)
    }
    const resultatCheck = document.createElement('span')
    resultatCheck.id = this.id
      ? `${this.id.replace('demi-droite-graduee', 'resultatCheck')}`
      : `demi-droite-graduee-resultat`

    const width = 600
    const height = 70
    const margin = 22
    const axisY = 35
    const extensionAfterT = 24
    const arrowLength = 10
    const axisStart = margin
    const axisEnd = width - margin - arrowLength
    const valuesEnd = axisEnd - extensionAfterT
    const valuesLength = valuesEnd - axisStart
    const availableValues = this.getAvailableValues()
    const minValue = this.getAxisStartValue()
    const maxValue = this.tMax
    const totalAxis = maxValue - minValue

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.svg.setAttribute('width', String(width))
    this.svg.setAttribute('height', String(height))
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    this.svg.style.maxWidth = '100%'
    this.svg.style.height = 'auto'
    this.svg.style.border = '1px solid #d5d5d5'
    this.svg.style.borderRadius = '8px'
    this.svg.style.background = '#ffffff'

    const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    axis.setAttribute('x1', String(axisStart))
    axis.setAttribute('y1', String(axisY))
    axis.setAttribute('x2', String(axisEnd))
    axis.setAttribute('y2', String(axisY))
    axis.setAttribute('stroke', '#111')
    axis.setAttribute('stroke-width', '2')
    this.svg.appendChild(axis)

    const parts = this.getParts()
    if (parts >= 2) {
      const markerYOffset = 0
      const markerHalfWidth = 4
      const markerHalfHeight = 5
      for (let partIndex = 0; partIndex < parts; partIndex++) {
        const segmentStartValue =
          minValue + (partIndex * (maxValue - minValue)) / parts
        const segmentEndValue =
          minValue + ((partIndex + 1) * (maxValue - minValue)) / parts
        const midValue = (segmentStartValue + segmentEndValue) / 2
        const ratio = totalAxis === 0 ? 0 : (midValue - minValue) / totalAxis
        const markerX = axisStart + ratio * valuesLength

        const equalityMarker1 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line',
        )
        const equalityMarker2 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line',
        )
        equalityMarker1.setAttribute('x1', String(markerX - markerHalfWidth))
        equalityMarker1.setAttribute(
          'y1',
          String(axisY - markerYOffset - markerHalfHeight),
        )
        equalityMarker1.setAttribute('x2', String(markerX))
        equalityMarker1.setAttribute(
          'y2',
          String(axisY - markerYOffset + markerHalfHeight),
        )

        equalityMarker2.setAttribute('x1', String(markerX))
        equalityMarker2.setAttribute(
          'y1',
          String(axisY - markerYOffset - markerHalfHeight),
        )
        equalityMarker2.setAttribute('x2', String(markerX + markerHalfWidth))
        equalityMarker2.setAttribute(
          'y2',
          String(axisY - markerYOffset + markerHalfHeight),
        )
        equalityMarker1.setAttribute('stroke', '#f050d0')
        equalityMarker1.setAttribute('stroke-width', '1')
        equalityMarker1.setAttribute('stroke-linecap', 'round')
        this.svg.appendChild(equalityMarker1)
        equalityMarker2.setAttribute('stroke', '#f050d0')
        equalityMarker2.setAttribute('stroke-width', '1')
        equalityMarker2.setAttribute('stroke-linecap', 'round')
        this.svg.appendChild(equalityMarker2)
      }
    }

    const arrow = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polygon',
    )
    arrow.setAttribute(
      'points',
      `${axisEnd},${axisY} ${axisEnd - 10},${axisY - 5} ${axisEnd - 10},${axisY + 5}`,
    )
    arrow.setAttribute('fill', '#111')
    this.svg.appendChild(arrow)

    for (const value of availableValues) {
      const ratio = totalAxis === 0 ? 0 : (value - minValue) / totalAxis
      const x = axisStart + ratio * valuesLength
      const isIntegerValue = Number.isInteger(value)
      const tickHeight = isIntegerValue ? 18 : 12

      const tick = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      tick.setAttribute('x1', String(x))
      tick.setAttribute('y1', String(axisY - tickHeight / 2))
      tick.setAttribute('x2', String(x))
      tick.setAttribute('y2', String(axisY + tickHeight / 2))
      tick.setAttribute('stroke', isIntegerValue ? '#111' : '#444')
      tick.setAttribute('stroke-width', isIntegerValue ? '3' : '2')
      this.svg.appendChild(tick)

      if (isIntegerValue) {
        const label = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        )
        label.setAttribute('x', String(x))
        label.setAttribute('y', String(axisY + 28))
        label.setAttribute('text-anchor', 'middle')
        label.setAttribute('font-size', '13')
        label.setAttribute('fill', '#222')
        label.textContent = String(value)
        this.svg.appendChild(label)
      }

      const clickable = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      )
      clickable.setAttribute('cx', String(x))
      clickable.setAttribute('cy', String(axisY))
      clickable.setAttribute('r', '8')
      clickable.setAttribute('fill', 'transparent')
      if (this.interactivityOn) {
        clickable.style.cursor = this.isPointPlacementArmed
          ? 'crosshair'
          : 'default'
        clickable.addEventListener('click', () => {
          if (!this.isPointPlacementArmed) return
          this.placePoint(value)
        })
      }
      this.svg.appendChild(clickable)
    }

    for (const point of this.points) {
      const ratio =
        totalAxis === 0 ? 0 : (point.pointValue - minValue) / totalAxis
      const x = axisStart + ratio * valuesLength
      const cross = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      if (this.interactivityOn) {
        cross.style.cursor = this.isPointEraseArmed ? 'pointer' : 'default'
        cross.addEventListener('click', () => {
          if (!this.isPointEraseArmed) return
          this.removePoint(point.pointValue, point.label)
        })
      }

      const crossStroke = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      crossStroke.setAttribute('x1', String(x - 5))
      crossStroke.setAttribute('y1', String(axisY - 5))
      crossStroke.setAttribute('x2', String(x + 5))
      crossStroke.setAttribute('y2', String(axisY + 5))
      crossStroke.setAttribute('stroke', this.pointsColor)
      crossStroke.setAttribute('stroke-width', '2')
      crossStroke.setAttribute('stroke-linecap', 'round')
      cross.appendChild(crossStroke)

      const crossStrokeOpposite = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      crossStrokeOpposite.setAttribute('x1', String(x - 5))
      crossStrokeOpposite.setAttribute('y1', String(axisY + 5))
      crossStrokeOpposite.setAttribute('x2', String(x + 5))
      crossStrokeOpposite.setAttribute('y2', String(axisY - 5))
      crossStrokeOpposite.setAttribute('stroke', this.pointsColor)
      crossStrokeOpposite.setAttribute('stroke-width', '2')
      crossStrokeOpposite.setAttribute('stroke-linecap', 'round')
      cross.appendChild(crossStrokeOpposite)

      this.svg.appendChild(cross)

      const pLabel = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      )
      pLabel.setAttribute('x', String(x))
      pLabel.setAttribute('y', String(axisY - 16))
      pLabel.setAttribute('text-anchor', 'middle')
      pLabel.setAttribute('font-size', '14')
      pLabel.setAttribute('font-weight', '700')
      pLabel.setAttribute('fill', this.pointsColor)
      pLabel.textContent = point.label
      pLabel.style.pointerEvents = 'none'
      this.svg.appendChild(pLabel)
    }

    if (this.interactivityOn && this.isPointPlacementArmed) {
      const help = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      )
      help.setAttribute('x', String(width / 2))
      help.setAttribute('y', '148')
      help.setAttribute('text-anchor', 'middle')
      help.setAttribute('font-size', '12')
      help.setAttribute('fill', this.pointsColor)
      help.textContent = 'Cliquer sur une graduation pour y placer le point.'
      this.svg.appendChild(help)
    }

    this.appendChild(this.svg)
    this.appendChild(resultatCheck)
  }
}

if (customElements.get('demi-droite-interactive') === undefined) {
  customElements.define('demi-droite-interactive', DemiDroiteInteractiveElement)
}

type DemiDroiteInteractiveOptions = {
  x0?: number
  initialT?: number
  minT?: number
  maxT?: number
  partsCount?: number
  showNegative?: boolean
  multiplePoints?: boolean
  interactivityOn?: boolean
  points?: ValeurPoint[]
  id?: string
  pointsColor?: string
}

export function demiDroiteInteractive(
  exercice: IExercice,
  question: number,
  options?: DemiDroiteInteractiveOptions,
): string {
  if (!context.isHtml) return ''
  return DemiDroiteInteractiveElement.create({
    ...options,
    id:
      options?.id ||
      `demi-droite-gradueeEx${exercice.numeroExercice}Q${question}`,
  })
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export default DemiDroiteInteractiveElement
