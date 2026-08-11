import type { GameSnapshot, LabyrintheRenderer as ILabyrintheRenderer, MathRenderer } from './types'

/**
 * Renderer DOM pour Labyrinthe qui consomme un snapshot pur et le projette dans un ShadowRoot.
 * - Aucune logique métier ici.
 * - Aucun binding d’événements (le contrôleur s’en charge via data-row/data-col).
 * - La composition mathématique est déléguée au MathRenderer fourni (optionnel).
 */
export class DomLabyrintheRenderer implements ILabyrintheRenderer {
  private math?: MathRenderer

  constructor(math?: MathRenderer) {
    this.math = math
  }

  render(root: ShadowRoot, snapshot: GameSnapshot, width?: number | null, height?: number | null): void {
    this.ensureStyle(root)
    const container = this.ensureContainer(root)

    // Apply custom width if provided
    if (width != null && width > 0) {
      container.style.setProperty('--cell-width', `${width}em`)
    } else {
      container.style.removeProperty('--cell-width')
    }

    // Apply custom height if provided
    if (height != null && height > 0) {
      container.style.setProperty('--cell-height', `${height}em`)
    } else {
      container.style.removeProperty('--cell-height')
    }

    // Update dynamic grid template via inline styles (repeat() can't use CSS variables reliably)
    container.style.gridTemplateColumns = `repeat(${snapshot.cols}, var(--cell-width))`
    container.style.gridTemplateRows = `repeat(${snapshot.rows}, var(--cell-height))`

    // Clear existing cells
    this.removeGridCells(container)

    // Rebuild cells
    for (let r = 0; r < snapshot.rows; r++) {
      for (let c = 0; c < snapshot.cols; c++) {
        const cellState = snapshot.grid[r]?.[c]
        const cell = document.createElement('div')
        cell.className = 'grid-cell'
        cell.dataset.row = String(r)
        cell.dataset.col = String(c)

        // Start/End markers
        if (snapshot.start.row === r && snapshot.start.col === c) {
          cell.classList.add('start')
        }
        if (snapshot.end.row === r && snapshot.end.col === c) {
          cell.classList.add('end')
        }

        // Clicked state visualization
        if (cellState?.clicked) {
          if (cellState.isGood) cell.classList.add('correct')
          else cell.classList.add('incorrect')
        }

        // Content
        cell.textContent = cellState?.text ?? ''

        container.appendChild(cell)
      }
    }

    // No overlay: game over handled by disabling at component level

    // Delegate math typesetting to the provided renderer (if any)
    this.math?.typeset(container)
  }

  showCorrection(root: ShadowRoot, snapshot: GameSnapshot): void {
    const container = root.querySelector('.grid-container') as HTMLDivElement | null
    if (!container) return
    for (let r = 0; r < snapshot.rows; r++) {
      for (let c = 0; c < snapshot.cols; c++) {
        const cell = container.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`) as HTMLDivElement | null
        if (!cell) continue
        const isGood = snapshot.grid[r]?.[c]?.isGood
        if (isGood) {
          cell.classList.add('correct')
          cell.classList.remove('incorrect')
        }
      }
    }
  }

  setDisabled(root: ShadowRoot, disabled: boolean): void {
    const container = root.querySelector('.grid-container') as HTMLDivElement | null
    if (!container) return
    if (disabled) {
      container.classList.add('disabled')
      container.setAttribute('aria-disabled', 'true')
      container.style.opacity = '0.6'
      container.style.pointerEvents = 'none'
    } else {
      container.classList.remove('disabled')
      container.removeAttribute('aria-disabled')
      container.style.opacity = ''
      container.style.pointerEvents = ''
    }
  }

  // Internals

  private ensureStyle(root: ShadowRoot): HTMLStyleElement {
    let style = root.querySelector('style[data-labyrinthe-style="1"]') as HTMLStyleElement | null
    if (style) return style

    style = document.createElement('style')
    style.setAttribute('data-labyrinthe-style', '1')
    style.textContent = `
      :host {
        --cell-width: clamp(44px, 9vw, 72px);
        --cell-height: clamp(44px, 9vw, 72px);
        --gap: 6px;
        --radius: 14px;
        --cell-radius: 12px;

        --bg-start: #f8fafc; /* slate-50 */
        --bg-end: #eef2f7;   /* subtle */
        --border: 1px solid rgba(2, 6, 23, 0.08);

        --cell-bg-start: #ffffff;
        --cell-bg-end: #f3f6fb;

        --accent: #3b82f6;       /* blue-500 */
        --correct-1: #34d399;    /* emerald-400 */
        --correct-2: #10b981;    /* emerald-500 */
        --incorrect-1: #f87171;  /* red-400 */
        --incorrect-2: #ef4444;  /* red-500 */
        --start-1: #60a5fa;      /* blue-400 */
        --start-2: #3b82f6;      /* blue-500 */
        --end-1: #a78bfa;        /* violet-400 */
        --end-2: #8b5cf6;        /* violet-500 */

        --shadow: 0 6px 16px rgba(2, 6, 23, 0.09), 0 2px 6px rgba(2, 6, 23, 0.05);
        --shadow-hover: 0 10px 24px rgba(2, 6, 23, 0.12), 0 3px 8px rgba(2, 6, 23, 0.06);

        display: inline-block;
      }

      .grid-container {
        display: grid;
        gap: var(--gap);
        margin: 8px auto;
        padding: calc(var(--gap) + 6px);
        background: linear-gradient(180deg, var(--bg-start) 0%, var(--bg-end) 100%);
        border-radius: var(--radius);
        border: var(--border);
        box-shadow: var(--shadow);
        position: relative;
      }



      .grid-cell {
        width: var(--cell-width);
        height: var(--cell-height);
        display: flex;
        align-items: center;
        justify-content: center;
        font: 600 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
        color: #0f172a; /* slate-900 */
        letter-spacing: 0.2px;

        background: linear-gradient(180deg, var(--cell-bg-start) 0%, var(--cell-bg-end) 100%);
        border-radius: var(--cell-radius);
        border: 1px solid rgba(2, 6, 23, 0.08);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.65) inset,
          0 1.5px 3px rgba(2, 6, 23, 0.06);

        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;

        transition:
          transform 0.18s ease,
          background 0.25s ease,
          box-shadow 0.25s ease,
          color 0.25s ease,
          border-color 0.25s ease;
      }

      .grid-cell * {
        user-select: none;
        pointer-events: none;
      }

      .grid-cell:hover {
        background: linear-gradient(180deg, #eef2ff 0%, #e5e9f2 100%);
        transform: translateY(-1px);
        box-shadow: var(--shadow-hover);
        border-color: rgba(2, 6, 23, 0.12);
      }

      .grid-cell:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(2, 6, 23, 0.10);
      }

      .grid-cell.start,
      .grid-cell.start.correct {
        background: linear-gradient(180deg, var(--start-1) 0%, var(--start-2) 100%);
        color: #fff;
        border-color: transparent;
        position: relative;
      }

      .grid-cell.end,
      .grid-cell.end.correct {
        background: linear-gradient(180deg, var(--end-1) 0%, var(--end-2) 100%);
        color: #fff;
        border-color: transparent;
        position: relative;
      }

      .grid-cell.start::after,
      .grid-cell.end::after {
        position: absolute;
        top: 6px;
        left: 6px;
        padding: 2px 6px;
        border-radius: 999px;
        font-size: 10px;
        line-height: 1;
        letter-spacing: .2px;
        background: rgba(255,255,255,.85);
        color: #0f172a;
        border: 1px solid rgba(2,6,23,.08);
        box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(2,6,23,.08);
        pointer-events: none;
        content: '';
      }
      .grid-cell.start::after { content: "Départ"; }
      .grid-cell.end::after { content: "Arrivée"; }

      @keyframes pop {
        0% { transform: scale(0.96); }
        60% { transform: scale(1.03); }
        100% { transform: scale(1); }
      }

      .grid-cell.correct,
      .grid-cell.incorrect {
        color: #fff;
        border-color: transparent;
        animation: pop 180ms ease-out;
      }

      .grid-cell.correct {
        background: linear-gradient(180deg, var(--correct-1) 0%, var(--correct-2) 100%);
        box-shadow:
          0 2px 10px rgba(16, 185, 129, 0.25),
          0 1px 0 rgba(255, 255, 255, 0.35) inset;
      }

      .grid-cell.incorrect {
        background: linear-gradient(180deg, var(--incorrect-1) 0%, var(--incorrect-2) 100%);
        box-shadow:
          0 2px 10px rgba(239, 68, 68, 0.25),
          0 1px 0 rgba(255, 255, 255, 0.35) inset;
      }




      @media (max-width: 720px) {
        :host {
          --gap: 5px;
          --cell-radius: 10px;
        }
        .grid-container {
          padding: calc(var(--gap) + 4px);
        }
        .grid-cell {
          font-weight: 600;
          font-size: 13px;
        }
        .grid-cell.start::after,
        .grid-cell.end::after {
          display: none;
        }
      }
    `
    root.appendChild(style)
    return style
  }

  private ensureContainer(root: ShadowRoot): HTMLDivElement {
    let container = root.querySelector('.grid-container') as HTMLDivElement | null
    if (!container) {
      container = document.createElement('div')
      container.className = 'grid-container mx-auto'
      root.appendChild(container)
    }
    return container
  }

  private removeGridCells(container: HTMLDivElement) {
    const cells = container.querySelectorAll('.grid-cell')
    cells.forEach((el) => {
      el.remove()
    })
  }

  // overlay removed
}

export default DomLabyrintheRenderer
