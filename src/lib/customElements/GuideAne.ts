// Importer renderKatex de mathalea
import { renderKatex } from '../mathalea'
import MathaleaCustomElement from './MathaleaCustomElement'

function detectPixelsPerCm() {
  try {
    const testElement = document.createElement('div')
    testElement.style.width = '1cm'
    testElement.style.height = '1px'
    testElement.style.position = 'absolute'
    testElement.style.left = '-9999px'
    testElement.style.visibility = 'hidden'
    document.body.appendChild(testElement)

    const pixelsPerCm = testElement.offsetWidth
    document.body.removeChild(testElement)

    // Vérifier que la valeur est raisonnable
    if (pixelsPerCm > 10 && pixelsPerCm < 200) {
      return pixelsPerCm
    }
  } catch (error) {
    window.notify('Erreur lors de la détection des pixels par cm:', error)
  }

  return 37.8
}

// Ajouter cette fonction utilitaire AVANT la classe GuideAne
function decimalToFraction(decimal: number, maxDenominator = 100) {
  // Cas spéciaux
  if (decimal === 0) return { numerator: 0, denominator: 1 }
  if (decimal === Math.floor(decimal))
    return { numerator: Math.floor(decimal), denominator: 1 }

  let bestNumerator = 1
  let bestDenominator = 1
  let bestError = Math.abs(decimal - 1)

  for (let denominator = 2; denominator <= maxDenominator; denominator++) {
    const numerator = Math.round(decimal * denominator)
    const error = Math.abs(decimal - numerator / denominator)

    if (error < bestError) {
      bestNumerator = numerator
      bestDenominator = denominator
      bestError = error

      // Si on trouve une fraction exacte, on s'arrête
      if (error < 0.001) break
    }
  }

  return { numerator: bestNumerator, denominator: bestDenominator }
}

function formatFraction(decimal: number, showDecimal = true) {
  const fraction = decimalToFraction(decimal)
  const { numerator, denominator } = fraction

  if (denominator === 1) {
    return `${numerator}`
  }

  const fractionStr = `${numerator}/${denominator}`

  if (showDecimal && Math.abs(decimal - numerator / denominator) > 0.001) {
    return `${fractionStr} (≈${decimal.toFixed(3)})`
  }

  return fractionStr
}
export class GuideAne extends MathaleaCustomElement {
  static readonly elementTag = 'guide-ane'

  static create({
    id,
    className,
    width = '800px',
    height = '400px',
    data,
  }: {
    id?: string
    className?: string
    width?: string
    height?: string
    data: Record<string, unknown>
  }): string {
    const attributes: string[] = []
    if (id) attributes.push(`id="${id}"`)
    if (className) attributes.push(`class="${className}"`)
    attributes.push(`style="width: ${width}; height: ${height}"`)
    attributes.push(`data="${JSON.stringify(data).replace(/"/g, '&quot;')}"`)
    return `<guide-ane ${attributes.join(' ')}></guide-ane>`
  }

  n: number // Nombre de parties (calculé selon la position de C)
  p: number // part place du point D sur [AB]
  alpha: number // angle en degrés entre [AB] et [AC]
  A: { x: number; y: number } // Point A
  B: { x: number; y: number } // Point B
  C: { x: number; y: number } // Point C draggable sur la demi-droite
  isDragging: boolean
  dragTarget: string | null
  listenersAdded: boolean = false
  pixelsParCm: number
  svg!: SVGSVGElement
  lengthDisplay!: HTMLDivElement
  target: number | null = null
  targetReached: boolean = false
  onTargetReached: (() => void) | null = null
  targetColor: string | null = null
  printAD: boolean = false // Propriété pour contrôler l'affichage de AD
  printRatio: boolean = false // Propriété pour contrôler l'affichage du rapport
  fractionToDecimalAD: boolean = false // Nouvelle propriété pour l'affichage décimal de AD si possible
  targetFraction: string = '' // Propriété pour stocker la fraction cible
  lengthAB: number = 0 // Stocker la longueur AB en cm
  displayTargetOn: boolean = false

  // propriétés pour la construction
  AC1Length: number = 1 // Longueur AC₁ en cm (fixe)
  rayLength: number = 10 // Longueur de la demi-droite en cm
  private mouseDownHandler?: (e: MouseEvent) => void
  private mouseMoveHandler?: (e: MouseEvent) => void
  private mouseUpHandler?: () => void
  private touchStartHandler?: (e: TouchEvent) => void
  private touchMoveHandler?: (e: TouchEvent) => void
  private touchEndHandler?: () => void

  constructor() {
    super()
    // Valeurs par défaut pour initialiser le guide-âne
    this.n = 1 // Valeur par défaut : AC₁ (1 cm)
    this.alpha = 45
    this.p = 0 // par défaut (Dp confondu avec A)

    // Points A, B et C
    this.A = { x: 100, y: 300 }
    this.pixelsParCm = detectPixelsPerCm()

    // TOUJOURS initialiser B à 1 cm de A (horizontalement)
    this.B = {
      x: this.A.x + 1 * this.pixelsParCm,
      y: this.A.y,
    }

    // Calculer la position initiale de C basée sur n
    this.C = this.calculateInitialC()

    // État de dragging
    this.isDragging = false
    this.dragTarget = null

    this.style.display = 'block'
    this.style.width = '800px'
    this.style.height = '400px'
    this.style.border = '1px solid #ccc'
    this.style.background = '#f9f9f9'
    this.style.position = 'relative'
  }

  // Des méthodes d'accès publiques pour la correction interactive et le feedback
  public getN(): number {
    return this.n
  }

  public getP(): number {
    return this.p
  }

  public getAlpha(): number {
    return this.alpha
  }

  public getValue(): number {
    return this.value
  }

  public getLengthABValue(): number {
    return this.getLengthAB()
  }

  public getTargetValue(): number | null {
    return this.target
  }

  public getTargetFraction(): string {
    return this.targetFraction
  }

  public isTargetReachedValue(): boolean {
    return this.targetReached
  }

  // Méthode pour obtenir les coordonnées des points
  public getPoints(): {
    A: { x: number; y: number }
    B: { x: number; y: number }
    C: { x: number; y: number }
    D: { x: number; y: number }
  } {
    const Dp = this.calculateDpPosition()
    return {
      A: this.A,
      B: this.B,
      C: this.C,
      D: Dp,
    }
  }

  // Méthode pour obtenir un rapport détaillé de l'état du guide-âne
  public getState(): {
    n: number
    p: number
    alpha: number
    lengthAD: number
    lengthAB: number
    ratio: string
    target: number | null
    targetReached: boolean
    targetFraction: string
  } {
    return {
      n: this.n,
      p: this.p,
      alpha: this.alpha,
      lengthAD: this.value,
      lengthAB: this.getLengthAB(),
      ratio: `${this.p}/${this.n}`,
      target: this.target,
      targetReached: this.targetReached,
      targetFraction: this.targetFraction,
    }
  }

  // Méthode pour définir un callback personnalisé si on veut
  public setOnChangeCallback(callback: (state: any) => void) {
    // Ajouter un listener pour les changements
    const originalRedraw = this.redraw.bind(this)
    this.redraw = () => {
      originalRedraw()
      callback(this.getState())
    }
  }

  // Calculer la position initiale de C basée sur n
  calculateInitialC() {
    const angleRad = (this.alpha * Math.PI) / 180
    const ACLength = this.n * this.AC1Length * this.pixelsParCm

    return {
      x: this.A.x + ACLength * Math.cos(angleRad),
      y: this.A.y - ACLength * Math.sin(angleRad), // CORRIGER: utiliser le même signe que dans redraw()
    }
  }

  // Calculer n basé sur la position actuelle de C
  calculateNFromC() {
    const ACLength = Math.sqrt(
      Math.pow(this.C.x - this.A.x, 2) + Math.pow(this.C.y - this.A.y, 2),
    )
    const ACLengthCm = ACLength / this.pixelsParCm
    const newN = Math.max(
      1, // MINIMUM 1 au lieu de 2
      Math.min(10, Math.round(ACLengthCm / this.AC1Length)),
    )

    return newN
  }

  // Contraindre C sur la demi-droite avec aimantation discrète
  constrainCOnRay(x: number, y: number) {
    const angleRad = (this.alpha * Math.PI) / 180
    const direction = {
      x: Math.cos(angleRad),
      y: -Math.sin(angleRad),
    }

    // Projeter le point sur la demi-droite
    const vectorAC = { x: x - this.A.x, y: y - this.A.y }
    const projection = vectorAC.x * direction.x + vectorAC.y * direction.y

    // Convertir la projection en longueur en cm
    const projectionCm = projection / this.pixelsParCm

    // Aimanter au centimètre entier (donc à n entier)
    const nCandidate = Math.max(
      1,
      Math.min(10, Math.round(projectionCm / this.AC1Length)),
    )

    // Recalculer la position exacte pour ce n
    const snappedLength = nCandidate * this.AC1Length * this.pixelsParCm

    return {
      x: this.A.x + snappedLength * direction.x,
      y: this.A.y + snappedLength * direction.y,
    }
  }

  // méthode pour calculer la position du point Dp
  calculateDpPosition() {
    const A = this.A
    const B = this.B
    const t = this.p / this.n

    return {
      x: A.x + t * (B.x - A.x),
      y: A.y + t * (B.y - A.y),
    }
  }

  // méthode pour contraindre Dp sur le segment AB
  constrainDpOnSegment(x: number, y: number) {
    const A = this.A
    const B = this.B

    // Projeter le point sur la ligne AB
    const AB = { x: B.x - A.x, y: B.y - A.y }
    const AP = { x: x - A.x, y: y - A.y }

    // Produit scalaire pour la projection
    const ABLength = Math.sqrt(AB.x * AB.x + AB.y * AB.y)
    const projection = (AP.x * AB.x + AP.y * AB.y) / (ABLength * ABLength)

    // Limiter la projection entre 0 et (n-1)/n pour éviter la superposition avec B
    const maxT = (this.n - 1) / this.n
    const clampedT = Math.max(0, Math.min(maxT, projection))

    // Aimanter à des positions discrètes (entiers de 0 à n-1)
    const discreteP = Math.round(clampedT * this.n)
    const snappedT = discreteP / this.n

    return {
      x: A.x + snappedT * AB.x,
      y: A.y + snappedT * AB.y,
      p: discreteP, // Retourner aussi la nouvelle valeur de p
    }
  }

  // Méthode principale pour redessiner le guide-âne à chaque changement
  redraw() {
    // Vider le SVG
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild)
    }

    this.n = this.calculateNFromC()

    if (this.p >= this.n) {
      this.p = Math.max(0, this.n - 1)
    }

    const A = this.A
    const B = this.B
    const C = this.C

    const angleRad = (this.alpha * Math.PI) / 180

    // Point final de la demi-droite (longueur maximale)
    const rayEndLength = this.rayLength * this.pixelsParCm
    const rayEnd = {
      x: A.x + rayEndLength * Math.cos(angleRad),
      y: A.y - rayEndLength * Math.sin(angleRad),
    }

    // le segment AB (base)
    const lineAB = this.createLine(A.x, A.y, B.x, B.y, '#000', 3)
    this.svg.appendChild(lineAB)

    // la demi-droite AC (jusqu'au point final)
    const lineAC = this.createLine(A.x, A.y, rayEnd.x, rayEnd.y, '#666', 1)
    lineAC.setAttribute('stroke-dasharray', '5,5')
    this.svg.appendChild(lineAC)

    // les points de division sur AC
    const pointsC = []
    for (let i = 0; i <= this.n; i++) {
      const lengthCm = i * this.AC1Length
      const lengthPixels = lengthCm * this.pixelsParCm
      pointsC.push({
        x: A.x + lengthPixels * Math.cos(angleRad),
        y: A.y - lengthPixels * Math.sin(angleRad),
      })
    }

    // la ligne de référence depuis Cn vers B
    const referenceLine = this.createLine(
      pointsC[this.n].x,
      pointsC[this.n].y,
      B.x,
      B.y,
      '#2196F3',
      2,
    )
    this.svg.appendChild(referenceLine)

    // les points de division sur AB et tracer les parallèles
    const pointsD = []
    for (let i = 0; i <= this.n; i++) {
      const t = i / this.n
      const pointD = {
        x: A.x + t * (B.x - A.x),
        y: A.y + t * (B.y - A.y),
      }
      pointsD.push(pointD)

      // Tracer les lignes depuis Ci vers Di (parallèles à CnB)
      if (i > 0 && i < this.n) {
        const line = this.createLine(
          pointsC[i].x,
          pointsC[i].y,
          pointD.x,
          pointD.y,
          '#999',
          i === this.p ? 2 : 1,
        )

        // Ajouter des pointillés pour toutes les lignes sauf celle de p
        if (i !== this.p) {
          line.setAttribute('stroke-dasharray', '5,3')
        }

        this.svg.appendChild(line)
      }
    }

    // Marquer les points avec des arcs de compas
    const acAngle = (Math.atan2(rayEnd.y - A.y, rayEnd.x - A.x) * 180) / Math.PI
    const arcLength = 20

    pointsC.forEach((point, i) => {
      if (i > 0) {
        const distance = Math.sqrt((point.x - A.x) ** 2 + (point.y - A.y) ** 2)
        const angleRadians = arcLength / distance
        const angleDegrees = (angleRadians * 180) / Math.PI

        this.createArc(
          A.x,
          A.y,
          distance,
          acAngle - angleDegrees,
          acAngle + angleDegrees,
          i === this.n ? '#4CAF50' : '#999',
          i === this.n ? 2 : 1,
          `Arc de compas C${i}`,
        )
      }
    })

    // Mettre en évidence le segment ADp et marquer le point Dp
    if (this.p > 0 && this.p <= this.n) {
      const segmentColor = this.targetColor || '#F44336'
      const highlightLine = this.createLine(
        A.x,
        A.y,
        pointsD[this.p].x,
        pointsD[this.p].y,
        segmentColor,
        4,
      )
      this.svg.appendChild(highlightLine)

      // Marquer le point Dp avec un segment perpendiculaire
      const pointDp = pointsD[this.p]
      const segmentLength = 8

      const abVector = { x: B.x - A.x, y: B.y - A.y }
      const abLength = Math.sqrt(abVector.x ** 2 + abVector.y ** 2)
      const perpVector = {
        x: -abVector.y / abLength,
        y: abVector.x / abLength,
      }

      const startPoint = {
        x: pointDp.x + perpVector.x * segmentLength,
        y: pointDp.y + perpVector.y * segmentLength,
      }
      const endPoint = {
        x: pointDp.x - perpVector.x * segmentLength,
        y: pointDp.y - perpVector.y * segmentLength,
      }

      const perpLine = this.createLine(
        startPoint.x,
        startPoint.y,
        endPoint.x,
        endPoint.y,
        '#F44336',
        2,
      )
      this.svg.appendChild(perpLine)
    } else if (this.p === 0) {
      // Cas spécial pour p = 0 : marquer le point A avec un petit cercle rouge
      const markerCircle = this.createCircle(
        A.x,
        A.y,
        6,
        'none',
        'Point D0 (A)',
      )
      markerCircle.setAttribute('stroke', '#F44336')
      markerCircle.setAttribute('stroke-width', '2')
      markerCircle.setAttribute('fill', 'none')
      this.svg.appendChild(markerCircle)
    }

    // Ajouter un segment perpendiculaire rouge fixe au point A
    const segmentLength = 8
    const abVector = { x: B.x - A.x, y: B.y - A.y }
    const abLength = Math.sqrt(abVector.x ** 2 + abVector.y ** 2)
    const perpVector = {
      x: -abVector.y / abLength,
      y: abVector.x / abLength,
    }

    const aStartPoint = {
      x: A.x + perpVector.x * segmentLength,
      y: A.y + perpVector.y * segmentLength,
    }
    const aEndPoint = {
      x: A.x - perpVector.x * segmentLength,
      y: A.y - perpVector.y * segmentLength,
    }

    const aPerpLine = this.createLine(
      aStartPoint.x,
      aStartPoint.y,
      aEndPoint.x,
      aEndPoint.y,
      '#F44336',
      2,
    )
    this.svg.appendChild(aPerpLine)

    // Ajouter des labels
    this.createText(A.x - 10, A.y + 20, 'A', '#000', '16px', 'middle')
    this.createText(B.x + 10, B.y + 20, 'B', '#000', '16px', 'middle')
    this.createText(C.x, C.y - 10, 'C', '#000', '16px', 'middle')

    if (this.n === 1) {
      this.createText(
        C.x + 30,
        C.y - 30,
        'Déplacer le point C Pour diviser [AB], puis...',
        '#000',
        '16px',
        'start',
      )
    }

    if (this.getLengthAB() === 1) {
      this.createText(
        B.x + 20,
        B.y - 20,
        'Déplacer le point B pour ajuster la longueur AB',
        ' #000',
        '16px',
        'start',
      )
    }
    // Ajouter le label D sous le point Dp
    if (this.p > 0) {
      const pointDp = pointsD[this.p]
      this.createText(
        pointDp.x,
        pointDp.y + 25,
        'D',
        '#F44336',
        '16px',
        'middle',
      )
    }

    // Affichage conditionnel du rapport
    if (this.printRatio) {
      if (this.p > 0) {
        const ratio = `${this.p}/${this.n}`
        this.createText(
          (A.x + B.x) / 2,
          A.y + 35,
          `AD/AB = ${ratio}`,
          '#F44336',
          '14px',
          'middle',
        )
      }
    }
    if (this.p === 0 && this.n > 1) {
      this.createText(
        A.x + 20,
        A.y + 35,
        `Déplacer le cercle rouge pour créer le point D`,
        '#000',
        '16px',
        'start',
      )
    }
    // Créer les points draggables A, B, C et Dp
    this.createDraggablePoints(A, B, C, pointsD[this.p])

    // Vérifier la target à la fin
    this.checkTargetReached()

    // Mettre à jour l'affichage
    this.updateLengthDisplay()
  }

  // Méthodes utilitaires pour créer des éléments SVG
  createLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string,
    strokeWidth: number,
  ) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', x1.toString())
    line.setAttribute('y1', y1.toString())
    line.setAttribute('x2', x2.toString())
    line.setAttribute('y2', y2.toString())
    line.setAttribute('stroke', stroke)
    line.setAttribute('stroke-width', strokeWidth.toString())
    return line
  }

  createCircle(cx: number, cy: number, r: number, fill: string, title: string) {
    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle',
    )
    circle.setAttribute('cx', cx.toString())
    circle.setAttribute('cy', cy.toString())
    circle.setAttribute('r', r.toString())
    circle.setAttribute('fill', fill)
    circle.setAttribute('stroke', '#000')
    circle.setAttribute('stroke-width', '1')

    // Ajouter un titre pour l'accessibilité
    const titleElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'title',
    )
    titleElement.textContent = title
    circle.appendChild(titleElement)

    return circle
  }

  // Modifier pour créer une zone de drag même quand p = 0
  createDraggablePoints(
    A: { x: number; y: number },
    B: { x: number; y: number },
    C: { x: number; y: number },
    Dp: { x: number; y: number },
  ) {
    // Point A (non draggable, juste un marqueur)
    const aCircle = this.createCircle(A.x, A.y, 2, '#007bff', 'Point A')
    this.svg.appendChild(aCircle)

    // Point B (contraint horizontalement)
    const bCircle = this.createCircle(B.x, B.y, 3, '#28a745', 'Point B')
    bCircle.setAttribute('data-draggable', 'B')
    bCircle.style.cursor = 'ew-resize'
    this.svg.appendChild(bCircle)

    // Point C (contraint sur la demi-droite)
    const cCircle = this.createCircle(C.x, C.y, 4, '#ff6b35', 'Point C')
    cCircle.setAttribute('data-draggable', 'C')
    cCircle.style.cursor = 'ew-resize'
    this.svg.appendChild(cCircle)

    // Point Dp : toujours créer une zone de drag, même si p = 0
    const dpZone = this.createCircle(
      Dp.x,
      Dp.y,
      this.p === 0 ? 15 : 10, // Zone plus grande si p = 0 pour compenser l'absence de segment
      'transparent',
      `Point D${this.p}`,
    )
    dpZone.setAttribute('data-draggable', 'Dp')
    dpZone.style.cursor = 'ew-resize'
    dpZone.setAttribute('stroke', 'none')
    dpZone.setAttribute('fill-opacity', '0')
    this.svg.appendChild(dpZone)
  }

  createText(
    x: number,
    y: number,
    text: string,
    color: string,
    fontSize: string,
    anchor: 'start' | 'middle' | 'end' = 'middle',
  ) {
    const textElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text',
    )
    textElement.setAttribute('x', x.toString())
    textElement.setAttribute('y', y.toString())
    textElement.setAttribute('fill', color)
    textElement.setAttribute('font-size', fontSize)
    textElement.setAttribute('font-family', 'Arial, sans-serif')
    // Ancrage configurable
    textElement.setAttribute('text-anchor', anchor)
    textElement.setAttribute('dominant-baseline', 'middle')
    textElement.textContent = text
    this.svg.appendChild(textElement)
    return textElement
  }

  createArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    color: string,
    width: number,
    title: string,
  ) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

    // Convertir les angles en radians
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    // Calculer les points de début et fin de l'arc
    const startX = cx + r * Math.cos(startRad)
    const startY = cy + r * Math.sin(startRad)
    const endX = cx + r * Math.cos(endRad)
    const endY = cy + r * Math.sin(endRad)

    // Créer le chemin SVG pour l'arc
    const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
    const pathData = `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`

    path.setAttribute('d', pathData)
    path.setAttribute('stroke', color)
    path.setAttribute('stroke-width', width.toString())
    path.setAttribute('fill', 'none')
    if (title) path.setAttribute('title', title)

    this.svg.appendChild(path)
    return path
  }

  // Mettre à jour la propriété value pour retourner la longueur ACp
  get value() {
    if (this.p === 0) {
      return 0 // AD0 = 0
    }

    const A = this.A
    const B = this.B

    const ABx = B.x - A.x
    const ABy = B.y - A.y
    const ABLength = Math.sqrt(ABx * ABx + ABy * ABy)

    const lengthCm = (this.p / this.n) * (ABLength / this.pixelsParCm)
    return parseFloat(lengthCm.toFixed(3))
  }

  // Calculer la longueur AB en cm
  getLengthAB() {
    const A = this.A
    const B = this.B
    const lengthPixels = Math.sqrt((B.x - A.x) ** 2 + (B.y - A.y) ** 2)
    const lengthCm = lengthPixels / this.pixelsParCm
    return parseFloat(lengthCm.toFixed(2))
  }

  // Ajouter cette méthode qui manquait
  createSVG() {
    // Créer le SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.svg.setAttribute('width', '800')
    this.svg.setAttribute('height', '400')
    this.svg.setAttribute('viewBox', '0 0 800 400')
    this.svg.style.width = '100%'
    this.svg.style.height = '100%'

    this.appendChild(this.svg)
  }

  connectedCallback() {
    // Récupérer les paramètres depuis l'attribut data
    this.parseDataAttributes()

    this.createSVG()
    this.createLengthDisplay()
    // Plus besoin d'initEventListeners() car plus d'inputs externes
    this.setupDragListeners()
    this.redraw()
  }

  disconnectedCallback() {
    // Supprimer tous les listeners pour éviter les fuites mémoire
    this.removeEventListeners()
  }

  // Nouvelle méthode pour parser les attributs data
  parseDataAttributes() {
    try {
      const dataAttr = this.getAttribute('data')
      if (dataAttr) {
        const data = JSON.parse(dataAttr)

        // D'abord définir alpha (nécessaire pour calculer C)
        if (
          typeof data.alpha === 'number' &&
          data.alpha >= 10 &&
          data.alpha <= 80
        ) {
          this.alpha = data.alpha
        }

        // Ensuite définir A si fourni, sinon garder la valeur par défaut
        if (
          data.A &&
          typeof data.A.x === 'number' &&
          typeof data.A.y === 'number'
        ) {
          this.A = { x: data.A.x, y: data.A.y }
        }

        // MODIFIER : Changer 10 en 1 pour correspondre au constructeur
        // FORCER AB = 1 cm peu importe les données passées
        this.B = {
          x: this.A.x + 1 * this.pixelsParCm,
          y: this.A.y,
        }

        // Puis définir n et recalculer C
        if (typeof data.n === 'number' && data.n >= 1 && data.n <= 10) {
          this.n = data.n
        }

        // IMPORTANT : Recalculer C après avoir défini A et alpha
        this.C = this.calculateInitialC()

        // MODIFIER pour supporter p = 0
        if (typeof data.p === 'number' && data.p >= 0 && data.p < this.n) {
          // p peut être 0, mais doit être < n
          this.p = data.p
        } else if (typeof data.p === 'number') {
          this.p = Math.max(0, Math.min(this.n - 1, data.p)) // Limiter entre 0 et n-1
        }

        // SUPPRIMER : Ne plus utiliser lengthAB pour fixer la longueur
        // L'élève devra ajuster manuellement la position de B
        if (typeof data.lengthAB === 'number' && data.lengthAB > 0) {
          // Stocker la longueur cible pour l'affichage, mais ne pas l'appliquer
          this.lengthAB = data.lengthAB
        }

        // Fraction cible (targetFraction)
        if (typeof data.targetFraction === 'string') {
          this.targetFraction = data.targetFraction
        }

        // SUPPRIMER : Plus d'option snapToCentimeter car l'aimantation est systématique

        // Option printAD
        if (typeof data.printAD === 'boolean') {
          this.printAD = data.printAD
        }

        // Option printRatio
        if (typeof data.printRatio === 'boolean') {
          this.printRatio = data.printRatio
        }

        // Nouvelle option fractionToDecimalAD
        if (typeof data.fractionToDecimalAD === 'boolean') {
          this.fractionToDecimalAD = data.fractionToDecimalAD
        }

        // Option displayTargetOn
        if (typeof data.displayTargetOn === 'boolean') {
          this.displayTargetOn = data.displayTargetOn
        }

        // Nouveau : target
        if (typeof data.target === 'number' && data.target > 0) {
          this.target = data.target
        }

        if (data.id) {
          this.id = data.id
        }

        // Callback optionnel pour quand la target est atteinte
        if (typeof data.onTargetReached === 'string') {
          const callbackName = data.onTargetReached
          if (
            window[callbackName] &&
            typeof window[callbackName] === 'function'
          ) {
            this.onTargetReached = window[callbackName]
          }
        }
      }
    } catch (error) {
      window.notify('Erreur lors du parsing des attributs data:', error)
    }
  }

  // SUPPRIMER cette méthode car on ne veut plus fixer automatiquement AB
  // setInitialABLength(targetLengthCm: number) {
  //   // Méthode supprimée - l'élève doit ajuster manuellement
  // }

  // Modifier initEventListeners pour ne pas dépendre des éléments de contrôle externes
  setupDragListeners() {
    // Vérifier si les listeners sont déjà ajoutés
    if (this.listenersAdded) return

    // Créer les handlers en tant que propriétés pour pouvoir les supprimer
    this.mouseDownHandler = (e) => this.onMouseDown(e)
    this.mouseMoveHandler = (e) => this.onMouseMove(e)
    this.mouseUpHandler = () => this.onMouseUp()
    this.touchStartHandler = (e) => this.onTouchStart(e)
    this.touchMoveHandler = (e) => this.onTouchMove(e)
    this.touchEndHandler = () => this.onTouchEnd()

    // Mouse events
    this.svg.addEventListener('mousedown', this.mouseDownHandler)
    this.svg.addEventListener('mousemove', this.mouseMoveHandler)
    window.addEventListener('mouseup', this.mouseUpHandler)

    // Touch events
    this.svg.addEventListener('touchstart', this.touchStartHandler, {
      passive: false,
    })
    this.svg.addEventListener('touchmove', this.touchMoveHandler, {
      passive: false,
    })
    window.addEventListener('touchend', this.touchEndHandler)

    this.listenersAdded = true
  }

  // Nouvelle méthode pour supprimer tous les listeners
  private removeEventListeners() {
    if (!this.listenersAdded || !this.svg) return

    try {
      // Supprimer les mouse events
      if (this.mouseDownHandler) {
        this.svg.removeEventListener('mousedown', this.mouseDownHandler)
      }
      if (this.mouseMoveHandler) {
        this.svg.removeEventListener('mousemove', this.mouseMoveHandler)
      }
      if (this.mouseUpHandler) {
        window.removeEventListener('mouseup', this.mouseUpHandler)
      }

      // Supprimer les touch events
      if (this.touchStartHandler) {
        this.svg.removeEventListener('touchstart', this.touchStartHandler)
      }
      if (this.touchMoveHandler) {
        this.svg.removeEventListener('touchmove', this.touchMoveHandler)
      }
      if (this.touchEndHandler) {
        window.removeEventListener('touchend', this.touchEndHandler)
      }

      // Réinitialiser les références
      this.mouseDownHandler = undefined
      this.mouseMoveHandler = undefined
      this.mouseUpHandler = undefined
      this.touchStartHandler = undefined
      this.touchMoveHandler = undefined
      this.touchEndHandler = undefined

      this.listenersAdded = false
    } catch (error) {
      console.warn('Erreur lors de la suppression des listeners:', error)
    }
  }

  onMouseDown(e: MouseEvent) {
    const target = e.target as SVGElement
    const draggable = target.getAttribute('data-draggable')

    if (draggable) {
      this.isDragging = true
      this.dragTarget = draggable
      e.preventDefault()
      // Appliquer le curseur double-flèche pour tous les points draggables
      target.style.cursor = 'ew-resize'
    }
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.dragTarget) return

    const pt = this.screenToSVG(e.clientX, e.clientY)

    if (this.dragTarget === 'B') {
      let x = pt.x
      const y = this.A.y // même ordonnée que A

      // Aimantation systématique au centimètre: deltaX = k * pixelsParCm
      const deltaX = x - this.A.x
      const k = Math.round(deltaX / this.pixelsParCm)
      x = this.A.x + k * this.pixelsParCm

      this.updatePointPosition(x, y)
    } else if (this.dragTarget === 'C') {
      const constrainedC = this.constrainCOnRay(pt.x, pt.y)
      this.updatePointPosition(constrainedC.x, constrainedC.y)
    } else if (this.dragTarget === 'Dp') {
      const constrainedDp = this.constrainDpOnSegment(pt.x, pt.y)
      this.p = constrainedDp.p
      this.updatePointPosition(constrainedDp.x, constrainedDp.y)
    }
  }

  onMouseUp() {
    if (this.isDragging && this.dragTarget) {
      // Restaurer le curseur pour tous les points draggables
      const circles = this.svg.querySelectorAll('[data-draggable]')
      circles.forEach((circle) => {
        ;(circle as HTMLElement).style.cursor = 'ew-resize'
      })
    }

    this.isDragging = false
    this.dragTarget = null
  }

  onTouchStart(e: TouchEvent) {
    e.preventDefault()
    // const touch = e.touches[0]
    const target = e.target as SVGElement
    const draggable = target.getAttribute('data-draggable')

    if (draggable) {
      this.isDragging = true
      this.dragTarget = draggable
    }
  }

  onTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (!this.isDragging || !this.dragTarget) return

    const touch = e.touches[0]
    const pt = this.screenToSVG(touch.clientX, touch.clientY)

    if (this.dragTarget === 'B') {
      let x = pt.x
      const y = this.A.y

      // Aimantation systématique au centimètre
      const deltaX = x - this.A.x
      const k = Math.round(deltaX / this.pixelsParCm)
      x = this.A.x + k * this.pixelsParCm

      this.updatePointPosition(x, y)
    } else if (this.dragTarget === 'C') {
      const constrainedC = this.constrainCOnRay(pt.x, pt.y)
      this.updatePointPosition(constrainedC.x, constrainedC.y)
    } else if (this.dragTarget === 'Dp') {
      const constrainedDp = this.constrainDpOnSegment(pt.x, pt.y)
      this.p = constrainedDp.p
      this.updatePointPosition(constrainedDp.x, constrainedDp.y)
    }
  }

  onTouchEnd() {
    this.isDragging = false
    this.dragTarget = null
  }

  // Ajouter cette méthode manquante pour convertir les coordonnées écran en coordonnées SVG
  screenToSVG(clientX: number, clientY: number) {
    const rect = this.svg.getBoundingClientRect()
    const scaleX = this.svg.viewBox.baseVal.width / rect.width
    const scaleY = this.svg.viewBox.baseVal.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  updatePointPosition(x: number, y: number) {
    if (this.dragTarget === 'B') {
      this.B.x = Math.max(0, Math.min(800, x))
      this.B.y = Math.max(0, Math.min(400, y))
    } else if (this.dragTarget === 'C') {
      const constrained = this.constrainCOnRay(x, y)
      this.C.x = constrained.x
      this.C.y = constrained.y
    }
    this.redraw()
  }

  // Nouvelle méthode privée pour vérifier la target
  private checkTargetReached() {
    if (this.target === null) return

    const currentValue = this.value
    const threshold = 0.02 // Seuil de tolérance en cm

    const wasReached = this.targetReached
    this.targetReached = Math.abs(currentValue - this.target) <= threshold

    // Si la target vient d'être atteinte (pas déjà atteinte avant)
    if (this.targetReached && !wasReached) {
      // Déclencher le callback si défini
      if (this.onTargetReached) {
        this.onTargetReached()
      }

      // Optionnel : déclencher un événement custom
      this.dispatchEvent(
        new CustomEvent('targetReached', {
          detail: {
            currentValue,
            target: this.target,
            difference: Math.abs(currentValue - this.target),
          },
        }),
      )
    }
  }

  // Méthode publique pour définir une nouvelle target
  setTarget(newTarget: number | null) {
    this.target = newTarget
    this.targetReached = false
    this.redraw()
  }

  // Méthode publique pour obtenir l'état de la target
  isTargetReached(): boolean {
    return this.targetReached
  }

  // Ajouter cette méthode pour créer l'affichage de longueur
  createLengthDisplay() {
    this.lengthDisplay = document.createElement('div')
    this.lengthDisplay.style.position = 'absolute'
    this.lengthDisplay.style.top = '10px'
    this.lengthDisplay.style.left = '10px'
    this.lengthDisplay.style.background = 'rgba(255, 255, 255, 0.9)'
    this.lengthDisplay.style.padding = '8px'
    this.lengthDisplay.style.borderRadius = '4px'
    this.lengthDisplay.style.fontSize = '14px'
    this.lengthDisplay.style.fontFamily = 'monospace'
    this.lengthDisplay.style.border = '1px solid #ccc'
    this.appendChild(this.lengthDisplay)
  }

  // Nouvelle méthode pour formater la valeur AD selon les paramètres
  formatADValue(lengthCm: number): string {
    if (this.p === 0) {
      return 'AD = 0 cm (A et D confondus)'
    }

    if (this.fractionToDecimalAD) {
      const currentAB = Math.round(this.getLengthAB())
      const theoreticalValue = (this.p * currentAB) / this.n

      // Vérifier si la valeur théorique est "décimale" (à 0.01 près)
      const roundedValue = Math.round(theoreticalValue * 100) / 100
      const isDecimal = Math.abs(theoreticalValue - roundedValue) < 0.001

      if (isDecimal) {
        // Affichage décimal avec virgule française pour LaTeX
        const decimalStr = Number.isInteger(roundedValue)
          ? roundedValue.toString()
          : roundedValue.toString().replace('.', ',')
        return `AD = $${decimalStr}$ cm`
      } else {
        return `AD = $\\dfrac{${this.p * currentAB}}{${this.n}}$ cm`
      }
    } else {
      // Comportement par défaut : affichage fractionnaire simplifié
      return `AD = ${formatFraction(lengthCm)} cm`
    }
  }

  updateLengthDisplay() {
    const lengthCm = this.value
    const lengthAB = this.getLengthAB()

    let targetDisplay = ''
    if (this.displayTargetOn) {
      if (this.target !== null) {
        const difference = Math.abs(lengthCm - this.target)
        const status = this.targetReached ? '✅' : '❌'

        // Créer un élément temporaire pour rendre le LaTeX
        const tempDiv = document.createElement('div')
        // Utiliser this.lengthAB (longueur cible) dans l'affichage LaTeX
        const targetAB = this.lengthAB || lengthAB
        tempDiv.innerHTML = `AD: $${this.targetFraction}\\times ${targetAB}\\text{ cm}$`

        // Rendre le LaTeX avec la fonction renderKatex de mathalea
        try {
          renderKatex(tempDiv)
          const renderedContent = tempDiv.innerHTML

          targetDisplay = `
          <div style="font-size: 12px; color: ${this.targetReached ? 'green' : 'red'};">
            ${renderedContent} ${status}
            ${!this.targetReached ? `(écart: ${difference.toFixed(3)} cm)` : ''}
          </div>
        `
        } catch (error) {
          window.notify('Erreur lors du rendu KaTeX:', error)
          // Fallback: affichage sans rendu LaTeX
          targetDisplay = `
          <div style="font-size: 12px; color: ${this.targetReached ? 'green' : 'red'};">
            AD: ${this.targetFraction} × ${targetAB} cm ${status}
            ${!this.targetReached ? `(écart: ${difference.toFixed(3)} cm)` : ''}
          </div>
        `
        }
      }
    }

    // Affichage conditionnel de la longueur AD avec le nouveau formatage
    let displayText = ''
    if (this.printAD) {
      displayText = this.formatADValue(lengthCm)
    }

    this.lengthDisplay.innerHTML = `
      ${this.printAD ? `<div>${displayText}</div>` : ''}
      <div style="font-size: 12px; color: #666;">AB = ${formatFraction(lengthAB)} cm</div>
      ${targetDisplay}
    `

    // Rendre le LaTeX dans l'élément final si nécessaire
    try {
      renderKatex(this.lengthDisplay)
    } catch (error) {
      window.notify('Erreur lors du rendu KaTeX final:', error)
    }
  }
}
customElements.define('guide-ane', GuideAne)

/**
 * Fonction utilitaire pour créer facilement un guide-âne dans les exercices Mathalea
 * @param options - Options de configuration du guide-âne
 * @returns Le code HTML de la balise <guide-âne>
 */
export function addGuideAne(
  options: {
    alpha?: number // Angle en degrés (défaut: 45)
    targetAB?: number // Longueur AB cible en cm (pour affichage seulement)
    targetValue?: number // Valeur cible pour ADp en cm (optionnel)
    A?: { x: number; y: number } // Position du point A (optionnel)
    width?: string // Largeur du composant (défaut: "800px")
    height?: string // Hauteur du composant (défaut: "400px")
    id?: string // ID unique pour le composant (optionnel)
    className?: string // Classes CSS additionnelles (optionnel)
    printAD?: boolean // Afficher la longueur AD (défaut: false)
    printRatio?: boolean // Afficher le rapport (défaut: false)
    fractionToDecimalAD?: boolean // Afficher AD en décimal si possible (défaut: false)
    targetFraction?: string // Fraction cible (optionnel)
    displayTargetOn?: boolean // Afficher l'état de la target (défaut: false)
  } = {},
): string {
  // Valeurs par défaut
  const config = {
    n: 1,
    p: 0,
    alpha: options.alpha ?? 45,
    targetAB: options.targetAB, // Renommer lengthAB en targetAB
    A: options.A,
    // SUPPRIMER B car il sera toujours calculé à 10 cm de A
    width: options.width ?? '800px',
    height: options.height ?? '400px',
    id: options.id,
    className: options.className,
    targetValue: options.targetValue ?? null,
    printAD: options.printAD ?? false,
    printRatio: options.printRatio ?? false,
    fractionToDecimalAD: options.fractionToDecimalAD ?? false,
    targetFraction: options.targetFraction ?? '0/1',
    displayTargetOn: options.displayTargetOn ?? false,
  }

  // Construire l'objet data pour passer au composant
  const data: any = {
    n: config.n,
    p: config.p,
    alpha: config.alpha,
    printAD: config.printAD,
    printRatio: config.printRatio,
    fractionToDecimalAD: config.fractionToDecimalAD,
  }

  // Ajouter les paramètres optionnels s'ils sont définis
  if (config.targetAB !== undefined) {
    data.lengthAB = config.targetAB // Stocker comme cible pour l'affichage
  }

  if (config.A) {
    data.A = config.A
  }

  // SUPPRIMER : Ne plus passer B dans les données car il sera toujours à 10 cm

  if (config.targetValue !== null) {
    data.target = config.targetValue
  }

  if (config.targetFraction) {
    data.targetFraction = config.targetFraction
  }

  if (config.displayTargetOn) {
    data.displayTargetOn = config.displayTargetOn
  }

  return GuideAne.create({
    id: config.id,
    className: config.className,
    width: config.width,
    height: config.height,
    data,
  })
}

/**
 * Objet contenant des raccourcis pour créer des guide-ânes avec des configurations courantes
 */
export const GuideAnePresets = {
  /**
   * Guide-âne basique avec paramètres essentiels
   */
  basic: (alpha: number = 45) => addGuideAne({ alpha }),

  /**
   * Guide-âne avec longueur AB cible (l'élève doit ajuster manuellement)
   */
  withTargetLength: (targetAB: number, alpha: number = 45) =>
    addGuideAne({ alpha, targetAB }),

  /**
   * Guide-âne avec position personnalisée du point A
   */
  withPosition: (A: { x: number; y: number }, alpha: number = 45) =>
    addGuideAne({ alpha, A }),

  /**
   * Guide-âne compact (plus petit)
   */
  compact: (alpha: number = 45) =>
    addGuideAne({ alpha, width: '600px', height: '300px' }),

  /**
   * Guide-âne avec ID et classe pour styling personnalisé
   */
  styled: (id: string, className: string = '', alpha: number = 45) =>
    addGuideAne({ alpha, id, className }),

  /**
   * Guide-âne pour exercice aléatoire
   */
  random: (alphaChoices: number[] = [30, 45, 60]) => {
    const alpha = alphaChoices[Math.floor(Math.random() * alphaChoices.length)]
    return addGuideAne({ alpha })
  },
}
