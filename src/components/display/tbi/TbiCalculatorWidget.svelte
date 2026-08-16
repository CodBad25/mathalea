<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { draggable, resizable } from '../../../lib/components/tbiPointer'
  import {
    calculatorHeightForWidth,
    calculatorStateOf,
    tbiState,
    TBI_CALCULATOR_ASPECT,
    TBI_CALCULATOR_MAX_W,
    TBI_CALCULATOR_MIN_W,
    type TbiCalculatorKind,
  } from '../../../lib/stores/tbiStore'

  interface Props {
    kind: TbiCalculatorKind
    /** Sauvegarde de la position/taille (localStorage), appelée en fin de geste */
    persistLayout: () => void
  }

  let { kind, persistLayout }: Props = $props()

  /**
   * Les émulateurs NumWorks (fichiers statiques dans public/calculators/)
   * sont des pages autonomes (WASM) dont la barre d'actions (capture
   * d'écran, plein écran, partage) a été masquée par CSS à la source : ce
   * widget n'expose que l'écran et le clavier de la calculatrice.
   */
  const config: Record<TbiCalculatorKind, { title: string; src: string; defaultX: number }> = {
    college: {
      title: 'Calculatrice collège',
      src: `${import.meta.env.BASE_URL}calculators/numworks-scientific.html`,
      defaultX: 500,
    },
    lycee: {
      title: 'Calculatrice lycée',
      src: `${import.meta.env.BASE_URL}calculators/numworks-graphing.html`,
      defaultX: 780,
    },
  }

  // copie superficielle : calculatorStateOf renvoie la même référence mutée
  // en place, ce qui empêcherait $derived de détecter un changement
  let calc = $derived({ ...calculatorStateOf($tbiState, kind) })

  /**
   * L'iframe ne déclenche pas d'événement d'erreur exploitable en cas de
   * 404 : certains serveurs (dont le serveur de dev Vite) répondent 200 en
   * servant index.html à la place du fichier manquant. On vérifie donc le
   * contenu de la réponse plutôt que son seul statut HTTP.
   */
  let fileAvailable: boolean | null = $state(null)

  onMount(async () => {
    try {
      const response = await fetch(config[kind].src)
      const text = response.ok ? await response.text() : ''
      fileAvailable = response.ok && !text.includes('id="appMathalea"')
    } catch {
      fileAvailable = false
    }
  })

  function close() {
    tbiState.update((state) => {
      calculatorStateOf(state, kind).visible = false
      return state
    })
  }

  let aspect = $derived(TBI_CALCULATOR_ASPECT[kind])

  function clampW(w: number): number {
    return Math.min(TBI_CALCULATOR_MAX_W, Math.max(TBI_CALCULATOR_MIN_W, w))
  }

  /**
   * Déplacement et redimensionnement : pendant le geste, seul le style du
   * widget est modifié (directement dans le DOM, au rythme de l'écran) ; le
   * store n'est mis à jour qu'au relâchement — même pattern que le widget
   * horloge et le feu tricolore.
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
    const c = calculatorStateOf(get(tbiState), kind)
    gesture = { x: c.x, y: c.y, w: c.w, h: c.h, corner: null, raf: null }
  }

  function onDragMove(dx: number, dy: number) {
    if (!gesture) return
    gesture.x = Math.max(0, gesture.x + dx)
    gesture.y = Math.max(0, gesture.y + dy)
    scheduleApply()
  }

  function beginResize(corner: Corner) {
    const c = calculatorStateOf(get(tbiState), kind)
    gesture = { x: c.x, y: c.y, w: c.w, h: c.h, corner, raf: null }
  }

  /**
   * Redimensionnement par poignée d'angle, ratio verrouillé sur celui de
   * l'image de la calculatrice (aucun fond ne doit dépasser autour d'elle) :
   * le coin opposé à la poignée saisie reste fixe, la largeur combine les
   * deux axes du geste (déplacement diagonal naturel) et la hauteur en est
   * toujours dérivée via `aspect`.
   */
  function onResizeMove(dx: number, dy: number) {
    if (!gesture || !gesture.corner) return
    const anchorRight = gesture.x + gesture.w
    const anchorBottom = gesture.y + gesture.h
    const growsRight = gesture.corner === 'ne' || gesture.corner === 'se'
    const growsBottom = gesture.corner === 'sw' || gesture.corner === 'se'

    const dxSigned = growsRight ? dx : -dx
    const dySigned = growsBottom ? dy : -dy
    const deltaW = (dxSigned + dySigned * aspect) / 2

    gesture.w = clampW(gesture.w + deltaW)
    gesture.h = calculatorHeightForWidth(kind, gesture.w)

    if (!growsRight) gesture.x = anchorRight - gesture.w
    if (!growsBottom) gesture.y = anchorBottom - gesture.h

    scheduleApply()
  }

  function commitGesture() {
    if (!gesture) return
    if (gesture.raf !== null) cancelAnimationFrame(gesture.raf)
    applyGestureStyle()
    const { x, y, w, h } = gesture
    gesture = null
    tbiState.update((state) => {
      const c = calculatorStateOf(state, kind)
      c.x = x
      c.y = y
      c.w = w
      c.h = h
      return state
    })
    persistLayout()
  }

  onMount(() => {
    // position par défaut : en cascade à droite des autres widgets
    tbiState.update((state) => {
      const c = calculatorStateOf(state, kind)
      if (c.x === 0 && c.y === 0) {
        c.x = config[kind].defaultX
        c.y = 16
      }
      return state
    })
  })

  const handleClass = 'absolute w-5 h-5 bg-transparent'
  const markerClass =
    'absolute w-2.5 h-2.5 pointer-events-none border-white/80 drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]'
</script>

<div
  bind:this={widgetEl}
  class="fixed z-40 flex flex-col rounded-xl shadow-xl overflow-hidden bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest print-hidden"
  style="left: {calc.x}px; top: {calc.y}px; width: {calc.w}px; height: {calc.h}px;"
>
  <div
    class="flex flex-row items-center justify-between h-8 px-2 shrink-0 select-none bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
    title="Déplacer le widget"
    use:draggable={{ onStart: beginDrag, onMove: onDragMove, onEnd: commitGesture }}
  >
    <i class="bx bx-calculator text-sm"></i>
    <span class="text-xs font-semibold truncate">{config[kind].title}</span>
    <button
      type="button"
      title="Fermer"
      aria-label="Fermer le widget"
      onclick={close}
    >
      <i class="bx bx-x text-lg"></i>
    </button>
  </div>
  <div class="flex-1 min-h-0">
    {#if fileAvailable === false}
      <div
        class="w-full h-full flex items-center justify-center text-center p-4 text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus"
      >
        Fichier manquant pour la calculatrice
      </div>
    {:else}
      <iframe
        src={config[kind].src}
        title={config[kind].title}
        class="w-full h-full border-0 block"
      ></iframe>
    {/if}
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
