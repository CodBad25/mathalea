import jspreadsheet from 'jspreadsheet-ce'
import 'jspreadsheet-ce/src/jspreadsheet.css'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

type SpreadsheetStyle = Record<string, string>

type SpreadsheetLike = {
  getValueFromCoords: (
    column: number,
    row: number,
    processed: boolean,
  ) => unknown
  setValueFromCoords: (
    column: number,
    row: number,
    value: string | number,
    force: boolean,
  ) => void
  getData: () => (string | number)[][]
  setData: (data: unknown[]) => void
  setStyle: (style: SpreadsheetStyle) => void
  setReadOnly: (cellRef: string, value: boolean) => void
  showRow: (rowIndex: number) => void
  hideRow: (rowIndex: number) => void
  showColumn: (colIndex: number) => void
  hideColumn: (colIndex: number) => void
  minDimensions?: [number, number]
  style?: Record<string, unknown>
  columns?: unknown[]
}

export class MySpreadsheetElement extends MathaleaCustomElement {
  static readonly elementTag = 'my-spreadsheet'

  static formatStudentAnswer(rawAnswer: string, questionHtml?: string): string {
    const studentData = this.parse2DArray(rawAnswer)
    if (studentData == null) return rawAnswer

    const initialData = this.extractInitialDataFromQuestionHtml(questionHtml)
    const changes = this.extractChangedCells(initialData, studentData)
    if (changes.length === 0) return 'aucune'

    return changes
      .map(({ cellRef, value }) => `${cellRef}: ${this.formatCellValue(value)}`)
      .join('<br>')
  }

  private static extractInitialDataFromQuestionHtml(
    questionHtml?: string,
  ): unknown[][] {
    if (typeof questionHtml !== 'string') return []
    const tagMatch = questionHtml.match(/<my-spreadsheet\b[^>]*>/i)
    if (!tagMatch) return []
    const dataAttrMatch = tagMatch[0].match(/\sdata="([^"]*)"/i)
    if (!dataAttrMatch) return []

    const dataAttr = this.decodeHtmlEntities(dataAttrMatch[1])
    const parsed = this.parse2DArray(dataAttr)
    return parsed ?? []
  }

  private static parse2DArray(rawValue: string): unknown[][] | null {
    try {
      const parsed: unknown = JSON.parse(rawValue)
      if (!Array.isArray(parsed)) return null
      return parsed.map((row) => (Array.isArray(row) ? row : []))
    } catch {
      return null
    }
  }

  private static extractChangedCells(
    initialData: unknown[][],
    studentData: unknown[][],
  ): Array<{ cellRef: string; value: unknown }> {
    const maxRows = Math.max(initialData.length, studentData.length)
    const changes: Array<{ cellRef: string; value: unknown }> = []

    for (let row = 0; row < maxRows; row++) {
      const initialRow = initialData[row] ?? []
      const studentRow = studentData[row] ?? []
      const maxCols = Math.max(initialRow.length, studentRow.length)
      for (let col = 0; col < maxCols; col++) {
        const initialValue = initialRow[col]
        const studentValue = studentRow[col]
        const normalizedInitial = this.normalizeCellValue(initialValue)
        const normalizedStudent = this.normalizeCellValue(studentValue)

        // Dans CAN, on veut surtout lister ce que l'élève a effectivement saisi.
        if (normalizedStudent === '') continue
        if (normalizedStudent === normalizedInitial) continue

        changes.push({
          cellRef: `${this.columnIndexToLetters(col)}${row + 1}`,
          value: studentValue,
        })
      }
    }

    return changes
  }

  private static normalizeCellValue(value: unknown): string {
    if (value == null) return ''
    return String(value).trim()
  }

  private static formatCellValue(value: unknown): string {
    if (typeof value === 'number') return `${value}`
    return JSON.stringify(String(value ?? ''))
  }

  private static columnIndexToLetters(index: number): string {
    let n = index + 1
    let letters = ''
    while (n > 0) {
      const rem = (n - 1) % 26
      letters = String.fromCharCode(65 + rem) + letters
      n = Math.floor((n - 1) / 26)
    }
    return letters
  }

  private static decodeHtmlEntities(value: string): string {
    return value
      .replaceAll('&quot;', '"')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
  }

  private static toCellRef(colIndex: number, rowIndex: number): string {
    return `${this.columnIndexToLetters(colIndex)}${rowIndex + 1}`
  }

  static create({
    id,
    data = [],
    minDimensions = [5, 5],
    style,
    columns = [],
    interactif = false,
    showVerifyButton,
    nbLignesCachees,
    nbColonnesCachees,
    readOnlyCells,
  }: {
    id?: string
    data?: (string | number)[][]
    minDimensions?: [number, number]
    style?: unknown
    columns?: unknown[]
    interactif?: boolean
    showVerifyButton?: boolean
    nbLignesCachees?: number
    nbColonnesCachees?: number
    readOnlyCells?: string[]
  } = {}): string {
    return super.create({
      id,
      data,
      minDimensions,
      style,
      columns,
      interactif,
      showVerifyButton,
      nbLignesCachees,
      nbColonnesCachees,
      readOnlyCells:
        readOnlyCells && readOnlyCells.length > 0 ? readOnlyCells : undefined,
    })
  }

  private _spreadsheet: SpreadsheetLike | null = null
  private _buttonListener?: EventListener
  private _customListeners: { [eventName: string]: EventListener } = {}
  private showVerifyButton: boolean = true

  private get spreadsheet(): SpreadsheetLike {
    if (this._spreadsheet == null) {
      throw new Error('Spreadsheet is not mounted yet.')
    }
    return this._spreadsheet
  }

  constructor() {
    super()
    this._spreadsheet = null
  }

  /**
   * Ajoute un listener sur l'élément et le mémorise pour suppression ultérieure
   */
  public addListener(eventName: string, callback: EventListener) {
    this.addEventListener(eventName, callback)
    this._customListeners[eventName] = callback
  }

  /**
   * Méthode statique pour créer et configurer un MySpreadsheetElement
   */
  static createEltToAppendToDom({
    id,
    data = [],
    minDimensions = [5, 5],
    style = {},
    columns = [],
    interactif = false,
    showVerifyButton = true,
    readOnlyCells = [],
  }: {
    id?: string
    data?: (string | number)[][]
    minDimensions?: [number, number]
    style?: Record<string, unknown>
    columns?: unknown[]
    interactif?: boolean
    showVerifyButton?: boolean
    readOnlyCells?: string[]
  } = {}) {
    const elt = new MySpreadsheetElement()
    if (id) elt.id = id
    elt.setAttribute('data', JSON.stringify(data))
    elt.setAttribute('min-dimensions', JSON.stringify(minDimensions))
    elt.setAttribute('style', JSON.stringify(style))
    elt.setAttribute('columns', JSON.stringify(columns))
    elt.setAttribute('interactif', interactif ? 'true' : 'false')
    if (readOnlyCells.length > 0) {
      elt.setAttribute('readonly-cells', JSON.stringify(readOnlyCells))
    }
    if (showVerifyButton !== undefined) {
      elt.setAttribute(
        'show-verify-button',
        showVerifyButton ? 'true' : 'false',
      )
    }
    return elt
  }

  connectedCallback() {
    this.hydrateCommonAttributes()
    this.innerHTML = '<div></div>'
    const container = (this.firstElementChild ??
      document.createElement('div')) as HTMLDivElement

    let data: (number | string)[][] = []
    let minDimensions: [number, number] = [5, 5]
    let style: Record<string, unknown> = {}
    let columns: unknown[] = []
    let nbLignesCachees = 0
    let nbColonnesCachees = 0
    let readOnlyCells: string[] = []
    const shouldBeReadOnly = !this.interactivityOn
    try {
      if (this.getAttribute('data'))
        data = JSON.parse(this.getAttribute('data') ?? '') as (
          | string
          | number
        )[][]
    } catch {
      // Attribut data invalide, on conserve la valeur par défaut.
    }
    try {
      if (this.getAttribute('min-dimensions')) {
        const parsed = JSON.parse(this.getAttribute('min-dimensions') ?? '')
        if (Array.isArray(parsed) && parsed.length >= 2) {
          minDimensions = [Number(parsed[0]), Number(parsed[1])]
        }
      }
    } catch {
      // Attribut min-dimensions invalide, on conserve la valeur par défaut.
    }
    try {
      if (this.getAttribute('style'))
        style = JSON.parse(this.getAttribute('style') ?? '')
    } catch {
      // Attribut style invalide, on conserve la valeur par défaut.
    }
    try {
      if (this.getAttribute('columns'))
        columns = JSON.parse(this.getAttribute('columns') ?? '[]')
    } catch {
      // Attribut columns invalide, on conserve la valeur par défaut.
    }
    try {
      if (this.getAttribute('nb-lignes-cachees'))
        nbLignesCachees = Number(this.getAttribute('nb-lignes-cachees') ?? '0')
    } catch {
      // Attribut nb-lignes-cachees invalide, on conserve la valeur par défaut.
    }
    try {
      if (this.getAttribute('nb-colonnes-cachees'))
        nbColonnesCachees = Number(
          this.getAttribute('nb-colonnes-cachees') ?? '0',
        )
    } catch {
      // Attribut nb-colonnes-cachees invalide, on conserve la valeur par défaut.
    }
    try {
      if (this.getAttribute('readonly-cells'))
        readOnlyCells = JSON.parse(this.getAttribute('readonly-cells') ?? '[]')
    } catch {
      // Attribut readonly-cells invalide, on conserve la valeur par défaut.
    }
    const expandReadOnlyCells = (cells: string[]) => {
      const toIndex = (letters: string) => {
        let index = 0
        for (const char of letters.toUpperCase()) {
          index = index * 26 + (char.charCodeAt(0) - 64)
        }
        return index - 1
      }
      const toLetters = (index: number) => {
        let n = index + 1
        let letters = ''
        while (n > 0) {
          const rem = (n - 1) % 26
          letters = String.fromCharCode(65 + rem) + letters
          n = Math.floor((n - 1) / 26)
        }
        return letters
      }
      const parseRef = (ref: string) => {
        const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/)
        if (!match) return null
        return { col: toIndex(match[1]), row: Number(match[2]) - 1 }
      }
      const expanded: string[] = []
      cells.forEach((cellRef) => {
        const trimmed = cellRef.trim()
        if (!trimmed) return
        if (!trimmed.includes(':')) {
          const parsed = parseRef(trimmed)
          if (parsed) expanded.push(trimmed.toUpperCase())
          return
        }
        const [startRef, endRef] = trimmed.split(':')
        const start = parseRef(startRef)
        const end = parseRef(endRef)
        if (!start || !end) return
        const colStart = Math.min(start.col, end.col)
        const colEnd = Math.max(start.col, end.col)
        const rowStart = Math.min(start.row, end.row)
        const rowEnd = Math.max(start.row, end.row)
        for (let row = rowStart; row <= rowEnd; row++) {
          for (let col = colStart; col <= colEnd; col++) {
            expanded.push(`${toLetters(col)}${row + 1}`)
          }
        }
      })
      return expanded
    }
    this._spreadsheet = jspreadsheet(container, {
      tabs: false,
      toolbar: false,
      worksheets: [
        {
          data,
          minDimensions,
          tableOverflow: true,
          tableHeight: '300px',
          style: style as Record<string, string>,
          columns: columns as never,
        },
      ],
    })[0] as unknown as SpreadsheetLike
    const spreadsheet = this.spreadsheet
    container.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    if (readOnlyCells.length > 0) {
      expandReadOnlyCells(readOnlyCells).forEach((cellRef) => {
        spreadsheet.setReadOnly(cellRef, true)
      })
    }
    if (shouldBeReadOnly) {
      const colCount = Math.max(
        minDimensions[0] ?? 0,
        ...data.map((row) => row.length),
      )
      const rowCount = Math.max(minDimensions[1] ?? 0, data.length)
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (let colIndex = 0; colIndex < colCount; colIndex++) {
          spreadsheet.setReadOnly(
            MySpreadsheetElement.toCellRef(colIndex, rowIndex),
            true,
          )
        }
      }
    }
    for (let i = 0; i < nbLignesCachees; i++) {
      this.hideRow(i)
    }
    for (let j = 0; j < nbColonnesCachees; j++) {
      this.hideColumn(j)
    }
    let numeroExercice = 0
    let question = 0
    const idMatch = this.id.match(/sheet-Ex(\d+)Q(\d+)$/)
    if (idMatch) {
      numeroExercice = Number(idMatch[1])
      question = Number(idMatch[2])
    }

    const feedBackElt = document.createElement('div')
    feedBackElt.id = 'message-faux'
    container.appendChild(feedBackElt)
    const resultCheck = document.createElement('span')
    resultCheck.id = `resultatCheckEx${numeroExercice}Q${question}`
    container.appendChild(resultCheck)
    const divFeedback = document.createElement('div')
    divFeedback.id = `feedbackEx${numeroExercice}Q${question}`
    divFeedback.className =
      'italic text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest'
    container.appendChild(divFeedback)

    if (this.getAttribute('show-verify-button') === 'false') {
      this.showVerifyButton = false
    }
    const bouton = document.createElement('button')
    bouton.id = 'runCode'
    bouton.textContent = 'Vérifier'
    bouton.style.boxSizing = 'border-box'
    bouton.style.position = 'relative'
    bouton.style.zIndex = '10'
    bouton.style.marginTop = '10px'
    // Styles personnalisés
    bouton.style.backgroundColor = '#2b6cb0' // Bleu coopmaths
    bouton.style.color = 'white' // Texte blanc
    bouton.style.border = 'none' // Pas de bordure
    bouton.style.borderRadius = '6px' // Bords arrondis
    bouton.style.padding = '8px 20px' // Espacement interne
    bouton.style.fontSize = '1rem' // Taille du texte
    bouton.style.fontWeight = 'bold' // Texte en gras
    bouton.style.cursor = 'pointer' // Curseur main au survol
    bouton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)' // Ombre légère

    // Effet au survol
    bouton.onmouseover = () => {
      bouton.style.backgroundColor = '#174ea6'
    }
    bouton.onmouseout = () => {
      bouton.style.backgroundColor = '#2b6cb0'
    }
    bouton.style.display =
      this.getAttribute('interactif') === 'true' ||
      this.showVerifyButton === false ||
      shouldBeReadOnly
        ? 'none'
        : 'block'
    container.appendChild(bouton)
    if (idMatch) {
      const numeroExercice = Number(idMatch[1])
      const question = Number(idMatch[2])
      if (this.showVerifyButton) {
        this._setupButton(bouton, numeroExercice, question)
      }
    }
    this.dispatchEvent(new CustomEvent('spreadsheet-ready'))
  }

  disconnectedCallback() {
    if (this._spreadsheet) {
      this._spreadsheet = null
    }
    // Retire le listener personnalisé
    const bouton = this.querySelector('#runCode')
    if (bouton && this._buttonListener) {
      bouton.removeEventListener('click', this._buttonListener)
    }
    // Retire tous les listeners ajoutés via addListener
    Object.entries(this._customListeners).forEach(([eventName, callback]) => {
      this.removeEventListener(eventName, callback)
    })
    this._customListeners = {}
  }

  _setupButton(
    bouton: HTMLButtonElement,
    numeroExercice: number,
    question: number,
  ) {
    const eventName = `checkEx${numeroExercice}Q${question}`
    this._buttonListener = () => {
      this.dispatchEvent(
        new CustomEvent(eventName, { detail: { sheet: this } }),
      )
    }
    bouton.addEventListener('click', this._buttonListener)
  }

  getCellValue(column: number, row: number) {
    return this.spreadsheet.getValueFromCoords(column, row, true)
  }

  getCellFormula(column: number, row: number) {
    return String(
      this.spreadsheet.getValueFromCoords(column, row, false),
    ).toUpperCase()
  }

  getData() {
    // Retourne les données de la première worksheet
    return this.spreadsheet.getData() ?? []
  }

  setCellValue(column: number, row: number, value: string | number) {
    this.spreadsheet.setValueFromCoords(column, row, value, true)
  }

  setCellFormula(column: number, row: number, formula: string) {
    if (!formula.startsWith('=')) formula = '=' + formula.toUpperCase()
    this.spreadsheet.setValueFromCoords(column, row, formula, true)
  }

  setData(data: unknown[]) {
    this.spreadsheet.setData(data)
  }

  isMounted() {
    return this._spreadsheet !== null
  }

  getMinDimensions() {
    return this.spreadsheet.minDimensions ?? [5, 5]
  }

  getStyle(): Record<string, unknown> {
    return this.spreadsheet.style ?? {}
  }

  setCellStyle(style: SpreadsheetStyle) {
    this.spreadsheet.setStyle(style)
  }

  getColumns(): unknown[] {
    return this.spreadsheet.columns ?? []
  }

  showRow(rowIndex: number) {
    this.spreadsheet.showRow(rowIndex)
  }

  hideRow(rowIndex: number) {
    this.spreadsheet.hideRow(rowIndex)
  }

  showColumn(colIndex: number) {
    this.spreadsheet.showColumn(colIndex)
  }

  hideColumn(colIndex: number) {
    this.spreadsheet.hideColumn(colIndex)
  }
}

registerMathaleaCustomElement(MySpreadsheetElement)
