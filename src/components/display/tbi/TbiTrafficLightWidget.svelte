<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { draggable, resizable } from '../../../lib/components/tbiPointer'
  import {
    setTrafficLightActive,
    tbiState,
    TBI_TRAFFIC_LIGHT_MAX_H,
    TBI_TRAFFIC_LIGHT_MAX_W,
    TBI_TRAFFIC_LIGHT_MIN_H,
    TBI_TRAFFIC_LIGHT_MIN_W,
    type TbiTrafficLightColor,
  } from '../../../lib/stores/tbiStore'

  interface Props {
    /** Sauvegarde de la position/taille (localStorage), appelée en fin de geste */
    persistLayout: () => void
  }

  let { persistLayout }: Props = $props()

  const colors: TbiTrafficLightColor[] = ['red', 'orange', 'green']

  const lightColor: Record<TbiTrafficLightColor, string> = {
    red: '#ef4444',
    orange: '#f59e0b',
    green: '#22c55e',
  }

  const lightLabel: Record<TbiTrafficLightColor, string> = {
    red: 'Rouge',
    orange: 'Orange',
    green: 'Vert',
  }

  let active = $derived($tbiState.trafficLight.active)

  function setActive(color: TbiTrafficLightColor) {
    setTrafficLightActive(color)
  }

  function close() {
    tbiState.update((state) => {
      state.trafficLight.visible = false
      return state
    })
  }

  /**
   * Diamètre (px) des feux, recalculé à chaque redimensionnement du widget
   * pour occuper l'espace disponible tout en restant toujours parfaitement
   * ronds (contrairement à un simple `aspect-square` en flexbox, qui peut
   * être écrasé par la contrainte de largeur et donner un ovale).
   */
  let slotsEl: HTMLElement
  let diameter = $state(40)
  let resizeObserver: ResizeObserver | undefined

  function recomputeDiameter() {
    if (!slotsEl) return
    const rowGap = parseFloat(getComputedStyle(slotsEl).rowGap || '0') || 0
    const cellHeight =
      (slotsEl.clientHeight - rowGap * (colors.length - 1)) / colors.length
    diameter = Math.max(0, Math.floor(Math.min(slotsEl.clientWidth, cellHeight)) - 6)
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(recomputeDiameter)
    resizeObserver.observe(slotsEl)
    recomputeDiameter()
  })

  onDestroy(() => {
    resizeObserver?.disconnect()
  })

  function lightStyle(color: TbiTrafficLightColor): string {
    const c = lightColor[color]
    const base = `width: ${diameter}px; height: ${diameter}px; border-radius: 9999px;`
    if (active === color) {
      const glow = Math.round(diameter * 0.45)
      return (
        base +
        `background: radial-gradient(circle at 33% 28%, ${c}f2, ${c} 68%);` +
        `box-shadow: 0 0 ${glow}px ${c}b3, 0 0 ${Math.round(diameter * 0.15)}px ${c} inset;` +
        `border: 2px solid rgba(255, 255, 255, 0.55);`
      )
    }
    return base + `background: ${c}26; border: 1px solid ${c}59;`
  }

  function clampW(w: number): number {
    return Math.min(TBI_TRAFFIC_LIGHT_MAX_W, Math.max(TBI_TRAFFIC_LIGHT_MIN_W, w))
  }

  function clampH(h: number): number {
    return Math.min(TBI_TRAFFIC_LIGHT_MAX_H, Math.max(TBI_TRAFFIC_LIGHT_MIN_H, h))
  }

  /**
   * Déplacement et redimensionnement : pendant le geste, seul le style du
   * widget est modifié (directement dans le DOM, au rythme de l'écran) ; le
   * store n'est mis à jour qu'au relâchement — même pattern que le widget
   * horloge et le mode libre.
   */
  let widgetEl: HTMLElement
  type Corner = 'nw' | 'ne' | 'sw' | 'se'
  let gesture: {
    x: number
    y: number
    w: number
    h: number
    corner: Corner | null
    raf: number | null
  } | null = null

  function applyGestureStyle() {
    if (!gesture) return
    gesture.raf = null
    widgetEl.style.left = `${gesture.x}px`
    widgetEl.style.top = `${gesture.y}px`
    widgetEl.style.width = `${gesture.w}px`
    widgetEl.style.height = `${gesture.h}px`
  }

  function scheduleApply() {
    if (!gesture || gesture.raf !== null) return
    gesture.raf = requestAnimationFrame(applyGestureStyle)
  }

  function beginDrag() {
    const t = get(tbiState).trafficLight
    gesture = { x: t.x, y: t.y, w: t.w, h: t.h, corner: null, raf: null }
  }

  function onDragMove(dx: number, dy: number) {
    if (!gesture) return
    gesture.x = Math.max(0, gesture.x + dx)
    gesture.y = Math.max(0, gesture.y + dy)
    scheduleApply()
  }

  function beginResize(corner: Corner) {
    const t = get(tbiState).trafficLight
    gesture = { x: t.x, y: t.y, w: t.w, h: t.h, corner, raf: null }
  }

  /**
   * Redimensionnement classique par poignée d'angle : le coin opposé à la
   * poignée saisie reste fixe, les deux autres coordonnées (position et
   * taille) sont recalculées à partir de lui à chaque déplacement. Le
   * diamètre des feux (recomputeDiameter, via ResizeObserver) suit le
   * redimensionnement en direct, à chaque frame.
   */
  function onResizeMove(dx: number, dy: number) {
    if (!gesture || !gesture.corner) return
    const anchorRight = gesture.x + gesture.w
    const anchorBottom = gesture.y + gesture.h
    const growsRight = gesture.corner === 'ne' || gesture.corner === 'se'
    const growsBottom = gesture.corner === 'sw' || gesture.corner === 'se'

    if (growsRight) {
      gesture.w = clampW(gesture.w + dx)
    } else {
      gesture.w = clampW(gesture.w - dx)
      gesture.x = anchorRight - gesture.w
    }

    if (growsBottom) {
      gesture.h = clampH(gesture.h + dy)
    } else {
      gesture.h = clampH(gesture.h - dy)
      gesture.y = anchorBottom - gesture.h
    }

    scheduleApply()
  }

  function commitGesture() {
    if (!gesture) return
    if (gesture.raf !== null) cancelAnimationFrame(gesture.raf)
    applyGestureStyle()
    const { x, y, w, h } = gesture
    gesture = null
    tbiState.update((state) => {
      state.trafficLight.x = x
      state.trafficLight.y = y
      state.trafficLight.w = w
      state.trafficLight.h = h
      return state
    })
    persistLayout()
  }

  onMount(() => {
    // position par défaut : à droite du widget horloge, pour ne pas le recouvrir
    tbiState.update((state) => {
      if (state.trafficLight.x === 0 && state.trafficLight.y === 0) {
        state.trafficLight.x = 300
        state.trafficLight.y = 16
      }
      return state
    })
  })

  /**
   * Poignées de redimensionnement invisibles : seule la zone de préhension
   * (élargie pour rester facile à saisir) change le curseur, sans aucun
   * habillage visuel propre. Un simple marqueur d'angle (coin en pointillés,
   * inerte) indique où saisir.
   */
  const handleClass = 'absolute w-5 h-5 bg-transparent'
  const markerClass =
    'absolute w-2.5 h-2.5 pointer-events-none border-white/80 drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]'
</script>

<div
  bind:this={widgetEl}
  class="fixed z-40 flex flex-col rounded-[1.75rem] shadow-xl overflow-visible bg-neutral-900 border border-black/40 print-hidden"
  style="left: {$tbiState.trafficLight.x}px; top: {$tbiState.trafficLight.y}px; width: {$tbiState
    .trafficLight.w}px; height: {$tbiState.trafficLight.h}px; box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.35)"
>
  <div
    class="flex flex-row items-center justify-between h-7 px-2 shrink-0 select-none rounded-t-[1.75rem] bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
    title="Déplacer le widget"
    use:draggable={{ onStart: beginDrag, onMove: onDragMove, onEnd: commitGesture }}
  >
    <i class="bx bx-move text-sm"></i>
    <span class="text-xs font-semibold truncate">Feu tricolore</span>
    <button
      type="button"
      title="Fermer"
      aria-label="Fermer le widget"
      onclick={close}
    >
      <i class="bx bx-x text-lg"></i>
    </button>
  </div>
  <div
    bind:this={slotsEl}
    class="flex-1 min-h-0 flex flex-col items-stretch justify-around gap-1 p-2 rounded-b-[1.75rem] overflow-hidden"
  >
    {#each colors as color (color)}
      <div class="flex-1 min-h-0 flex items-center justify-center">
        <button
          type="button"
          class="relative shrink-0 transition-[background,box-shadow] duration-150"
          style={lightStyle(color)}
          title={lightLabel[color]}
          aria-label="Feu {lightLabel[color]}"
          aria-pressed={active === color}
          onclick={() => setActive(color)}
        ></button>
      </div>
    {/each}
  </div>

  <div
    class="{handleClass} -top-2 -left-2"
    title="Redimensionner"
    use:resizable={{
      onStart: () => beginResize('nw'),
      onMove: onResizeMove,
      onEnd: commitGesture,
      cursor: 'nwse-resize',
    }}
  >
    <span class="{markerClass} top-1 left-1 border-t-2 border-l-2"></span>
  </div>
  <div
    class="{handleClass} -top-2 -right-2"
    title="Redimensionner"
    use:resizable={{
      onStart: () => beginResize('ne'),
      onMove: onResizeMove,
      onEnd: commitGesture,
      cursor: 'nesw-resize',
    }}
  >
    <span class="{markerClass} top-1 right-1 border-t-2 border-r-2"></span>
  </div>
  <div
    class="{handleClass} -bottom-2 -left-2"
    title="Redimensionner"
    use:resizable={{
      onStart: () => beginResize('sw'),
      onMove: onResizeMove,
      onEnd: commitGesture,
      cursor: 'nesw-resize',
    }}
  >
    <span class="{markerClass} bottom-1 left-1 border-b-2 border-l-2"></span>
  </div>
  <div
    class="{handleClass} -bottom-2 -right-2"
    title="Redimensionner"
    use:resizable={{
      onStart: () => beginResize('se'),
      onMove: onResizeMove,
      onEnd: commitGesture,
      cursor: 'nwse-resize',
    }}
  >
    <span class="{markerClass} bottom-1 right-1 border-b-2 border-r-2"></span>
  </div>
</div>
