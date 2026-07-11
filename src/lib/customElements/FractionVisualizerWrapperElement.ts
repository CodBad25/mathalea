import FractionVisualizer from 'fraction-visualizer'
import { context } from '../../modules/context'
import MathaleaCustomElement from './MathaleaCustomElement'

if (customElements.get('fraction-visualizer') === undefined) {
  customElements.define('fraction-visualizer', FractionVisualizer)
}

export type FractionVisualizerWrapperOptions = {
  shape?: 'square' | 'disk' | 'rectangle' | 'bar' | 'segment'
  filled?: number
  total?: number
  showFilledSlider?: boolean
  borderMode?: 'none' | 'filled' | 'all' | 'cursor'
  showPartNumbers?: boolean
  showLabels?: boolean
  labelStart?: number
  labelValues?: string
  sliderMaxInput?: number
  borderCount?: number
  interactivityOn?: boolean
}

class FractionVisualizerWrapperElement extends MathaleaCustomElement {
  static readonly elementTag = 'mathalea-fraction-visualizer'

  static create(options: FractionVisualizerWrapperOptions = {}): string {
    if (!context.isHtml) return ''
    return super.create(options)
  }

  connectedCallback() {
    super.connectedCallback()
  }

  render(): string | void {
    if (!context.isHtml) return this.renderLatex()

    this.innerHTML = ''
    const inner = document.createElement('fraction-visualizer')

    for (const name of this.getAttributeNames()) {
      if (name === 'interactivity-on') continue
      const attr = this.getAttribute(name)
      if (attr != null) inner.setAttribute(name, attr)
    }

    if (!this.interactivityOn) {
      inner.style.pointerEvents = 'none'
      inner.style.opacity = '0.9'
    }

    this.appendChild(inner)
    return ''
  }

  protected renderLatex(): string {
    return ''
  }

  get value(): unknown {
    const inner = this.querySelector(
      'fraction-visualizer',
    ) as HTMLElement | null
    if (inner && 'value' in (inner as unknown as Record<string, unknown>)) {
      return (inner as unknown as { value: unknown }).value
    }
    return null
  }

  set value(nextValue: unknown) {
    const inner = this.querySelector(
      'fraction-visualizer',
    ) as HTMLElement | null
    if (inner && 'value' in (inner as unknown as Record<string, unknown>)) {
      ;(inner as unknown as { value: unknown }).value = nextValue
    }
  }

  protected onInteractivityChanged(isOn: boolean): void {
    const inner = this.querySelector(
      'fraction-visualizer',
    ) as HTMLElement | null
    if (!inner) return
    inner.style.pointerEvents = isOn ? '' : 'none'
    inner.style.opacity = isOn ? '' : '0.9'
  }
}

if (customElements.get('mathalea-fraction-visualizer') === undefined) {
  customElements.define(
    'mathalea-fraction-visualizer',
    FractionVisualizerWrapperElement,
  )
}

export default FractionVisualizerWrapperElement
