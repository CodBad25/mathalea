<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { draggable } from '../../../lib/components/tbiPointer'
  import { tbiState, zoomWidgetBy } from '../../../lib/stores/tbiStore'

  interface Props {
    /** Sauvegarde de la position (localStorage), appelée en fin de geste */
    persistLayout: () => void
  }

  let { persistLayout }: Props = $props()

  let now = $state(Date.now())
  const interval = setInterval(() => {
    now = Date.now()
  }, 200)

  // Minuteur : temps restant calculé depuis un horodatage de fin
  // (robuste au throttling des onglets en arrière-plan)
  const DEFAULT_TIMER_MINUTES = 5
  let timerMinutes = $state(DEFAULT_TIMER_MINUTES)
  let timerRemainingMs = $state(DEFAULT_TIMER_MINUTES * 60_000)
  let timerEndAt: number | null = $state(null)

  // Chronomètre : temps écoulé accumulé + horodatage de départ
  let stopwatchElapsedMs = $state(0)
  let stopwatchStartAt: number | null = $state(null)

  let mode = $derived($tbiState.widget.mode)

  $effect(() => {
    if (timerEndAt !== null) {
      timerRemainingMs = Math.max(0, timerEndAt - now)
      if (timerRemainingMs === 0) timerEndAt = null
    }
  })
  let displayedStopwatchMs = $derived(
    stopwatchElapsedMs + (stopwatchStartAt !== null ? now - stopwatchStartAt : 0),
  )

  function setMode(newMode: 'clock' | 'timer' | 'stopwatch') {
    tbiState.update((state) => {
      state.widget.mode = newMode
      return state
    })
  }

  function zoom(delta: number) {
    zoomWidgetBy(delta)
    persistLayout()
  }

  function close() {
    tbiState.update((state) => {
      state.widget.visible = false
      return state
    })
  }

  /**
   * Déplacement : pendant le geste, seul le style du widget est modifié
   * (directement dans le DOM, au rythme de l'écran) ; le store n'est mis
   * à jour qu'au relâchement — même pattern que le mode libre, pour ne
   * pas re-rendre toutes les cartes à chaque pointermove.
   */
  let widgetEl: HTMLElement
  let drag: { x: number; y: number; raf: number | null } | null = null

  function beginDrag() {
    const widget = get(tbiState).widget
    drag = { x: widget.x, y: widget.y, raf: null }
  }

  function onDragMove(dx: number, dy: number) {
    if (!drag) return
    drag.x = Math.max(0, drag.x + dx)
    drag.y = Math.max(0, drag.y + dy)
    if (drag.raf === null) {
      drag.raf = requestAnimationFrame(() => {
        if (!drag) return
        drag.raf = null
        widgetEl.style.left = `${drag.x}px`
        widgetEl.style.top = `${drag.y}px`
      })
    }
  }

  function commitDrag() {
    if (!drag) return
    if (drag.raf !== null) cancelAnimationFrame(drag.raf)
    const { x, y } = drag
    drag = null
    widgetEl.style.left = `${x}px`
    widgetEl.style.top = `${y}px`
    tbiState.update((state) => {
      state.widget.x = x
      state.widget.y = y
      return state
    })
    persistLayout()
  }

  function formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  function startPauseTimer() {
    if (timerEndAt !== null) {
      // pause
      timerRemainingMs = Math.max(0, timerEndAt - Date.now())
      timerEndAt = null
    } else if (timerRemainingMs > 0) {
      timerEndAt = Date.now() + timerRemainingMs
    }
  }

  function resetTimer() {
    timerEndAt = null
    timerRemainingMs = timerMinutes * 60_000
  }

  function onTimerMinutesChange() {
    if (!Number.isFinite(timerMinutes) || timerMinutes < 1) timerMinutes = 1
    if (timerMinutes > 120) timerMinutes = 120
    resetTimer()
  }

  function startPauseStopwatch() {
    if (stopwatchStartAt !== null) {
      stopwatchElapsedMs += Date.now() - stopwatchStartAt
      stopwatchStartAt = null
    } else {
      stopwatchStartAt = Date.now()
    }
  }

  function resetStopwatch() {
    stopwatchStartAt = null
    stopwatchElapsedMs = 0
  }

  onMount(() => {
    // position par défaut : coin supérieur gauche
    tbiState.update((state) => {
      if (state.widget.x === 0 && state.widget.y === 0) {
        state.widget.x = 16
        state.widget.y = 16
      }
      return state
    })
  })

  onDestroy(() => {
    clearInterval(interval)
  })

  const smallButtonClass =
    'flex items-center justify-center w-7 h-7 rounded-full ' +
    'text-coopmaths-canvas dark:text-coopmathsdark-canvas ' +
    'bg-coopmaths-action hover:bg-coopmaths-action-darkest ' +
    'dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-darkest'
</script>

<div
  bind:this={widgetEl}
  class="fixed z-40 w-56 rounded-xl shadow-xl overflow-hidden bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest print-hidden"
  style="left: {$tbiState.widget.x}px; top: {$tbiState.widget.y}px; transform: scale({$tbiState
    .widget.zoom}); transform-origin: top left"
>
  <div
    class="flex flex-row items-center justify-between h-8 px-2 select-none bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
    title="Déplacer le widget"
    use:draggable={{ onStart: beginDrag, onMove: onDragMove, onEnd: commitDrag }}
  >
    <i class="bx bx-move text-sm"></i>
    <div class="flex flex-row items-center gap-1">
      <button
        type="button"
        class="px-1.5 py-0.5 rounded text-xs {mode === 'clock'
          ? 'bg-coopmaths-canvas/30 font-bold'
          : 'opacity-70 hover:opacity-100'}"
        title="Horloge"
        onclick={() => setMode('clock')}
      >
        <i class="bx bx-time-five"></i>
      </button>
      <button
        type="button"
        class="px-1.5 py-0.5 rounded text-xs {mode === 'timer'
          ? 'bg-coopmaths-canvas/30 font-bold'
          : 'opacity-70 hover:opacity-100'}"
        title="Minuteur"
        onclick={() => setMode('timer')}
      >
        <i class="bx bx-hourglass"></i>
      </button>
      <button
        type="button"
        class="px-1.5 py-0.5 rounded text-xs {mode === 'stopwatch'
          ? 'bg-coopmaths-canvas/30 font-bold'
          : 'opacity-70 hover:opacity-100'}"
        title="Chronomètre"
        onclick={() => setMode('stopwatch')}
      >
        <i class="bx bx-stopwatch"></i>
      </button>
    </div>
    <div class="flex flex-row items-center gap-1">
      <button
        type="button"
        class="opacity-70 hover:opacity-100"
        title="Réduire le widget"
        aria-label="Réduire le widget"
        onclick={() => zoom(-0.1)}
      >
        <i class="bx bx-zoom-out"></i>
      </button>
      <button
        type="button"
        class="opacity-70 hover:opacity-100"
        title="Agrandir le widget"
        aria-label="Agrandir le widget"
        onclick={() => zoom(0.1)}
      >
        <i class="bx bx-zoom-in"></i>
      </button>
      <button
        type="button"
        title="Fermer"
        aria-label="Fermer le widget"
        onclick={close}
      >
        <i class="bx bx-x text-lg"></i>
      </button>
    </div>
  </div>
  <div
    class="flex flex-col items-center gap-2 p-3 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
  >
    {#if mode === 'clock'}
      <span class="text-4xl font-mono font-bold tabular-nums">
        {new Date(now).toLocaleTimeString('fr-FR')}
      </span>
    {:else if mode === 'timer'}
      <span
        class="text-4xl font-mono font-bold tabular-nums {timerRemainingMs === 0
          ? 'text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark animate-pulse'
          : ''}"
      >
        {formatMs(timerRemainingMs)}
      </span>
      <div class="flex flex-row items-center gap-2">
        <label class="flex items-center gap-1 text-xs">
          <input
            type="number"
            min="1"
            max="120"
            class="w-14 rounded border border-coopmaths-action dark:border-coopmathsdark-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas px-1 py-0.5 text-right"
            bind:value={timerMinutes}
            onchange={onTimerMinutesChange}
          />
          min
        </label>
        <button
          type="button"
          class={smallButtonClass}
          title={timerEndAt !== null ? 'Pause' : 'Démarrer'}
          aria-label={timerEndAt !== null ? 'Pause' : 'Démarrer'}
          onclick={startPauseTimer}
        >
          <i class="bx {timerEndAt !== null ? 'bx-pause' : 'bx-play'}"></i>
        </button>
        <button
          type="button"
          class={smallButtonClass}
          title="Réinitialiser"
          aria-label="Réinitialiser"
          onclick={resetTimer}
        >
          <i class="bx bx-reset"></i>
        </button>
      </div>
    {:else}
      <span class="text-4xl font-mono font-bold tabular-nums">
        {formatMs(displayedStopwatchMs)}
      </span>
      <div class="flex flex-row items-center gap-2">
        <button
          type="button"
          class={smallButtonClass}
          title={stopwatchStartAt !== null ? 'Pause' : 'Démarrer'}
          aria-label={stopwatchStartAt !== null ? 'Pause' : 'Démarrer'}
          onclick={startPauseStopwatch}
        >
          <i class="bx {stopwatchStartAt !== null ? 'bx-pause' : 'bx-play'}"></i>
        </button>
        <button
          type="button"
          class={smallButtonClass}
          title="Réinitialiser"
          aria-label="Réinitialiser"
          onclick={resetStopwatch}
        >
          <i class="bx bx-reset"></i>
        </button>
      </div>
    {/if}
  </div>
</div>
