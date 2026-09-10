<script lang="ts">
  import { get } from 'svelte/store'
  import { draggable, resizable } from '../../../../lib/components/tbiPointer'
  import {
    TBI_MAX_CARD_WIDTH,
    TBI_MIN_CARD_WIDTH,
    tbiState,
    toggleTbiCardCollapsed,
  } from '../../../../lib/stores/tbiStore'
  import TbiCardHost from '../TbiCardHost.svelte'
  import type { TbiItem } from '../tbiTypes'

  interface Props {
    items: TbiItem[]
    /** Sauvegarde des positions (localStorage), appelée en fin de geste */
    persistLayout: () => void
    /** Menu « Déplacer vers un onglet » (disposition libre d'un onglet) */
    showMoveToTab?: boolean
    tabsCount?: number
    currentTab?: number
    /** Demande de suppression, traitée par la vue TBI (bouton poubelle du bandeau) */
    onDelete?: (paramsIndex: number) => void
  }

  let {
    items,
    persistLayout,
    showMoveToTab = false,
    tabsCount = 0,
    currentTab = 0,
    onDelete,
  }: Props = $props()

  /**
   * En deçà de ce déplacement cumulé (px), le geste sur le bandeau est
   * interprété comme un clic : il replie / déplie l'exercice au lieu de le
   * déplacer.
   */
  const TAP_THRESHOLD_PX = 5

  /** Carte au premier plan (la dernière manipulée) */
  let frontIndex: number | null = $state(null)

  /**
   * Geste en cours. Pendant le geste, seul le style du shell est modifié,
   * directement dans le DOM et au rythme de l'écran (requestAnimationFrame) :
   * aucune écriture dans le store, donc aucun re-render Svelte et aucun
   * recalcul de la hauteur du canvas par pointermove. Le redimensionnement
   * ne touche que la largeur du cadre (pas de re-typeset KaTeX : le zoom du
   * contenu est indépendant et ne change pas pendant ce geste). Le store
   * n'est mis à jour qu'au relâchement (commit), en une seule notification.
   */
  let gesture: {
    paramsIndex: number
    shell: HTMLElement
    x: number
    y: number
    w: number
    raf: number | null
    /** 'drag' : bandeau (un clic replie l'exercice) ; 'resize' : poignée d'angle */
    kind: 'drag' | 'resize'
    /** Déplacement cumulé du pointeur depuis le début du geste (px) */
    dist: number
  } | null = null

  function beginGesture(
    paramsIndex: number,
    handle: HTMLElement,
    kind: 'drag' | 'resize',
  ) {
    const shell = handle.closest('.tbi-free-shell')
    const card = get(tbiState).cards[paramsIndex]
    if (!(shell instanceof HTMLElement) || !card) return
    frontIndex = paramsIndex
    gesture = {
      paramsIndex,
      shell,
      x: card.x,
      y: card.y,
      w: card.w,
      raf: null,
      kind,
      dist: 0,
    }
  }

  function applyGestureStyle() {
    if (!gesture) return
    gesture.raf = null
    gesture.shell.style.left = `${gesture.x}px`
    gesture.shell.style.top = `${gesture.y}px`
    gesture.shell.style.width = `${gesture.w}px`
  }

  function scheduleApply() {
    if (!gesture || gesture.raf !== null) return
    gesture.raf = requestAnimationFrame(applyGestureStyle)
  }

  function onDragMove(dx: number, dy: number) {
    if (!gesture) return
    gesture.dist += Math.abs(dx) + Math.abs(dy)
    gesture.x = Math.max(0, gesture.x + dx)
    gesture.y = Math.max(0, gesture.y + dy)
    scheduleApply()
  }

  function onResizeMove(dw: number) {
    if (!gesture) return
    gesture.dist += Math.abs(dw)
    gesture.w = Math.min(
      TBI_MAX_CARD_WIDTH,
      Math.max(TBI_MIN_CARD_WIDTH, gesture.w + dw),
    )
    scheduleApply()
  }

  function commitGesture() {
    if (!gesture) return
    if (gesture.raf !== null) cancelAnimationFrame(gesture.raf)
    // Geste sur le bandeau quasi immobile : c'est un clic, on replie / déplie
    // l'exercice plutôt que de valider une nouvelle position.
    if (gesture.kind === 'drag' && gesture.dist < TAP_THRESHOLD_PX) {
      const { paramsIndex } = gesture
      gesture = null
      toggleTbiCardCollapsed(paramsIndex)
      return
    }
    applyGestureStyle()
    const { paramsIndex, x, y, w } = gesture
    gesture = null
    tbiState.update((state) => {
      const card = state.cards[paramsIndex]
      if (card) {
        card.x = x
        card.y = y
        card.w = w
      }
      return state
    })
    persistLayout()
  }

  // Repli de chaque exercice, dérivé au niveau du composant (et non via un
  // {@const} imbriqué) pour que le basculement de card.collapsed — mutation
  // en place dans le store — déclenche bien le re-rendu.
  let collapsedFlags = $derived(
    items.map((item) => $tbiState.cards[item.paramsIndex]?.collapsed ?? false),
  )

  let canvasHeight = $derived(
    Math.max(
      600,
      ...items.map((item) => {
        const card = $tbiState.cards[item.paramsIndex]
        return card ? card.y + 400 : 0
      }),
    ) + 200,
  )
</script>

<div class="relative w-full" style="min-height: {canvasHeight}px">
  {#each items as item, i (item.key)}
    {@const card = $tbiState.cards[item.paramsIndex]}
    {#if card}
      {@const collapsed = collapsedFlags[i]}
      <div
        class="tbi-free-shell absolute flex flex-col rounded-lg shadow-lg {frontIndex ===
        item.paramsIndex
          ? 'z-10'
          : 'z-0'}"
        style="left: {card.x}px; top: {card.y}px; width: {card.w}px"
      >
        <div
          class="flex flex-row items-center gap-2 h-10 px-3 select-none bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas {collapsed
            ? 'rounded-lg'
            : 'rounded-t-lg'}"
          style="touch-action: none; user-select: none"
          title="Glisser pour déplacer, cliquer pour replier/déplier"
          use:draggable={{
            onStart: (handle) => beginGesture(item.paramsIndex, handle, 'drag'),
            onMove: onDragMove,
            onEnd: commitGesture,
          }}
        >
          <button
            type="button"
            class="flex items-center justify-center -ml-1 text-lg"
            title={collapsed ? "Déplier l'exercice" : "Replier l'exercice"}
            aria-label={collapsed ? "Déplier l'exercice" : "Replier l'exercice"}
            onclick={() => toggleTbiCardCollapsed(item.paramsIndex)}
          >
            <i class="bx {collapsed ? 'bx-chevron-right' : 'bx-chevron-down'}"></i>
          </button>
          <span class="flex-1 text-sm font-semibold"
            >Exercice {item.paramsIndex + 1}</span
          >
          {#if onDelete}
            <button
              type="button"
              class="flex items-center justify-center text-lg opacity-80 hover:opacity-100"
              title="Supprimer l'exercice"
              aria-label="Supprimer l'exercice"
              onclick={() => onDelete?.(item.paramsIndex)}
            >
              <i class="bx bx-trash"></i>
            </button>
          {/if}
        </div>
        {#if !collapsed}
          <TbiCardHost {item} {showMoveToTab} {tabsCount} {currentTab} />
          <div
            class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas opacity-70 hover:opacity-100 shadow-md"
            style="touch-action: none; user-select: none"
            title="Redimensionner le cadre de l'exercice"
            use:resizable={{
              onStart: (handle) =>
                beginGesture(item.paramsIndex, handle, 'resize'),
              onMove: onResizeMove,
              onEnd: commitGesture,
            }}
          >
            <i class="bx bx-expand-alt text-sm"></i>
          </div>
        {/if}
      </div>
    {/if}
  {/each}
</div>
