<script lang="ts">
  import { renderKatex } from '../../../lib/mathalea'
  import { renderScratchDiv } from '../../../lib/renderScratch'
  import { markBlankLines } from './blankLines'
  import type { A4UnitData } from './types'

  export let unit: A4UnitData
  /** Hauteur (en multiple de la taille de police) des lignes vides d'une question */
  export let blankLineHeight: number = 0

  /**
   * Injecte le HTML impérativement (plutôt qu'avec {@html}) puis rend
   * KaTeX et les blocs Scratch localement. Le DOM interne de l'unité est
   * ainsi entièrement hors du champ de la réconciliation de Svelte :
   * les mutations opérées par KaTeX ne peuvent pas la perturber.
   */
  function setHtml(
    node: HTMLElement,
    content: { html: string; svgZoom?: number; blankLineHeight: number },
  ) {
    const render = ({
      html,
      svgZoom,
      blankLineHeight,
    }: {
      html: string
      svgZoom?: number
      blankLineHeight: number
    }) => {
      node.innerHTML = html
      markBlankLines(node, blankLineHeight)
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
      update(
        newContent: {
          html: string
          svgZoom?: number
          blankLineHeight: number
        },
      ) {
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
   * Largeur réellement disponible pour un élément : celle du premier ancêtre
   * dont clientWidth est significatif (un ancêtre display:inline — ex.
   * .svgContainer — rapporte toujours 0 et doit être ignoré). Certains
   * énoncés (schémas associés deux par deux) placent leur contenu dans des
   * colonnes flottantes à moitié moins larges que l'unité entière : se baser
   * sur node.clientWidth laisserait alors passer un débordement.
   */
  function containerWidth(el: HTMLElement, fallback: number): number {
    let parent = el.parentElement
    while (parent != null) {
      if (parent.clientWidth > 0) return parent.clientWidth
      parent = parent.parentElement
    }
    return fallback
  }

  /** offsetWidth/offsetHeight ne sont pas fiables sur un <svg> racine (pas
   * un HTMLElement) : on retombe sur ses attributs width/height, posés en px
   * par mathalea2d, plutôt que getBoundingClientRect (sensible au zoom CSS
   * de l'aperçu). */
  function elementSize(el: HTMLElement): { width: number; height: number } {
    if (el instanceof SVGElement) {
      const width = Number.parseFloat(el.getAttribute('width') ?? '')
      const height = Number.parseFloat(el.getAttribute('height') ?? '')
      if (Number.isFinite(width) && Number.isFinite(height)) {
        return { width, height }
      }
      const rect = el.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }
    return {
      width: Math.max(el.offsetWidth, el.scrollWidth),
      height: el.offsetHeight,
    }
  }

  /**
   * Réduit (transform: scale) les blocs plus larges que leur conteneur —
   * tableaux, formules KaTeX en display ou inline, blocs Scratch, figures
   * mathalea2d — pour que rien ne dépasse en mode multi-colonnes. La hauteur
   * (et la largeur, pour les blocs flottants côte à côte) de mise en page
   * perdues par le transform (qui ne les affecte pas) sont compensées par des
   * marges négatives, pour que la mesure de pagination reste exacte. Le HTML
   * étant réinjecté brut à chaque rendu, la réduction ne se cumule jamais.
   * Pour mathalea2d, on scale .svgContainer en entier plutôt que le SVG :
   * selon les cas, mathalea2d y place le SVG seul, ou le SVG accompagné
   * d'étiquettes .divLatex (positionnées en px absolus, en frères ou dans un
   * wrapper commun) — scaler l'ancêtre commun les garde alignées dans tous
   * les cas, sans avoir à connaître sa structure interne exacte.
   */
  function fitWideContent(node: HTMLElement) {
    const nodeWidth = node.clientWidth
    if (nodeWidth <= 0) return
    for (const el of node.querySelectorAll<HTMLElement>(
      'table, .katex-display, .katex, .scratchblocks, .svgContainer',
    )) {
      // déjà réduit via un ancêtre (tableau imbriqué, formule dans un tableau)
      if (el.parentElement?.closest('[data-a4-fit]') != null) continue
      // transform n'a aucun effet sur les éléments display:inline (cas du
      // span.katex d'une formule inline, ou de .svgContainer, posé en
      // display:inline par mathalea2d) : il faut le rendre transformable
      // sans changer son flux (seul sur sa ligne dans tous les cas ciblés
      // ici), et ce avant de mesurer sa largeur (0 tant qu'il est inline).
      if (getComputedStyle(el).display === 'inline') {
        el.style.display = 'inline-block'
      }
      // Un ancêtre auto-dimensionné à son contenu (donc lui-même trop large)
      // peut rapporter un clientWidth non nul mais tout aussi débordant :
      // l'unité entière reste le plafond ultime.
      const available = Math.min(containerWidth(el, nodeWidth), nodeWidth)
      const { width, height } = elementSize(el)
      if (width <= available + 1) continue
      const ratio = available / width
      el.dataset.a4Fit = ''
      el.style.transform = `scale(${ratio})`
      el.style.transformOrigin = 'top left'
      el.style.marginBottom = `${-height * (1 - ratio)}px`
      // Le transform ne libère pas l'espace occupé dans le flux (float,
      // largeur de ligne...) : sans cette marge, un élément flottant à côté
      // (schémas associés deux par deux) continue de déborder même réduit.
      el.style.marginRight = `${-width * (1 - ratio)}px`
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
  use:setHtml={{ html: unit.html, svgZoom: unit.svgZoom, blankLineHeight }}
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
