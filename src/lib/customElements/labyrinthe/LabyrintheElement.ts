import { renderMathInElement } from 'mathlive'

import Labyrinthe from './model'
import DomLabyrintheRenderer from './renderer'
import type { GameEndDetail, MathRenderer, Orientation } from './types'

/**
 * Web Component “mince” qui délègue :
 * - la logique métier au modèle (génération du chemin, état de jeu, sérialisation)
 * - le rendu DOM au renderer (construction de la grille, styles, typesetting math)
 * - aucun overlay : quand la partie est finie, l’élément est simplement désactivé
 */
export default class LabyrintheElement extends HTMLElement {
  // Lifecycle state
  ready = false
  gameOver = false
  win = false

  // Controller internals
  #root: ShadowRoot
  #model = new Labyrinthe()
  #renderer = new DomLabyrintheRenderer(new MathliveRenderer())
  #pendingSerializedState: string | null = null

  constructor() {
    super()
    // Conserver un Shadow DOM fermé comme l’implémentation d’origine
    this.#root = this.attachShadow({ mode: 'closed' })
  }

  static get observedAttributes() {
    return ['state', 'disabled', 'seed', 'rows', 'cols', 'orientation', 'width', 'height']
  }

  connectedCallback() {
    // Exiger une seed pour garantir la reproductibilité (comportement antérieur)
    const seed = this.getAttribute('seed')
    if (!seed) {
      throw new Error('[LabyrintheElement] Missing required "seed" attribute')
    }

    // Configurer le modèle à partir des attributs
    this.#configureModelFromAttributes()

    // Générer un nouveau labyrinthe et premier rendu
    this.#model.regenerate()
    this.#renderAndPersist()

    // Restaurer un éventuel état sérialisé
    if (this.getAttribute('state')) {
      this.#pendingSerializedState = this.getAttribute('state')
      this.#applyPendingState()
      this.#renderAndPersist()
    }

    // Appliquer l’état disabled si présent
    this.#renderer.setDisabled(this.#root, this.disabled)

    // Écoutes d’événements utilisateur
    this.#bindEvents()

    this.ready = true
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
    switch (name) {
      case 'state': {
        // L’état peut arriver avant que la grille ne soit prête; on met en attente
        this.#pendingSerializedState = newValue ?? ''
        if (this.isConnected) {
          this.#applyPendingState()
          this.#renderAndPersist()
        }
        break
      }
      case 'disabled': {
        if (this.isConnected) {
          this.#renderer.setDisabled(this.#root, newValue !== null)
        }
        break
      }
      case 'seed':
      case 'rows':
      case 'cols':
      case 'orientation': {
        if (!this.isConnected) break
        this.#configureModelFromAttributes()
        this.#model.regenerate()
        // Réappliquer l'éventuel state après régénération pour conserver les clics
        if (this.#pendingSerializedState != null) {
          this.#applyPendingState()
        }
        this.#renderAndPersist()
        this.#renderer.setDisabled(this.#root, this.disabled)
        break
      }
      case 'width':
      case 'height': {
        if (this.isConnected) {
          this.#renderAndPersist()
        }
        break
      }
    }
  }

  // Public API (compat)

  get disabled(): boolean {
    return this.hasAttribute('disabled')
  }
  set disabled(v: boolean) {
    if (v) this.setAttribute('disabled', '')
    else this.removeAttribute('disabled')
  }

  get seed(): string {
    return this.getAttribute('seed') ?? ''
  }
  set seed(v: string) {
    if (v == null) this.removeAttribute('seed')
    else this.setAttribute('seed', String(v))
  }

  get orientation(): 'vertical' | 'horizontal' | null {
    const v = this.getAttribute('orientation')
    if (v == null) return null
    const val = v.toLowerCase()
    if (val === 'vertical') return 'vertical'
    if (val === 'horizontal') return 'horizontal'
    return null
  }
  set orientation(v: 'vertical' | 'horizontal' | null) {
    if (v == null) this.removeAttribute('orientation')
    else this.setAttribute('orientation', v)
  }

  get rows(): number {
    return this.#model.snapshot().rows
  }
  set rows(v: number) {
    const n = Math.floor(Number(v))
    if (!Number.isFinite(n) || n <= 0) return
    this.setAttribute('rows', String(n))
  }

  get cols(): number {
    return this.#model.snapshot().cols
  }
  set cols(v: number) {
    const n = Math.floor(Number(v))
    if (!Number.isFinite(n) || n <= 0) return
    this.setAttribute('cols', String(n))
  }

  get state(): string {
    return this.getAttribute('state') ?? ''
  }
  set state(v: string) {
    const s = v == null ? '' : String(v)
    if (this.getAttribute('state') !== s) {
      this.setAttribute('state', s)
    }
  }

  get width(): number | null {
    const w = this.getAttribute('width')
    if (w == null) return null
    const n = parseFloat(w)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  set width(v: number | null) {
    if (v == null) this.removeAttribute('width')
    else this.setAttribute('width', String(v))
  }

  get height(): number | null {
    const h = this.getAttribute('height')
    if (h == null) return null
    const n = parseFloat(h)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  set height(v: number | null) {
    if (v == null) this.removeAttribute('height')
    else this.setAttribute('height', String(v))
  }

  get numberOfGoodAnswers(): number {
    return this.#model.numberOfGoodAnswers()
  }

  get numberOfIncorrectAnswers(): number {
    return this.#model.numberOfIncorrectAnswers()
  }

  get correctClicks(): number {
    return this.#model.snapshot().correctClicks
  }

  get totalGood(): number {
    return this.#model.numberOfGoodAnswers()
  }

  regenerate() {
    this.#model.regenerate()
    this.#renderAndPersist()
  }

  /**
   * Met à jour le contenu (bonnes/mauvaises valeurs) puis re-render.
   */
  setValues(good: string[], bad: string[]) {
    this.#model.setValues(good, bad)
    this.#renderAndPersist()
  }

  /**
   * Affiche la correction visuelle.
   * Note: n’impacte pas l’état du modèle (pas de game over forcé).
   */
  showCorrection() {
    const snap = this.#model.snapshot()
    this.#renderer.showCorrection(this.#root, snap)
    // Persiste l’état actuel (inchangé)
    this.#persistState()
  }

  /**
   * Export LaTeX du tableau, avec ou sans mise en évidence des bonnes cases.
   */
  get latex(): string {
    return this.#generateLatex(false)
  }
  set latex(_: string) {
    this.setAttribute('latex', this.#generateLatex(false))
  }
  get latexCorrection(): string {
    return this.#generateLatex(true)
  }

  // Internals

  #configureModelFromAttributes() {
    const seed = this.getAttribute('seed') ?? null
    const rowsAttr = this.getAttribute('rows')
    const colsAttr = this.getAttribute('cols')
    const orientationAttr = this.getAttribute('orientation')

    const rows = rowsAttr != null ? Math.floor(parseInt(rowsAttr, 10)) : undefined
    const cols = colsAttr != null ? Math.floor(parseInt(colsAttr, 10)) : undefined
    const orientation: Orientation | undefined =
      orientationAttr && (orientationAttr.toLowerCase() === 'vertical' || orientationAttr.toLowerCase() === 'horizontal')
        ? (orientationAttr.toLowerCase() as Orientation)
        : undefined

    this.#model.configure({
      seed,
      rows,
      cols,
      orientation,
    })
  }

  #bindEvents() {
    // Délégation de clic sur les cellules (repérées par data-row/data-col)
    this.#root.addEventListener('click', (e: Event) => {
      if (this.gameOver || this.disabled) return
      const target = e.composedPath().find((n) => n instanceof HTMLElement && n.classList.contains('grid-cell')) as
        | HTMLElement
        | undefined
      if (!target) return
      const r = target.dataset.row
      const c = target.dataset.col
      if (r == null || c == null) return

      const before = this.#model.snapshot().gameOver
      this.#model.clickCell(parseInt(r, 10), parseInt(c, 10))
      this.#renderAndPersist()

      const afterSnap = this.#model.snapshot()
      this.gameOver = afterSnap.gameOver
      this.win = afterSnap.win

      if (!before && afterSnap.gameOver) {
        // Désactiver l’interaction (comportement antérieur dans endGame)
        this.disabled = true
        const detail: GameEndDetail = {
          win: afterSnap.win,
          correctClicks: afterSnap.correctClicks,
          totalGood: this.#model.numberOfGoodAnswers(),
          totalBad: this.#model.numberOfIncorrectAnswers(),
          state: this.state,
        }
        this.dispatchEvent(
          new CustomEvent('labyrinthe:gameend', {
            detail,
            bubbles: true,
            composed: true,
          }),
        )
      }
    })
  }

  #renderAndPersist() {
    const snap = this.#model.snapshot()
    this.#renderer.render(this.#root, snap, this.width, this.height)
    this.#persistState()
    // Synchroniser les propriétés publiques avec l'état du modèle
    this.gameOver = snap.gameOver
    this.win = snap.win
  }

  #persistState() {
    // Persistance via attribut `state` (format interne JSON)
    const s = this.#model.serializeState()
    if (this.getAttribute('state') !== s) {
      this.setAttribute('state', s)
    }
  }

  #applyPendingState() {
    if (this.#pendingSerializedState == null) return

    const raw = this.#pendingSerializedState
    this.#pendingSerializedState = null

    // Si la chaîne semble être du JSON -> on passe tel quel au modèle
    const trimmed = raw.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      this.#model.restoreState(trimmed)
      return
    }

    // Compat: ancien format "r-c|r-c|..."
    const snap = this.#model.snapshot()
    const rows = snap.rows
    const cols = snap.cols

    const clicked = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0))

    const tokens = trimmed
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const t of tokens) {
      const [rs, cs] = t.split('-')
      if (rs == null || cs == null) continue
      const r = parseInt(rs, 10)
      const c = parseInt(cs, 10)
      if (Number.isFinite(r) && Number.isFinite(c) && r >= 0 && r < rows && c >= 0 && c < cols) {
        clicked[r][c] = 1
      }
    }

    const json = JSON.stringify({
      c: 0,
      b: 0,
      g: clicked,
    })
    this.#model.restoreState(json)
  }

  // LaTeX generation (reprend la logique initiale, indépendante du DOM)
  #generateLatex(correction: boolean): string {
    return correction ? this.#model.generateLatexCorrection() : this.#model.generateLatex()
  }
}

/**
 * Adaptateur vers MathLive respectant l’interface MathRenderer.
 * - injecte la feuille de styles MathLive dans le ShadowRoot si absent
 * - lance le typesetting sur le conteneur passé par le renderer
 */
class MathliveRenderer implements MathRenderer {
  typeset(root: Element | ShadowRoot): void {
    // Injecte le style MathLive une seule fois dans le ShadowRoot (si disponible)
    const shadow = root instanceof ShadowRoot ? root : (root.getRootNode() as ShadowRoot | Document)
    const hostShadow = shadow instanceof ShadowRoot ? shadow : null
    if (hostShadow && !hostShadow.querySelector('style[data-mathlive-style="1"]')) {
      const s = document.createElement('style')
      s.setAttribute('data-mathlive-style', '1')
      s.textContent = `@import url("https://cdn.jsdelivr.net/npm/mathlive/mathlive-static.css");`
      hostShadow.appendChild(s)
    }

    // Typesetting
    if (root instanceof HTMLElement) {
      renderMathInElement(root, {
        TeX: {
          delimiters: {
            inline: [
              ['$', '$'],
              ['\\(', '\\)'],
            ],
            display: [],
          },
        },
      })
    }
  }
}
