<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { mathaleaGoToView } from '../../../lib/mathaleaUtils'
  import {
    balanceColumnBreaks,
    tbiState,
    zoomAllCardsBy,
    type TbiMode,
  } from '../../../lib/stores/tbiStore'

  const modes: { value: TbiMode; label: string; icon: string }[] = [
    { value: 'columns', label: 'Colonnes', icon: 'bx-columns' },
    { value: 'free', label: 'Placement libre', icon: 'bx-move' },
    { value: 'tabs', label: 'Onglets', icon: 'bx-folder' },
  ]

  function setMode(mode: TbiMode) {
    tbiState.update((state) => ({ ...state, mode }))
  }

  function setNbColumns(nbColumns: number) {
    nbColumns = Math.min(4, Math.max(1, nbColumns))
    tbiState.update((state) => ({ ...state, nbColumns }))
    const cardsCount = get(tbiState).cards.length
    balanceColumnBreaks(
      Array.from({ length: cardsCount }, (_, i) => i),
      nbColumns,
    )
  }

  function newDataForAll() {
    document.dispatchEvent(new window.Event('newDataForAll', { bubbles: true }))
  }

  function toggleWidget() {
    tbiState.update((state) => {
      state.widget.visible = !state.widget.visible
      return state
    })
  }

  function toggleTrafficLight() {
    tbiState.update((state) => {
      state.trafficLight.visible = !state.trafficLight.visible
      return state
    })
  }

  /**
   * Contrôles masqués au repos (comme les commandes d'un lecteur vidéo) :
   * visibles pendant et juste après un mouvement de souris, invisibles
   * ensuite, pour ne pas encombrer la vidéoprojection en continu.
   */
  const HIDE_DELAY = 2000
  let controlsVisible = $state(true)
  let hideTimer: ReturnType<typeof setTimeout> | undefined

  function showControls() {
    controlsVisible = true
    if (hideTimer !== undefined) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      controlsVisible = false
    }, HIDE_DELAY)
  }

  onMount(() => {
    window.addEventListener('pointermove', showControls)
    window.addEventListener('pointerdown', showControls)
    showControls()
    ;(window as any).__debugShowControls = showControls
    ;(window as any).__debugToolbarMounted = true
  })

  onDestroy(() => {
    window.removeEventListener('pointermove', showControls)
    window.removeEventListener('pointerdown', showControls)
    if (hideTimer !== undefined) clearTimeout(hideTimer)
  })

  const autoHideClass = $derived(
    'transition-opacity duration-300 ' +
      (controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'),
  )
  $effect(() => {
    ;(window as any).__debugControlsVisible = controlsVisible
  })

  /** Bouton d'action ponctuelle (retour, nouvelles données) : toujours coloré */
  const actionButtonClass =
    'flex items-center justify-center w-10 h-10 rounded-full shadow-md ' +
    'text-coopmaths-canvas dark:text-coopmathsdark-canvas ' +
    'bg-coopmaths-action hover:bg-coopmaths-action-darkest ' +
    'dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-darkest'

  /** Bouton à 2 états (disposition active, widget affiché ou non) */
  function toggleButtonClass(active: boolean): string {
    const color = active
      ? 'bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas'
      : 'bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus hover:bg-coopmaths-canvas-darkest dark:hover:bg-coopmathsdark-canvas-darkest'
    return `flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-colors ${color}`
  }
</script>

<div
  class="fixed bottom-3 right-3 z-30 flex flex-col items-end gap-2 print-hidden {autoHideClass}"
>
  {#if $tbiState.mode === 'columns'}
    <div
      class="flex flex-row items-center gap-2 px-3 py-1.5 rounded-full shadow-md bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest text-coopmaths-corpus dark:text-coopmathsdark-corpus text-sm"
    >
      <span>Colonnes&nbsp;:</span>
      <button
        type="button"
        aria-label="Diminuer le nombre de colonnes"
        class="text-coopmaths-action dark:text-coopmathsdark-action"
        onclick={() => setNbColumns($tbiState.nbColumns - 1)}
      >
        <i class="bx bx-minus"></i>
      </button>
      <span class="font-bold">{$tbiState.nbColumns}</span>
      <button
        type="button"
        aria-label="Augmenter le nombre de colonnes"
        class="text-coopmaths-action dark:text-coopmathsdark-action"
        onclick={() => setNbColumns($tbiState.nbColumns + 1)}
      >
        <i class="bx bx-plus"></i>
      </button>
    </div>
  {/if}

  <div class="flex flex-row items-center gap-2">
    <button
      type="button"
      class={actionButtonClass}
      title="Retour à l'éditeur"
      aria-label="Retour à l'éditeur"
      onclick={() => mathaleaGoToView('')}
    >
      <i class="bx bx-arrow-back text-xl"></i>
    </button>
    <button
      type="button"
      class={actionButtonClass}
      title="Nouvelles données pour tous les exercices"
      aria-label="Nouvelles données pour tous les exercices"
      onclick={newDataForAll}
    >
      <i class="bx bx-refresh text-xl"></i>
    </button>
    {#each modes as mode (mode.value)}
      <button
        type="button"
        class={toggleButtonClass($tbiState.mode === mode.value)}
        aria-pressed={$tbiState.mode === mode.value}
        title={mode.label}
        aria-label={mode.label}
        onclick={() => setMode(mode.value)}
      >
        <i class="bx {mode.icon} text-xl"></i>
      </button>
    {/each}
    <button
      type="button"
      class={actionButtonClass}
      title="Réduire le zoom de tous les exercices"
      aria-label="Réduire le zoom de tous les exercices"
      onclick={() => zoomAllCardsBy(-0.1)}
    >
      <i class="bx bx-zoom-out text-xl"></i>
    </button>
    <button
      type="button"
      class={actionButtonClass}
      title="Augmenter le zoom de tous les exercices"
      aria-label="Augmenter le zoom de tous les exercices"
      onclick={() => zoomAllCardsBy(0.1)}
    >
      <i class="bx bx-zoom-in text-xl"></i>
    </button>
    <button
      type="button"
      class={toggleButtonClass($tbiState.widget.visible)}
      aria-pressed={$tbiState.widget.visible}
      title="Horloge, minuteur, chronomètre"
      aria-label="Horloge, minuteur, chronomètre"
      onclick={toggleWidget}
    >
      <i class="bx bx-time-five text-xl"></i>
    </button>
    <button
      type="button"
      class={toggleButtonClass($tbiState.trafficLight.visible)}
      aria-pressed={$tbiState.trafficLight.visible}
      title="Feu tricolore"
      aria-label="Feu tricolore"
      onclick={toggleTrafficLight}
    >
      <span class="flex flex-col items-center justify-center gap-0.5">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
      </span>
    </button>
  </div>
</div>
