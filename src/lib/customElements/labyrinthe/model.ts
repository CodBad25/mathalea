import seedrandom from 'seedrandom'
import type {
  CellGrid,
  CellState,
  Coords,
  GameSnapshot,
  LabyrintheModel as ILabyrintheModel,
  LatexOptions,
  ModelConfig,
  Orientation,
  SerializedState,
} from './types'

/**
 * Implémentation pure (sans DOM) du modèle de labyrinthe.
 * - Génère un chemin unique (8-voisins) entre deux bords selon l'orientation.
 * - Gère l'état de jeu: clics, victoire/défaite.
 * - Sérialise/Restaure l'état utilisateur indépendamment du DOM.
 * - Distribue les valeurs (bonnes/mauvaises) dans la grille.
 */
export class Labyrinthe implements ILabyrintheModel {
  private rows: number = 8
  private cols: number = 8

  private seed: string | null = null
  private rnd: () => number = Math.random

  // Expose a seeded random generator for deterministic value generation
  private valuesRnd: (() => number) | null = null

  // 'random' permet de tirer l'orientation à chaque génération
  private orientationMode: Orientation | 'random' = 'random'
  private lastOrientation: Orientation = 'vertical'

  private start: Coords = { row: 0, col: 0 }
  private end: Coords = { row: 0, col: 0 }

  private grid: CellGrid = []
  private correctClicks: number = 0
  private badClicks: number = 0
  private win: boolean = false
  private gameOver: boolean = false

  private goodAnswers: string[] = []
  private badAnswers: string[] = []

  // Dimensions des cellules en em
  private width: number | null = null
  private height: number | null = null

  constructor(opts?: ModelConfig) {
    if (opts) this.configure(opts)
    // Ne pas régénérer automatiquement - laissez l'appelant le faire explicitement
    // Cela évite les régénérations multiples non-déterministes
  }

  get cellWidth(): number | null {
    return this.width
  }

  get cellHeight(): number | null {
    return this.height
  }

  configure(opts: ModelConfig): void {
    if (opts.seed !== undefined) {
      this.seed = opts.seed ?? null
      this.rnd = this.seed != null ? seedrandom(this.seed) : Math.random
      // Create a separate RNG for values generation with a derived seed
      this.valuesRnd = this.seed != null ? seedrandom(this.seed + '-values') : null
    }
    if (opts.orientation !== undefined) {
      this.orientationMode = opts.orientation
    }
    if (opts.rows !== undefined) {
      const n = Math.floor(Number(opts.rows))
      if (Number.isFinite(n) && n > 0) this.rows = n
    }
    if (opts.cols !== undefined) {
      const n = Math.floor(Number(opts.cols))
      if (Number.isFinite(n) && n > 0) this.cols = n
    }
    if (opts.width !== undefined) {
      this.width = opts.width
    }
    if (opts.height !== undefined) {
      this.height = opts.height
    }
  }

  regenerate(): void {
    // Réinitialise l'état de jeu
    this.correctClicks = 0
    this.badClicks = 0
    this.win = false
    this.gameOver = false

    // IMPORTANT: Réinitialiser le RNG pour garantir le déterminisme
    // Chaque appel à regenerate() avec le même seed doit produire le même labyrinthe
    if (this.seed != null) {
      this.rnd = seedrandom(this.seed)
      // Reset the values RNG as well for deterministic value generation
      this.valuesRnd = seedrandom(this.seed + '-values')
    }

    // Génère un masque de chemin (0/1) puis convertit en grille de CellState
    const { mask, start, end, orientation } = this.generateNewPathMask()
    this.start = start
    this.end = end
    this.lastOrientation = orientation

    this.grid = Array(this.rows)
      .fill(0)
      .map((_, r) =>
        Array(this.cols)
          .fill(0)
          .map(
            (__, c): CellState => ({
              isGood: mask[r][c] === 1,
              clicked: false,
              text: '',
            }),
          ),
      )

    // Redistribue les valeurs si elles ont été fournies auparavant
    // (mais seulement si on a effectivement des valeurs à distribuer)
    if (this.goodAnswers.length > 0 || this.badAnswers.length > 0) {
      this.assignValuesToGrid()
    }
  }

  setValues(good: string[], bad: string[]): void {
    this.goodAnswers = Array.isArray(good) ? good.map(String) : []
    this.badAnswers = Array.isArray(bad) ? bad.map(String) : []
    this.assignValuesToGrid()
  }

  clickCell(row: number, col: number): void {
    if (this.gameOver) return
    if (!this.inBounds(row, col)) return

    const cell = this.grid[row][col]
    if (cell.clicked) return

    cell.clicked = true
    if (cell.isGood) {
      this.correctClicks++
      // On considère que le joueur n'a pas besoin de cliquer Départ/Arrivée pour gagner.
      // Donc win si toutes les bonnes cases sauf 2 (Départ/Arrivée) ont été trouvées.
      if (this.correctClicks >= this.numberOfGoodAnswers() - 2) {
        this.win = true
        this.gameOver = true
      }
    } else {
      this.badClicks++
      this.win = false
      this.gameOver = true
    }
  }

  snapshot(): GameSnapshot {
    return {
      seed: this.seed,
      orientation: this.lastOrientation,
      rows: this.rows,
      cols: this.cols,
      start: { ...this.start },
      end: { ...this.end },
      grid: this.cloneGrid(this.grid),

      win: this.win,
      gameOver: this.gameOver,
      correctClicks: this.correctClicks,
      badAnswers: this.badClicks,
    }
  }

  serializeState(): SerializedState {
    // Format JSON compact :
    //  - c: correct clicks
    //  - b: bad clicks
    //  - g: matrice 0/1 des clics utilisateur
    const clicked = this.grid.map((row) => row.map((c) => (c.clicked ? 1 : 0)))
    return JSON.stringify({
      c: this.correctClicks,
      b: this.badClicks,
      g: clicked,
    })
  }

  restoreState(state: SerializedState): void {
    try {
      const parsed = JSON.parse(state)
      const g = parsed?.g
      if (Array.isArray(g)) {
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            const v = g?.[r]?.[c]
            this.grid[r][c].clicked = v === 1
          }
        }
      }

      // Recalcule les compteurs à partir de la grille (source de vérité)
      let correct = 0
      let wrong = 0
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = this.grid[r][c]
          if (cell.clicked) {
            if (cell.isGood) correct++
            else wrong++
          }
        }
      }
      this.correctClicks = correct
      this.badClicks = wrong

      // Déduit la fin de partie: si mauvaise case cliquée -> perdu
      if (wrong > 0) {
        this.win = false
        this.gameOver = true
      } else if (correct >= this.numberOfGoodAnswers() - 2 && correct > 0) {
        // Si toutes les bonnes (sauf départ/arrivée) sont cliquées -> gagné
        this.win = true
        this.gameOver = true
      } else {
        this.win = false
        this.gameOver = false
      }
    } catch {
      // État invalide: ignorer (pas d'exception)
    }
  }

  numberOfGoodAnswers(): number {
    let count = 0
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid?.[r]?.[c]?.isGood) count++
      }
    }
    return count
  }

  numberOfIncorrectAnswers(): number {
    return this.rows * this.cols - this.numberOfGoodAnswers()
  }

  // ========================
  // Logique de génération
  // ========================

  private generateNewPathMask(): {
    mask: number[][]
    start: Coords
    end: Coords
    orientation: Orientation
  } {
    const MAX_ATTEMPTS = 200
    const orientation = this.chooseOrientation()

    // Stratégie déterministe: on génère tous les chemins possibles avec le même RNG
    // et on retourne le premier succès. Avec le même seed, on aura toujours le même résultat.
    // Note: le RNG a été réinitialisé dans regenerate() pour garantir la reproductibilité.
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const result = this.tryGeneratePathOnce(orientation)
      if (result) return result
    }
    // Fallback: chemin en ligne droite
    return this.generateFallbackStraightPath(orientation)
  }

  private tryGeneratePathOnce(
    orientation: Orientation,
  ): { mask: number[][]; start: Coords; end: Coords; orientation: Orientation } | null {
    const mask = this.zeroMask()

    // Point de départ
    let currentRow: number
    let currentCol: number
    if (orientation === 'vertical') {
      currentRow = 0
      currentCol = Math.floor(this.rnd() * this.cols)
    } else {
      currentRow = Math.floor(this.rnd() * this.rows)
      currentCol = 0
    }

    mask[currentRow][currentCol] = 1
    const path: Array<[number, number]> = [[currentRow, currentCol]]

    const touchesOnlyCurrent = (r: number, c: number, curR: number, curC: number) => {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr === curR && nc === curC) continue
          if (this.inBounds(nr, nc) && mask[nr][nc] === 1) {
            return false
          }
        }
      }
      return true
    }

    const maxSteps = this.rows * this.cols * 4
    let steps = 0

    while (true) {
      if (++steps > maxSteps) return null

      const neighbors: Array<[number, number]> = []
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const newRow = currentRow + dr
          const newCol = currentCol + dc
          if (
            this.inBounds(newRow, newCol) &&
            mask[newRow][newCol] === 0 &&
            touchesOnlyCurrent(newRow, newCol, currentRow, currentCol)
          ) {
            neighbors.push([newRow, newCol])
          }
        }
      }

      if (neighbors.length === 0) {
        // retour en arrière : on démarque la case courante
        mask[currentRow][currentCol] = 0
        path.pop()
        if (path.length === 0) return null
        ;[currentRow, currentCol] = path[path.length - 1]
        continue
      }

      // avance vers un voisin aléatoire
      const [nextRow, nextCol] = neighbors[Math.floor(this.rnd() * neighbors.length)]
      mask[nextRow][nextCol] = 1
      path.push([nextRow, nextCol])
      ;[currentRow, currentCol] = [nextRow, nextCol]

      // sortie atteinte ?
      if (orientation === 'vertical' && currentRow === this.rows - 1) break
      if (orientation === 'horizontal' && currentCol === this.cols - 1) break
    }

    if (!this.isUniquePath(mask)) return null

    const start: Coords = { row: path[0][0], col: path[0][1] }
    const end: Coords = { row: path[path.length - 1][0], col: path[path.length - 1][1] }

    return { mask, start, end, orientation }
  }

  private generateFallbackStraightPath(orientation: Orientation): {
    mask: number[][]
    start: Coords
    end: Coords
    orientation: Orientation
  } {
    const mask = this.zeroMask()
    if (orientation === 'vertical') {
      const col = Math.floor(this.rnd() * this.cols)
      for (let r = 0; r < this.rows; r++) mask[r][col] = 1
      return {
        mask,
        start: { row: 0, col },
        end: { row: this.rows - 1, col },
        orientation,
      }
    } else {
      const row = Math.floor(this.rnd() * this.rows)
      for (let c = 0; c < this.cols; c++) mask[row][c] = 1
      return {
        mask,
        start: { row, col: 0 },
        end: { row, col: this.cols - 1 },
        orientation,
      }
    }
  }

  // Unicité du chemin:
  // - exactement 2 noeuds de degré 1
  // - tous les autres noeuds de degré 2
  // - composante connexe
  // Les voisins considérés sont les 8-voisins (diagonales incluses),
  // cohérent avec la génération.
  private isUniquePath(mask: number[][]): boolean {
    const key = (r: number, c: number) => `${r},${c}`
    const open = new Set<string>()
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (mask[r][c] === 1) open.add(key(r, c))
      }
    }
    if (open.size < 2) return false

    const inOpen = (r: number, c: number) => this.inBounds(r, c) && open.has(key(r, c))

    const neighbors8 = (r: number, c: number) => {
      const out: Array<[number, number]> = []
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (inOpen(nr, nc)) out.push([nr, nc])
        }
      }
      return out
    }

    const deg1: Array<[number, number]> = []
    for (const id of open) {
      const [r, c] = id.split(',').map(Number)
      const d = neighbors8(r, c).length
      if (d === 1) deg1.push([r, c])
      else if (d !== 2) return false
    }
    if (deg1.length !== 2) return false

    // vérifie la connexité
    const start = deg1[0]
    const stack = [start]
    const visited = new Set<string>([key(start[0], start[1])])
    while (stack.length) {
      const popped = stack.pop()
      if (!popped) break
      const [r, c] = popped
      for (const [nr, nc] of neighbors8(r, c)) {
        const k = key(nr, nc)
        if (!visited.has(k)) {
          visited.add(k)
          stack.push([nr, nc])
        }
      }
    }
    return visited.size === open.size
  }

  // ========================
  // Helpers internes
  // ========================

  private inBounds(r: number, c: number): boolean {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols
  }

  private zeroMask(): number[][] {
    return Array(this.rows)
      .fill(0)
      .map(() => Array(this.cols).fill(0))
  }

  private chooseOrientation(): Orientation {
    if (this.orientationMode === 'random') {
      return this.rnd() > 0.5 ? 'vertical' : 'horizontal'
    }
    return this.orientationMode
  }

  private assignValuesToGrid(): void {
    if (!this.grid || this.grid.length === 0) return

    let gi = 0
    let bi = 0
    let emptyCells = 0
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c]
        if (cell.isGood) {
          cell.text = this.goodAnswers?.[gi++] ?? ''
          if (cell.text === '') emptyCells++
        } else {
          cell.text = this.badAnswers?.[bi++] ?? ''
          if (cell.text === '') emptyCells++
        }
      }
    }

    if (emptyCells > 0) {
      console.warn(`assignValuesToGrid: ${emptyCells} cellules vides détectées`, {
        goodUsed: gi,
        goodAvailable: this.goodAnswers.length,
        badUsed: bi,
        badAvailable: this.badAnswers.length,
      })
    }
  }

  private cloneGrid(grid: CellGrid): CellGrid {
    return grid.map((row) => row.map((c) => ({ isGood: c.isGood, clicked: c.clicked, text: c.text })))
  }

  /**
   * Generate a deterministic random integer between min and max (inclusive).
   * Uses the seeded RNG if available, otherwise falls back to Math.random.
   */
  randomInt(min: number, max: number): number {
    const rng = this.valuesRnd ?? Math.random
    return Math.floor(rng() * (max - min + 1)) + min
  }

  /**
   * Generate a deterministic random number between 0 and 1.
   * Uses the seeded RNG if available, otherwise falls back to Math.random.
   */
  random(): number {
    return this.valuesRnd ? this.valuesRnd() : Math.random()
  }
  private escapeForTabular(s: string): string {
    if (s == null) return ''
    return String(s).replace(/&/g, '\\&').replace(/\r?\n/g, ' ')
  }

  generateLatex(options: LatexOptions = {}): string {
    const { correction = false, align = 'c', borders = true, rowSeparators = true } = options
    const snap = this.snapshot()
    const rows = snap.rows
    const cols = snap.cols

    const colSpec = borders ? '|' + `${align}|`.repeat(cols) : `${align}`.repeat(cols)
    const out: string[] = []
    out.push(`\\begin{tabular}{${colSpec}}`)
    if (rowSeparators) out.push(`\\hline`)

    for (let i = 0; i < rows; i++) {
      const cells: string[] = []
      for (let j = 0; j < cols; j++) {
        const cell = snap.grid?.[i]?.[j]
        const isGood = !!cell?.isGood
        let text = cell?.text ?? ''
        if (correction && isGood) {
          text = `\\textbf{${text}}`
        }

        // Griser le départ/arrivée, et en mode correction griser aussi les bonnes cases
        const isStart = snap.start.row === i && snap.start.col === j
        const isEnd = snap.end.row === i && snap.end.col === j
        const shouldShade = isStart || isEnd || (correction && isGood)

        let cellLatex = this.escapeForTabular(text)
        if (shouldShade) {
          if (cellLatex.trim() === '') {
            cellLatex = `\\cellcolor{gray!20}~`
          } else {
            cellLatex = `\\cellcolor{gray!20}${cellLatex}`
          }
        }

        cells.push(cellLatex)
      }
      if (rowSeparators) {
        out.push(`${cells.join(' & ')} \\\\ \\hline`)
      } else {
        out.push(`${cells.join(' & ')} \\\\`)
      }
    }

    out.push(`\\end{tabular}`)
    return out.join('\n')
  }

  generateLatexCorrection(options: Omit<LatexOptions, 'correction'> = {}): string {
    return this.generateLatex({ ...options, correction: true })
  }
}

export default Labyrinthe
