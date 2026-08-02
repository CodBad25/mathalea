import Figure from 'apigeom'
import { get } from 'svelte/store'
import { canOptions } from '../../../src/lib/stores/canStore'
import { globalOptions } from '../../../src/lib/stores/globalOptions'
import { context } from '../../../src/modules/context'
import { setupFractionFigureIfNeeded } from './setupFractionFigure'

export class ApigeomFigureElement extends HTMLElement {
  static autoIndex = 0

  static get observedAttributes() {
    return [
      'figure-json',
      'numero-exercice',
      'auto-index',
      'index',
      'x-min',
      'y-min',
      'width',
      'height',
      'animation',
      'default-action',
      'interactive',
      'has-feedback',
      'id-addendum',
    ]
  }

  private figure?: Figure
  private destroyed = false
  private oldZoom = 1
  private idApigeom!: string

  private resolveIndex(): string {
    const attr = this.hasAttribute('auto-index')
    if (attr) {
      return 'A' + ApigeomFigureElement.autoIndex++
    }
    return ''
  }

  /* ==============================
     Lifecycle
  ============================== */

  connectedCallback() {
    if (!context.isHtml) return
    this.render()
    this.createFigure()
    this.bindEvents()
  }

  disconnectedCallback() {
    this.destroy()
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    // if (!this.isConnected) return
    // console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`)
  }

  /* ==============================
     Rendering
     ============================== */

  private render() {
    const index = Number(this.getAttribute('index') ?? 0)
    const numeroExercice = Number(this.getAttribute('numero-exercice') ?? 0)
    const hasFeedback = this.hasAttribute('has-feedback')
    const autoIndex = this.resolveIndex()

    this.idApigeom = `apigeomEx${numeroExercice}F${index}${this.getAttribute('id-addendum') ?? ''}${autoIndex}`

    this.figure = new Figure({
      xMin: Number(this.getAttribute('x-min') ?? 0),
      yMin: Number(this.getAttribute('y-min') ?? 0),
      width: Number(this.getAttribute('width') ?? 400),
      height: Number(this.getAttribute('height') ?? 400),
    })

    const script = this.querySelector('script[type="application/json"]')
    if (!script) return

    const jsonText = script.textContent?.trim()
    if (!jsonText) return
    this.figure.loadJson(JSON.parse(jsonText))

    setupFractionFigureIfNeeded(this.figure)

    this.innerHTML = `
      <script type="application/json">${jsonText}</script>
      <div class="m-6 leading-none" id="${this.idApigeom}"></div>
      ${
        hasFeedback && !autoIndex
          ? `
        <span id="resultatCheckEx${numeroExercice}Q${index}"></span>
        <div class="ml-2 py-2 text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest"
             id="feedbackEx${numeroExercice}Q${index}"></div>`
          : ''
      }
    `
  }

  /* ==============================
     Figure creation
     ============================== */

  private createFigure() {
    if (this.figure === undefined) return

    const interactive = this.hasAttribute('interactive')
    this.figure.isDynamic = interactive
    this.figure.divButtons.style.display = interactive ? 'grid' : 'none'

    const container = this.querySelector(`#${this.idApigeom}`) as HTMLDivElement
    if (!container) return

    this.figure.setContainer(container)

    const defaultAction = this.getAttribute('default-action')
    if (defaultAction) {
      this.figure.buttons.get(defaultAction)?.click()
    }

    this.applyZoom()
  }

  /* ==============================
     Events
     ============================== */

  private onReload = (event: Event) => {
    if (!this.figure?.options) return
    const json = (event as CustomEvent).detail
    this.figure.loadJson(JSON.parse(json))

    if (get(canOptions).isChoosen && get(canOptions).state === 'solutions') {
      this.figure.divButtons.style.display = 'none'
      this.figure.divUserMessage.style.display = 'none'
    }
  }

  private onReloadBound = this.onReload.bind(this)

  private onZoom = (event: Event) => {
    if (!this.figure?.options) return
    const zoom = Number((event as CustomEvent).detail.zoom)
    if (zoom !== this.oldZoom) {
      this.oldZoom = zoom
      this.figure.zoom(zoom, {
        changeHeight: true,
        changeWidth: true,
        changeLeft: false,
        changeBottom: false,
      })
    }
  }

  private onZoomBound = this.onZoom.bind(this)

  private applyZoom() {
    const zoom = Number(get(globalOptions).z)
    if (zoom !== this.oldZoom && this.figure) {
      this.oldZoom = zoom
      this.figure.zoom(zoom, {
        changeHeight: true,
        changeWidth: true,
        changeLeft: false,
        changeBottom: false,
      })
    }
  }

  private bindEvents() {
    document.addEventListener(this.idApigeom, this.onReloadBound)
    document.addEventListener('zoomChanged', this.onZoomBound)
  }

  /* ==============================
     Cleanup
     ============================== */

  private destroy() {
    if (this.destroyed) return
    this.destroyed = true

    document.removeEventListener(this.idApigeom, this.onReloadBound)
    document.removeEventListener('zoomChanged', this.onZoomBound)

    this.figure?.destroy?.()
    this.figure = undefined
  }
}

export default function handleApigeomFigureElement() {
  if (!customElements.get('apigeom-figure')) {
    customElements.define('apigeom-figure', ApigeomFigureElement)
  }
}
