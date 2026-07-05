<script lang="ts">
  import { renderKatex } from '../../../lib/mathalea'
  import { renderScratchDiv } from '../../../lib/renderScratch'
  import type { A4UnitData } from './types'

  export let unit: A4UnitData

  /**
   * Injecte le HTML impérativement (plutôt qu'avec {@html}) puis rend
   * KaTeX et les blocs Scratch localement. Le DOM interne de l'unité est
   * ainsi entièrement hors du champ de la réconciliation de Svelte :
   * les mutations opérées par KaTeX ne peuvent pas la perturber.
   */
  function setHtml(
    node: HTMLElement,
    content: { html: string; svgZoom?: number },
  ) {
    const render = ({ html, svgZoom }: { html: string; svgZoom?: number }) => {
      node.innerHTML = html
      try {
        renderKatex(node)
        renderScratchDiv(node)
      } catch (error) {
        console.error('Erreur de rendu dans la vue A4', error)
      }
      applySvgZoom(node, svgZoom ?? 1)
      fitWideContent(node)
    }
    render(content)
    return {
      update(newContent: { html: string; svgZoom?: number }) {
        render(newContent)
      },
    }
  }

  /**
   * Zoome les figures (mathalea2d et blocs Scratch) en modifiant les
   * attributs width/height du SVG et, pour mathalea2d, les positions de ses
   * étiquettes (.divLatex), comme le fait la vue prof. Le HTML étant
   * réinjecté brut à chaque rendu, les attributs sont toujours d'origine :
   * pas de cumul. Cette approche (plutôt que le CSS `zoom`) affecte la mise
   * en page — donc la mesure — et reste compatible avec la capture
   * (modern-screenshot) de l'export PDF.
   */
  function applySvgZoom(node: HTMLElement, zoom: number) {
    if (zoom === 1) return
    for (const svg of node.querySelectorAll<SVGElement>(
      'svg.mathalea2d, .scratchblocks svg',
    )) {
      const width = Number.parseFloat(svg.getAttribute('width') ?? '')
      const height = Number.parseFloat(svg.getAttribute('height') ?? '')
      if (!Number.isFinite(width) || !Number.isFinite(height)) continue
      svg.setAttribute('width', String(width * zoom))
      svg.setAttribute('height', String(height * zoom))
      if (!svg.classList.contains('mathalea2d')) continue
      const parent = svg.parentElement
      if (parent == null) continue
      for (const label of parent.querySelectorAll<HTMLElement>(
        'div.divLatex',
      )) {
        const top = Number.parseFloat(label.style.top)
        const left = Number.parseFloat(label.style.left)
        if (Number.isFinite(top)) label.style.top = `${top * zoom}px`
        if (Number.isFinite(left)) label.style.left = `${left * zoom}px`
      }
    }
  }

  /**
   * Réduit (transform: scale) les blocs plus larges que la colonne —
   * tableaux, formules KaTeX en display, blocs Scratch, figures mathalea2d —
   * pour que rien ne dépasse en mode multi-colonnes. La hauteur de mise en
   * page perdue par le transform (qui ne l'affecte pas) est compensée par une
   * marge négative, pour que la mesure de pagination reste exacte. Le HTML
   * étant réinjecté brut à chaque rendu, la réduction ne se cumule jamais.
   * offsetWidth/scrollWidth (et non getBoundingClientRect) : insensibles au
   * zoom CSS de l'aperçu.
   * Pour mathalea2d, on scale le wrapper (.svgContainer > div) et non le SVG
   * (pas de max-width CSS) : les étiquettes .divLatex sont positionnées en px
   * absolus dans ce wrapper, seul un scale de l'ensemble les garde alignées.
   */
  function fitWideContent(node: HTMLElement) {
    const available = node.clientWidth
    if (available <= 0) return
    for (const el of node.querySelectorAll<HTMLElement>(
      'table, .katex-display, .scratchblocks, .svgContainer > div',
    )) {
      // déjà réduit via un ancêtre (tableau imbriqué, formule dans un tableau)
      if (el.parentElement?.closest('[data-a4-fit]') != null) continue
      const width = Math.max(el.offsetWidth, el.scrollWidth)
      if (width <= available + 1) continue
      const ratio = available / width
      const height = el.offsetHeight
      el.dataset.a4Fit = ''
      el.style.transform = `scale(${ratio})`
      el.style.transformOrigin = 'top left'
      el.style.marginBottom = `${-height * (1 - ratio)}px`
    }
  }
</script>

<!--
  @component
  Bloc de contenu élémentaire de la vue A4 (titre, consigne ou question).
  Utilisé à l'identique dans la galée de mesure et dans les pages afin que
  les hauteurs mesurées correspondent exactement au rendu final.
  Tous les espacements sont en padding (et non en margin) pour être
  comptabilisés dans offsetHeight lors de la mesure.
-->

<div
  class="a4-unit a4-unit-{unit.kind}"
  style={unit.style ?? ''}
  use:setHtml={{ html: unit.html, svgZoom: unit.svgZoom }}
></div>

<style>
  .a4-unit {
    box-sizing: border-box;
    width: 100%;
    overflow-wrap: break-word;
  }
  .a4-unit-title {
    padding-top: 0.9em;
    padding-bottom: 0.25em;
    font-weight: 700;
    color: black;
  }
  .a4-unit-intro {
    padding-bottom: 0.4em;
  }
  .a4-unit-question {
    padding-bottom: 0.55em;
  }
  .a4-unit-textblock {
    padding-bottom: 0.55em;
  }
  .a4-unit-warning {
    padding: 0.5em;
    margin-bottom: 0.5em;
    border: 1px dashed #999999;
    color: #666666;
    font-style: italic;
  }
  /* Pas de max-width sur svg.mathalea2d : un rétrécissement CSS du seul SVG
     désalignerait les étiquettes .divLatex ; fitWideContent scale le wrapper
     entier à la place. */
  .a4-unit :global(img) {
    max-width: 100%;
  }
  .a4-unit :global(.a4-question-number) {
    font-weight: 700;
  }
  /* Référence du référentiel à côté de la numérotation (ex : « 6C10 ») */
  .a4-unit :global(.a4-exo-ref) {
    font-weight: 400;
    font-size: 0.85em;
    color: #666666;
  }
  .a4-unit :global(table) {
    max-width: 100%;
  }
</style>
