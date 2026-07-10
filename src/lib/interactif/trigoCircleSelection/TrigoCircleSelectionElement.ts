import MathaleaCustomElement from '../../customElements/MathaleaCustomElement'

type TrigoCircleSelectionPoint = {
  angleDeg: number
  value: number
  label?: string
  coordinateLabel?: string
}

const svgNamespace = 'http://www.w3.org/2000/svg'
const BaseHTMLElement: typeof MathaleaCustomElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as unknown as typeof MathaleaCustomElement)
    : MathaleaCustomElement

class TrigoCircleSelectionElement extends BaseHTMLElement {
  static readonly elementTag = 'trigo-circle-selection-v2'

  private _points: TrigoCircleSelectionPoint[] = []
  private _selectedValues: Set<number> = new Set()
  private _updatingValueAttr = false
  private _showAngleLabels = true
  private _showCoordinateLabels = false

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static create({
    id,
    className,
    points,
    style,
    showAngleLabels,
    showCoordinateLabels,
  }: {
    id?: string
    className?: string
    points: TrigoCircleSelectionPoint[]
    style?: string
    showAngleLabels?: boolean
    showCoordinateLabels?: boolean
  }): string {
    const attrs: string[] = []
    if (id) attrs.push(`id="${id}"`)
    if (className) attrs.push(`class="${className}"`)
    if (style) attrs.push(`style="${style}"`)
    if (showAngleLabels === false) attrs.push('show-angle-labels="false"')
    if (showCoordinateLabels) attrs.push('show-coordinate-labels')
    attrs.push(`points="${encodeURIComponent(JSON.stringify(points))}"`)
    return `<trigo-circle-selection-v2 ${attrs.join(' ')}></trigo-circle-selection-v2>`
  }

  static get observedAttributes() {
    return [
      'points',
      'value',
      'disabled',
      'show-angle-labels',
      'show-coordinate-labels',
    ]
  }

  connectedCallback() {
    this.hydrateFromAttributes()
    this.render()
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return
    if (name === 'points') {
      this._points = this.parsePointsAttribute(newValue)
      this.render()
      return
    }
    if (name === 'value' && !this._updatingValueAttr) {
      this._selectedValues = this.decodeValue(Number(newValue))
      this.updateSelectionState()
      return
    }
    if (name === 'disabled') {
      this.updateDisabledState()
      return
    }
    if (name === 'show-angle-labels' || name === 'show-coordinate-labels') {
      this._showAngleLabels = this.getAttribute('show-angle-labels') !== 'false'
      this._showCoordinateLabels = this.hasAttribute('show-coordinate-labels')
      this.render()
    }
  }

  get value(): number {
    return Array.from(this._selectedValues).reduce(
      (sum, value) => sum + value,
      0,
    )
  }

  set value(val: number) {
    this._selectedValues = this.decodeValue(val)
    this.syncValueAttribute()
    this.updateSelectionState()
  }

  private hydrateFromAttributes() {
    this._points = this.parsePointsAttribute(this.getAttribute('points'))
    this._showAngleLabels = this.getAttribute('show-angle-labels') !== 'false'
    this._showCoordinateLabels = this.hasAttribute('show-coordinate-labels')
    const value = Number(this.getAttribute('value'))
    if (Number.isFinite(value)) this._selectedValues = this.decodeValue(value)
  }

  private parsePointsAttribute(
    value: string | null,
  ): TrigoCircleSelectionPoint[] {
    if (!value) return []
    try {
      const parsed = JSON.parse(decodeURIComponent(value))
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((point) => ({
          angleDeg: Number(point.angleDeg),
          value: Number(point.value),
          label: point.label == null ? undefined : String(point.label),
          coordinateLabel:
            point.coordinateLabel == null
              ? undefined
              : String(point.coordinateLabel),
        }))
        .filter(
          (point) =>
            Number.isFinite(point.angleDeg) &&
            Number.isFinite(point.value) &&
            point.value > 0,
        )
    } catch {
      return []
    }
  }

  private decodeValue(value: number): Set<number> {
    const selected = new Set<number>()
    if (!Number.isFinite(value) || value <= 0) return selected
    const sorted = [...this._points].sort((a, b) => b.value - a.value)
    let remaining = value
    for (const point of sorted) {
      if (point.value <= remaining) {
        selected.add(point.value)
        remaining -= point.value
      }
      if (remaining === 0) break
    }
    return remaining === 0 ? selected : new Set()
  }

  private syncValueAttribute() {
    if (!this.isConnected) return
    this._updatingValueAttr = true
    this.setAttribute('value', String(this.value))
    this._updatingValueAttr = false
  }

  private updateSelectionState() {
    if (!this.shadowRoot) return
    const buttons = Array.from(
      this.shadowRoot.querySelectorAll<SVGCircleElement>('circle[data-value]'),
    )
    for (const button of buttons) {
      const selected = this._selectedValues.has(Number(button.dataset.value))
      button.classList.toggle('is-selected', selected)
      button.setAttribute('aria-pressed', selected ? 'true' : 'false')
    }
  }

  private updateDisabledState() {
    if (!this.shadowRoot) return
    const disabled = this.hasAttribute('disabled')
    const buttons = Array.from(
      this.shadowRoot.querySelectorAll<SVGCircleElement>('circle[data-value]'),
    )
    for (const button of buttons) {
      button.classList.toggle('is-disabled', disabled)
      button.setAttribute('aria-disabled', disabled ? 'true' : 'false')
    }
  }

  private togglePoint = (event: Event) => {
    if (this.hasAttribute('disabled')) return
    const target = event.currentTarget as SVGCircleElement
    const value = Number(target.dataset.value)
    if (!Number.isFinite(value)) return
    if (this._selectedValues.has(value)) {
      this._selectedValues.delete(value)
    } else {
      this._selectedValues.add(value)
    }
    this.syncValueAttribute()
    this.updateSelectionState()
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
      }),
    )
  }

  private createSvgElement<K extends keyof SVGElementTagNameMap>(
    tagName: K,
  ): SVGElementTagNameMap[K] {
    return document.createElementNS(svgNamespace, tagName)
  }

  private angleLabel(angleDeg: number): string {
    const labels: Record<number, string> = {
      0: '0',
      30: 'π/6',
      45: 'π/4',
      60: 'π/3',
      90: 'π/2',
      120: '2π/3',
      135: '3π/4',
      150: '5π/6',
      180: 'π',
      210: '7π/6',
      225: '5π/4',
      240: '4π/3',
      270: '3π/2',
      300: '5π/3',
      315: '7π/4',
      330: '11π/6',
    }
    return labels[Math.round(angleDeg)] ?? ''
  }

  private labelRadius(angleDeg: number): number {
    const a = Math.round(angleDeg)
    // Quarter-angles (π/4 etc.) move inward to stagger with adjacent sixth/third angles
    if (a === 45 || a === 135 || a === 225 || a === 315) return 56
    if (a === 90 || a === 270) return 66
    if (a === 0 || a === 180) return 72
    // Sixth-angles (30°, 60°, 120°… 330°) go outward — gives 28px gap to neighbors
    return 80
  }

  private createFractionLabel(
    cx: number,
    cy: number,
    label: string,
  ): SVGElement {
    const slash = label.indexOf('/')
    if (slash === -1) {
      const t = this.createSvgElement('text')
      t.setAttribute('class', 'angle-label')
      t.setAttribute('x', cx.toFixed(2))
      t.setAttribute('y', cy.toFixed(2))
      t.textContent = label
      return t
    }
    const num = label.slice(0, slash)
    const den = label.slice(slash + 1)
    const hh = 6.5
    const g = this.createSvgElement('g')

    const numT = this.createSvgElement('text')
    numT.setAttribute('class', 'frac-part')
    numT.setAttribute('x', cx.toFixed(2))
    numT.setAttribute('y', (cy - hh).toFixed(2))
    numT.textContent = num

    const bar = this.createSvgElement('line')
    bar.setAttribute('class', 'frac-bar')
    // Placeholder — refined to actual text width after DOM insertion
    bar.setAttribute('x1', (cx - 8).toFixed(2))
    bar.setAttribute('x2', (cx + 8).toFixed(2))
    bar.setAttribute('y1', (cy - 0.5).toFixed(2))
    bar.setAttribute('y2', (cy - 0.5).toFixed(2))

    const denT = this.createSvgElement('text')
    denT.setAttribute('class', 'frac-part')
    denT.setAttribute('x', cx.toFixed(2))
    denT.setAttribute('y', (cy + hh).toFixed(2))
    denT.textContent = den

    g.appendChild(numT)
    g.appendChild(bar)
    g.appendChild(denT)

    // Refine bar to match actual rendered text width
    requestAnimationFrame(() => {
      try {
        const nw = (numT as SVGTextContentElement).getComputedTextLength()
        const dw = (denT as SVGTextContentElement).getComputedTextLength()
        const hw = Math.max(nw, dw) / 2 + 1.5
        bar.setAttribute('x1', (cx - hw).toFixed(2))
        bar.setAttribute('x2', (cx + hw).toFixed(2))
      } catch {
        // getBBox unavailable (e.g. SSR) — keep placeholder
      }
    })

    return g
  }

  render() {
    if (!this.shadowRoot) return
    this.shadowRoot.innerHTML = ''
    const style = document.createElement('style')
    style.textContent = `
:host {
  display: inline-block;
}
svg {
  max-width: min(46rem, 100%);
  height: auto;
  font-family: "KaTeX_Math", "STIX Two Math", "Latin Modern Math", Georgia, serif;
}
.axis, .radius {
  stroke: var(--color-coopmaths-corpus-lightest, #6a7c8d);
  stroke-width: 1.2;
}
.radius {
  opacity: 0.35;
}
.circle {
  fill: var(--color-coopmaths-canvas, #fff);
  stroke: var(--color-coopmaths-corpus, #1f2429);
  stroke-width: 1.6;
}
.angle-label {
  fill: var(--color-coopmaths-corpus, #1f2429);
  font-size: 11px;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}
.frac-part {
  fill: var(--color-coopmaths-corpus, #1f2429);
  font-size: 9px;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}
.frac-bar {
  stroke: var(--color-coopmaths-corpus, #1f2429);
  stroke-width: 0.8;
}
.coordinate-label {
  fill: var(--color-coopmaths-corpus-light, #45505b);
  font-size: 11px;
  text-anchor: middle;
  pointer-events: none;
}
.axis-end-label {
  fill: var(--color-coopmaths-corpus-lightest, #6a7c8d);
  font-size: 11px;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}
.choice {
  fill: var(--color-coopmaths-canvas, #fff);
  stroke: var(--color-coopmaths-struct, #216d9a);
  stroke-width: 2.2;
  cursor: pointer;
}
.choice:hover {
  fill: var(--color-coopmaths-warn-100, #e6f9db);
}
.choice.is-selected {
  fill: var(--color-coopmaths-action, #f15929);
  stroke: var(--color-coopmaths-action-darkest, #9f2e0a);
}
.choice.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.arrow-head {
  fill: var(--color-coopmaths-corpus-lightest, #6a7c8d);
}
`
    this.shadowRoot.appendChild(style)

    const svg = this.createSvgElement('svg')
    svg.setAttribute('viewBox', '-172 -162 344 324')
    svg.setAttribute('role', 'group')
    svg.setAttribute('aria-label', 'Cercle trigonometrique')

    const defs = this.createSvgElement('defs')
    defs.innerHTML =
      '<marker id="trigo-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path class="arrow-head" d="M0,0 L6,3 L0,6 Z"/></marker>'
    svg.appendChild(defs)

    const circle = this.createSvgElement('circle')
    circle.setAttribute('class', 'circle')
    circle.setAttribute('cx', '0')
    circle.setAttribute('cy', '0')
    circle.setAttribute('r', '100')
    svg.appendChild(circle)

    const axisX = this.createSvgElement('line')
    axisX.setAttribute('class', 'axis')
    axisX.setAttribute('x1', '-126')
    axisX.setAttribute('y1', '0')
    axisX.setAttribute('x2', '132')
    axisX.setAttribute('y2', '0')
    axisX.setAttribute('marker-end', 'url(#trigo-arrow)')
    svg.appendChild(axisX)

    const axisY = this.createSvgElement('line')
    axisY.setAttribute('class', 'axis')
    axisY.setAttribute('x1', '0')
    axisY.setAttribute('y1', '126')
    axisY.setAttribute('x2', '0')
    axisY.setAttribute('y2', '-132')
    axisY.setAttribute('marker-end', 'url(#trigo-arrow)')
    svg.appendChild(axisY)

    for (const point of this._points) {
      const angle = (point.angleDeg * Math.PI) / 180
      const x = Math.cos(angle) * 100
      const y = -Math.sin(angle) * 100
      const radius = this.createSvgElement('line')
      radius.setAttribute('class', 'radius')
      radius.setAttribute('x1', '0')
      radius.setAttribute('y1', '0')
      radius.setAttribute('x2', x.toFixed(2))
      radius.setAttribute('y2', y.toFixed(2))
      svg.appendChild(radius)
      if (this._showAngleLabels) {
        const lr = this.labelRadius(point.angleDeg)
        const labelText = point.label ?? this.angleLabel(point.angleDeg)
        svg.appendChild(
          this.createFractionLabel(
            Math.cos(angle) * lr,
            -Math.sin(angle) * lr,
            labelText,
          ),
        )
      }
      if (this._showCoordinateLabels && point.coordinateLabel) {
        const coordLabel = this.createSvgElement('text')
        coordLabel.setAttribute('class', 'coordinate-label')
        coordLabel.setAttribute('x', (Math.cos(angle) * 118).toFixed(2))
        coordLabel.setAttribute('y', (-Math.sin(angle) * 118).toFixed(2))
        coordLabel.textContent = point.coordinateLabel
        svg.appendChild(coordLabel)
      }
    }

    for (const point of this._points) {
      const angle = (point.angleDeg * Math.PI) / 180
      const button = this.createSvgElement('circle')
      button.setAttribute('class', 'choice')
      button.setAttribute('cx', (Math.cos(angle) * 100).toFixed(2))
      button.setAttribute('cy', (-Math.sin(angle) * 100).toFixed(2))
      button.setAttribute('r', '6')
      button.setAttribute('tabindex', '0')
      button.setAttribute('role', 'button')
      button.setAttribute(
        'aria-label',
        point.label ? `Selectionner ${point.label}` : 'Selectionner ce point',
      )
      button.dataset.value = String(point.value)
      button.addEventListener('click', this.togglePoint)
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          this.togglePoint(event)
        }
      })
      svg.appendChild(button)
    }

    this.shadowRoot.appendChild(svg)
    this.updateSelectionState()
    this.updateDisabledState()
  }
}

const elementName = 'trigo-circle-selection-v2'

if (
  typeof customElements !== 'undefined' &&
  customElements.get(elementName) === undefined
) {
  customElements.define(elementName, TrigoCircleSelectionElement)
}

export default TrigoCircleSelectionElement
