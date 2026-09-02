<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import {
    activeTbiModalCard,
    TBI_CONTROLS_HIDE_DELAY,
    TBI_MAX_ZOOM,
    TBI_MIN_ZOOM,
    moveCardToTab,
    tbiState,
  } from '../../../lib/stores/tbiStore'
  import TbiCardActions from './TbiCardActions.svelte'
  import type { TbiStaticContent } from './tbiTypes'

  /**
   * Modes d'affichage de la correction d'une ressource statique. Sous-ensemble
   * de ceux d'un exercice rejouable : « après chaque question » et « minimale »
   * n'ont pas de sens pour une image scannée.
   */
  type StaticCorrectionMode = 'hidden' | 'below' | 'replace' | 'modal'

  interface Props {
    content: TbiStaticContent
    paramsIndex: number
    /** Menu « Déplacer vers un onglet » (mode onglets uniquement) */
    showMoveToTab?: boolean
    tabsCount?: number
    /** Indice compact de l'onglet courant (mode onglets) */
    currentTab?: number
    /** Flèches de réordonnancement (dispositions liste et colonnes) */
    showReorder?: boolean
    canMoveUp?: boolean
    canMoveDown?: boolean
    /** Bouton de saut de colonne (dispositions en colonnes) */
    showColumnBreak?: boolean
    /** Nombre maximal de sauts de colonne atteint : désactive l'ajout (pas le retrait) */
    columnBreakDisabled?: boolean
    /** Demande de réordonnancement, traitée par la vue TBI */
    onReorder?: (paramsIndex: number, delta: -1 | 1) => void
    /** Demande de suppression, traitée par la vue TBI */
    onDelete?: (paramsIndex: number) => void
  }

  let {
    content,
    paramsIndex,
    showMoveToTab = false,
    tabsCount = 0,
    currentTab = 0,
    showReorder = false,
    canMoveUp = false,
    canMoveDown = false,
    showColumnBreak = false,
    columnBreakDisabled = false,
    onReorder = () => {},
    onDelete = () => {},
  }: Props = $props()

  let correctionMode: StaticCorrectionMode = $state('hidden')
  /** Zoom propre à la correction en plein écran, indépendant du zoom de la carte */
  let modalZoom = $state(1.2)

  let zoom = $derived($tbiState.cards[paramsIndex]?.zoom ?? 1)
  let colBreakActive = $derived($tbiState.cards[paramsIndex]?.colBreak ?? false)

  let hasCorrection = $derived(content.pngCor.length > 0)

  const CORRECTION_OPTIONS: {
    value: Exclude<StaticCorrectionMode, 'hidden'>
    label: string
  }[] = [
    { value: 'below', label: "Sous l'énoncé" },
    { value: 'replace', label: "À la place de l'énoncé" },
    { value: 'modal', label: 'En plein écran' },
  ]

  function setCorrectionMode(mode: StaticCorrectionMode) {
    correctionMode = mode
    // une seule correction en plein écran à la fois sur l'ensemble des cartes
    activeTbiModalCard.set(mode === 'modal' ? paramsIndex : null)
    if (mode === 'modal') modalZoom = Math.max(zoom, 1.2)
  }

  function toggleCorrectionMode(mode: StaticCorrectionMode) {
    setCorrectionMode(correctionMode === mode ? 'hidden' : mode)
  }

  $effect(() => {
    if (correctionMode === 'modal' && $activeTbiModalCard !== paramsIndex) {
      correctionMode = 'hidden'
    }
  })

  function zoomBy(delta: number) {
    tbiState.update((state) => {
      const cardState = state.cards[paramsIndex]
      if (cardState) {
        cardState.zoom = Math.min(
          TBI_MAX_ZOOM,
          Math.max(TBI_MIN_ZOOM, cardState.zoom + delta),
        )
      }
      return state
    })
  }

  function zoomModalBy(delta: number) {
    modalZoom = Math.min(TBI_MAX_ZOOM, Math.max(TBI_MIN_ZOOM, modalZoom + delta))
  }

  function toggleColBreak() {
    if (!colBreakActive && columnBreakDisabled) return
    tbiState.update((state) => {
      const cardState = state.cards[paramsIndex]
      if (cardState) cardState.colBreak = !cardState.colBreak
      return state
    })
  }

  function openDialog(node: HTMLDialogElement) {
    node.showModal()
    return {
      destroy() {
        node.close()
      },
    }
  }

  /**
   * Barres d'outils masquées au repos, comme pour une carte d'exercice :
   * visibles pendant et juste après un mouvement de souris sur la carte.
   */
  let controlsVisible = $state(true)
  let hideControlsTimer: ReturnType<typeof setTimeout> | undefined

  function showControls() {
    controlsVisible = true
    if (hideControlsTimer !== undefined) clearTimeout(hideControlsTimer)
    hideControlsTimer = setTimeout(() => {
      controlsVisible = false
    }, TBI_CONTROLS_HIDE_DELAY)
  }

  function hideControls() {
    if (hideControlsTimer !== undefined) clearTimeout(hideControlsTimer)
    controlsVisible = false
  }

  onMount(() => {
    showControls()
  })

  onDestroy(() => {
    if (hideControlsTimer !== undefined) clearTimeout(hideControlsTimer)
  })

  let imageWidth = $derived(`min(100%, calc(850px * ${zoom}))`)
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
  class="relative w-full rounded-lg border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest bg-coopmaths-canvas dark:bg-coopmathsdark-canvas shadow-sm"
  onpointermove={showControls}
  onpointerdown={showControls}
  onpointerleave={hideControls}
>
  <!--
    Vue TBI : on n'affiche pas le titre de la ressource, seulement son numéro
    (1-based) dans un rectangle bleuMathalea placé dans une marge à gauche,
    vers le haut de la carte (comme pour une carte d'exercice).
  -->
  <div
    class="absolute left-0 top-3 z-10 min-w-9 rounded-r-md bg-coopmaths-struct px-3 py-1.5 text-center text-lg font-bold leading-none text-coopmaths-canvas shadow"
    aria-label="Exercice numéro {paramsIndex + 1}"
  >
    {paramsIndex + 1}
  </div>

  <div
    class="absolute top-1 right-1 z-20 flex flex-col items-end gap-1 transition-opacity duration-300 {controlsVisible
      ? 'opacity-100'
      : 'opacity-0 pointer-events-none'}"
  >
    <TbiCardActions
      settingsExist={false}
      newDataExists={false}
      showCols={false}
      {showMoveToTab}
      {tabsCount}
      {currentTab}
      {showReorder}
      {canMoveUp}
      {canMoveDown}
      {showColumnBreak}
      {columnBreakDisabled}
      {colBreakActive}
      onZoomIn={() => zoomBy(0.1)}
      onZoomOut={() => zoomBy(-0.1)}
      onMoveToTab={(tab) => moveCardToTab(paramsIndex, tab)}
      onMoveUp={() => onReorder(paramsIndex, -1)}
      onMoveDown={() => onReorder(paramsIndex, 1)}
      onToggleColBreak={toggleColBreak}
      onDelete={() => onDelete(paramsIndex)}
    />
    {#if hasCorrection}
      <div
        class="flex flex-col overflow-hidden rounded-md shadow-md text-xs min-w-[170px] bg-coopmaths-canvas/90 dark:bg-coopmathsdark-canvas/90"
      >
        <div
          class="px-2 py-1 font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct border-b border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest"
        >
          Correction
        </div>
        {#each CORRECTION_OPTIONS as option (option.value)}
          <button
            type="button"
            class="px-2 py-1 text-left whitespace-nowrap transition-colors {correctionMode ===
            option.value
              ? 'bg-coopmaths-action text-coopmaths-canvas dark:bg-coopmathsdark-action dark:text-coopmathsdark-canvas'
              : 'text-coopmaths-corpus dark:text-coopmathsdark-corpus hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark'}"
            aria-pressed={correctionMode === option.value}
            title="Correction {option.label.toLowerCase()}"
            onclick={() => toggleCorrectionMode(option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="pl-12 pr-3 pb-3 pt-3">
    {#if correctionMode !== 'replace'}
      {#each content.png as url, i (i)}
        <img
          src={url}
          class="mb-4 max-w-full"
          style="width: {imageWidth}"
          alt="énoncé"
        />
      {/each}
    {/if}

    {#if correctionMode === 'below' || correctionMode === 'replace'}
      <div
        class="relative border-l-coopmaths-struct dark:border-l-coopmathsdark-struct border-l-[3px] mt-6 mb-4 py-2 pl-4"
      >
        <div
          class="absolute flex flex-row py-[1.5px] px-3 rounded-t-md justify-center items-center -left-0.75 -top-3.75 bg-coopmaths-struct dark:bg-coopmathsdark-struct font-semibold text-xs text-coopmaths-canvas dark:text-coopmathsdark-canvas"
        >
          Correction
        </div>
        {#each content.pngCor as url, i (i)}
          <img
            src={url}
            class="mb-4 max-w-full"
            style="width: {imageWidth}"
            alt="correction"
          />
        {/each}
      </div>
    {/if}
  </div>

  {#if correctionMode === 'modal'}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <dialog
      class="m-auto w-[95vw] h-[90vh] max-w-none rounded-xl p-6 overflow-y-auto
        text-coopmaths-corpus dark:text-coopmathsdark-corpus
        bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
      use:openDialog
      onclick={(event) => {
        if (event.target === event.currentTarget) setCorrectionMode('hidden')
      }}
      onclose={() => setCorrectionMode('hidden')}
    >
      <div class="absolute top-3 right-3 flex flex-row items-center gap-2">
        <button
          type="button"
          class="flex items-center justify-center w-9 h-9 rounded-full text-coopmaths-canvas dark:text-coopmathsdark-canvas bg-coopmaths-action hover:bg-coopmaths-action-darkest dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-darkest"
          title="Réduire"
          aria-label="Réduire la correction"
          onclick={() => zoomModalBy(-0.1)}
        >
          <i class="bx bx-zoom-out"></i>
        </button>
        <button
          type="button"
          class="flex items-center justify-center w-9 h-9 rounded-full text-coopmaths-canvas dark:text-coopmathsdark-canvas bg-coopmaths-action hover:bg-coopmaths-action-darkest dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-darkest"
          title="Agrandir"
          aria-label="Agrandir la correction"
          onclick={() => zoomModalBy(0.1)}
        >
          <i class="bx bx-zoom-in"></i>
        </button>
        <button
          type="button"
          class="text-coopmaths-action hover:text-coopmaths-action-darkest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-darkest"
          aria-label="Fermer la correction"
          onclick={() => setCorrectionMode('hidden')}
        >
          <i class="bx bx-x text-3xl"></i>
        </button>
      </div>
      <h2
        class="mb-4 text-xl font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
      >
        Correction — {content.title}
      </h2>
      {#each content.pngCor as url, i (i)}
        <img
          src={url}
          class="mb-4 max-w-full"
          style="width: min(100%, calc(850px * {modalZoom}))"
          alt="correction"
        />
      {/each}
    </dialog>
  {/if}
</section>
