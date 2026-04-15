import { orangeMathalea } from '../lib/colors'
/**
 * Horloge interactive
 * @author Rémi Angot
 *
 * @attr {number} hour - L'heure initiale de l'horloge (0-12)
 * @attr {number} minute - La minute initiale de l'horloge (0-59)
 * @attr {number} [second=0] - La seconde initiale de l'horloge (0-59)
 * @attr {boolean} [isDynamic=true] - Indique si l'horloge est interactive
 * @attr {boolean} [showHands=true] - Indique si les aiguilles de l'horloge doivent être affichées
 * @attr {boolean} [showSecond=true] - Indique si l'aiguille des secondes doit être affichée
 */
class InteractiveClock extends HTMLElement {
  static readonly BASE_RENDER_SIZE_EM = 12.5
  svgHandHour!: SVGElement
  svgHandMinute!: SVGElement
  svgHandSecond!: SVGElement
  radius = 200
  showHands = true
  showSecond = false
  draggingHand: boolean
  previousMinute = 0
  previousSecond = 0
  private _isDynamic = true
  private _currentAction?: 'hour' | 'minute' | 'second'

  constructor() {
    super()
    this.hour = this.getAttribute('hour')
      ? Number(this.getAttribute('hour'))
      : 12
    this.minute = this.getAttribute('minute')
      ? Number(this.getAttribute('minute'))
      : 0
    this.svgHandHour = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line',
    )
    this.svgHandMinute = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line',
    )
    this.svgHandSecond = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line',
    )
    this.showHands = !(this.getAttribute('showHands') === 'false')
    this.showSecond = this.hasAttribute('showSecond')
      ? !(this.getAttribute('showSecond') === 'false')
      : false
    this.isDynamic = !(this.getAttribute('isDynamic') === 'false')
    this.draggingHand = false
  }

  /**
   * Méthode appelée lorsque l'élément est ajouté au DOM
   */
  connectedCallback() {
    const container = document.createElement('div')
    container.className = 'flex flex-wrap items-center'

    const svgContainer = document.createElement('div')
    svgContainer.className = 'flex-1 flex justify-center items-center p-8'

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svgContainer.appendChild(svg)
    svg.setAttribute(
      'width',
      `${InteractiveClock.BASE_RENDER_SIZE_EM.toString()}em`,
    )
    svg.setAttribute(
      'height',
      `${InteractiveClock.BASE_RENDER_SIZE_EM.toString()}em`,
    )
    svg.setAttribute('viewBox', '-200 -200 400 400')
    svg.style.maxWidth = '100%'
    svg.style.height = 'auto'

    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle',
    )
    circle.setAttribute('cx', '0')
    circle.setAttribute('cy', '0')
    circle.setAttribute('r', '200')
    circle.setAttribute('stroke', 'black')
    circle.setAttribute('stroke-opacity', '0.8')
    circle.setAttribute('fill', 'none')
    svg.appendChild(circle)

    const circleCentral = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle',
    )
    circleCentral.setAttribute('cx', '0')
    circleCentral.setAttribute('cy', '0')
    circleCentral.setAttribute('r', '10')
    circleCentral.setAttribute('stroke', 'black')
    circleCentral.setAttribute('fill', 'black')
    svg.appendChild(circleCentral)

    // Ajouter les nombres de 1 à 12
    for (let i = 1; i <= 12; i++) {
      const angle = (i / 12) * 2 * Math.PI
      const x = Math.sin(angle) * 160
      const y = -Math.cos(angle) * 160
      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      )
      text.setAttribute('x', x.toString())
      text.setAttribute('y', y.toString())
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('alignment-baseline', 'middle')
      text.setAttribute('font-size', '20')
      text.textContent = i.toString()
      text.setAttribute('pointer-events', 'none')
      text.style.userSelect = 'none'
      text.style.webkitUserSelect = 'none'
      svg.appendChild(text)
    }

    // Ajouter les petits traits pour chaque graduation
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI
      let x1 = Math.sin(angle) * 190
      let y1 = -Math.cos(angle) * 190
      const x2 = Math.sin(angle) * 200
      const y2 = -Math.cos(angle) * 200
      if (i % 5 === 0) {
        x1 = Math.sin(angle) * 180
        y1 = -Math.cos(angle) * 180
      }

      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      line.setAttribute('x1', x1.toString())
      line.setAttribute('y1', y1.toString())
      line.setAttribute('x2', x2.toString())
      line.setAttribute('y2', y2.toString())
      line.setAttribute('stroke', 'black')
      if (i % 5 === 0) {
        line.setAttribute('stroke-width', '5')
      }
      svg.appendChild(line)
    }

    // Ajouter les aiguilles
    if (this.showHands) {
      this.svgHandHour = this.createHand(100, 'hour')
      this.svgHandMinute = this.createHand(150, 'minute')
      if (this.showSecond) {
        this.svgHandSecond = this.createHand(170, 'second')
      }
      this.updateHandHour()
      this.updateHandMinute()
      if (this.showSecond) {
        this.updateHandSecond()
      }
      svg.appendChild(this.svgHandHour)
      svg.appendChild(this.svgHandMinute)
      if (this.showSecond) {
        svg.appendChild(this.svgHandSecond)
      }
    }

    container.appendChild(svgContainer)
    this.appendChild(container)

    if (this.isDynamic) {
      this.currentAction = 'minute'
      const preventDefault = (event: PointerEvent | TouchEvent) => {
        event.preventDefault()
      }

      const handlePointerDown = (event: PointerEvent | TouchEvent) => {
        this.draggingHand = true
        // Empêche le défilement pendant le drag
        svg.addEventListener('pointermove', preventDefault, { passive: false })
        svg.addEventListener('touchmove', preventDefault, { passive: false })
      }

      const handlePointerUp = () => {
        this.draggingHand = false
        // Réactive le défilement après le drag
        svg.removeEventListener('pointermove', preventDefault)
        svg.removeEventListener('touchmove', preventDefault)
      }

      svg.addEventListener('pointerdown', handlePointerDown)
      svg.addEventListener('pointerup', handlePointerUp)
      svg.addEventListener('pointermove', (event) => this.dragHand(event))

      svg.addEventListener('touchstart', handlePointerDown)
      svg.addEventListener('touchend', handlePointerUp)
      svg.addEventListener('touchmove', (event) => this.dragHand(event))

      this.svgHandHour.addEventListener('pointerdown', (event) => {
        this.draggingHand = true
        this.currentAction = 'hour'
        handlePointerDown(event)
      })
      this.svgHandHour.addEventListener('pointerup', handlePointerUp)

      this.svgHandMinute.addEventListener('pointerdown', (event) => {
        this.draggingHand = true
        this.currentAction = 'minute'
        handlePointerDown(event)
      })
      this.svgHandMinute.addEventListener('pointerup', handlePointerUp)

      if (this.showSecond) {
        this.svgHandSecond.addEventListener('pointerdown', (event) => {
          this.draggingHand = true
          this.currentAction = 'second'
          handlePointerDown(event)
        })
        this.svgHandSecond.addEventListener('pointerup', handlePointerUp)
      }
    }
  }

  /**
   * Création d'une aiguille
   */
  createHand(length: number, type: 'hour' | 'minute' | 'second') {
    const hand = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    hand.setAttribute('x1', '0')
    hand.setAttribute('y1', '0')
    hand.setAttribute('stroke', 'black')
    if (type === 'hour') {
      hand.setAttribute('stroke-width', '12')
    } else if (type === 'minute') {
      hand.setAttribute('stroke-width', '8')
    } else {
      hand.setAttribute('stroke-width', '3')
    }
    hand.setAttribute('stroke-linecap', 'round')
    hand.setAttribute('class', type + '-hand')
    return hand
  }

  updateHandHour(adaptHourHandToMinutes = true) {
    let angle = (this.hour / 12) * 2 * Math.PI
    if (adaptHourHandToMinutes) {
      angle += (this.minute / 360) * Math.PI
    }
    const x2 = Math.sin(angle) * 100
    const y2 = -Math.cos(angle) * 100
    this.svgHandHour.setAttribute('x2', x2.toString())
    this.svgHandHour.setAttribute('y2', y2.toString())
  }

  updateHandMinute() {
    const angle = (this.minute / 60) * 2 * Math.PI
    const x2 = Math.sin(angle) * 150
    const y2 = -Math.cos(angle) * 150
    this.svgHandMinute.setAttribute('x2', x2.toString())
    this.svgHandMinute.setAttribute('y2', y2.toString())
  }

  updateHandSecond() {
    const angle = (this.second / 60) * 2 * Math.PI
    const x2 = Math.sin(angle) * 170
    const y2 = -Math.cos(angle) * 170
    this.svgHandSecond.setAttribute('x2', x2.toString())
    this.svgHandSecond.setAttribute('y2', y2.toString())
  }

  dragHand(event: MouseEvent | TouchEvent) {
    if (!this.isDynamic) return
    if (!this.draggingHand) return
    const rect = (event.target as SVGElement).getBoundingClientRect()
    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY
    const x = clientX - rect.left - rect.width / 2
    const y = clientY - rect.top - rect.height / 2
    // Ne rien faire si on est trop près du centre
    if (Math.sqrt(x * x + y * y) < 20) return
    const angle = (Math.atan2(y, x) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)
    const value = Math.round(
      (angle / (2 * Math.PI)) * (this.currentAction === 'hour' ? 12 : 60),
    )
    if (this.currentAction === 'hour') {
      this.hour = value
    } else if (this.currentAction === 'minute') {
      if (this.previousMinute > 50 && value < 10) {
        this.hour = (this.hour + 1) % 12
      } else if (this.previousMinute < 10 && value > 50) {
        this.hour = (this.hour + 11) % 12
      }
      this.minute = value
    } else if (this.currentAction === 'second') {
      if (this.previousSecond > 50 && value < 10) {
        this.minute = (this.minute + 1) % 60
      } else if (this.previousSecond < 10 && value > 50) {
        this.minute = (this.minute + 59) % 60
      }
      this.second = value
    }
    this.updateHandHour()
    this.updateHandMinute()
    this.updateHandSecond()
  }

  disconnectedCallback() {
    // Code pour gérer la suppression de l'horloge du DOM
  }

  get currentAction() {
    return this._currentAction
  }

  set currentAction(value: 'hour' | 'minute' | 'second' | undefined) {
    this._currentAction = value
    if (value === 'hour') {
      this.svgHandHour.setAttribute('stroke', '#216D9A')
      this.svgHandMinute.setAttribute('stroke', orangeMathalea)
      this.svgHandSecond.setAttribute('stroke', orangeMathalea)
    } else if (value === 'minute') {
      this.svgHandHour.setAttribute('stroke', orangeMathalea)
      this.svgHandMinute.setAttribute('stroke', '#216D9A')
      this.svgHandSecond.setAttribute('stroke', orangeMathalea)
    } else if (value === 'second') {
      this.svgHandHour.setAttribute('stroke', orangeMathalea)
      this.svgHandMinute.setAttribute('stroke', orangeMathalea)
      this.svgHandSecond.setAttribute('stroke', '#216D9A')
    } else {
      this.svgHandHour.setAttribute('stroke', 'black')
      this.svgHandMinute.setAttribute('stroke', 'black')
      this.svgHandSecond.setAttribute('stroke', 'black')
    }
  }

  get hour() {
    return Number(this.getAttribute('hour'))
  }

  set hour(value: number) {
    if (value === 0) {
      value = 12
    }
    this.setAttribute('hour', value.toString())
  }

  get second() {
    return Number(this.getAttribute('second')) || 0
  }

  set second(value: number) {
    this.setAttribute('second', value.toString())
    this.previousSecond = this.second
  }

  get isDynamic() {
    return this._isDynamic
  }

  set isDynamic(value: boolean) {
    this._isDynamic = value
    if (!value) {
      this.currentAction = undefined
    }
  }

  get minute() {
    return Number(this.getAttribute('minute'))
  }

  set minute(value) {
    this.setAttribute('minute', value.toString())
    this.previousMinute = this.minute
  }
}

export default function handleInteractiveClock() {
  if (customElements.get('interactive-clock') === undefined) {
    customElements.define('interactive-clock', InteractiveClock)
  }
}
