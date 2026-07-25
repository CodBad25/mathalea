<script lang="ts">
  import type { TbiCorrectionMode } from './tbiTypes'

  interface Props {
    correctionMode?: TbiCorrectionMode
    correctionExists?: boolean
    settingsExist?: boolean
    newDataExists?: boolean
    showMoveToTab?: boolean
    tabsCount?: number
    currentTab?: number
    /** Flèches de réordonnancement (dispositions liste et colonnes) */
    showReorder?: boolean
    canMoveUp?: boolean
    canMoveDown?: boolean
    /** Bouton de saut de colonne (dispositions en colonnes) */
    showColumnBreak?: boolean
    colBreakActive?: boolean
    /** Nombre maximal de sauts de colonne atteint : désactive l'ajout (pas le retrait) */
    columnBreakDisabled?: boolean
    onCorrection?: (mode: TbiCorrectionMode) => void
    onNewData?: () => void
    onSettings?: () => void
    onZoomIn?: () => void
    onZoomOut?: () => void
    onMoveToTab?: (tab: number) => void
    onMoveUp?: () => void
    onMoveDown?: () => void
    onToggleColBreak?: () => void
    onDelete?: () => void
  }

  let {
    correctionMode = 'hidden',
    correctionExists = false,
    settingsExist = false,
    newDataExists = true,
    showMoveToTab = false,
    tabsCount = 0,
    currentTab = 0,
    showReorder = false,
    canMoveUp = false,
    canMoveDown = false,
    showColumnBreak = false,
    colBreakActive = false,
    columnBreakDisabled = false,
    onCorrection = () => {},
    onNewData = () => {},
    onSettings = () => {},
    onZoomIn = () => {},
    onZoomOut = () => {},
    onMoveToTab = () => {},
    onMoveUp = () => {},
    onMoveDown = () => {},
    onToggleColBreak = () => {},
    onDelete = () => {},
  }: Props = $props()

  function toggleCorrection(mode: TbiCorrectionMode) {
    onCorrection(correctionMode === mode ? 'hidden' : mode)
  }

  const buttonClass =
    'flex items-center justify-center w-8 h-8 rounded-full ' +
    'text-coopmaths-canvas dark:text-coopmathsdark-canvas ' +
    'bg-coopmaths-action hover:bg-coopmaths-action-darkest ' +
    'dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-darkest'
  const activeButtonClass =
    'flex items-center justify-center w-8 h-8 rounded-full ' +
    'text-coopmaths-canvas dark:text-coopmathsdark-canvas ' +
    'bg-coopmaths-warn-dark hover:bg-coopmaths-warn-darkest ' +
    'dark:bg-coopmathsdark-warn-dark dark:hover:bg-coopmathsdark-warn-darkest'
</script>

<div
  class="flex flex-row flex-wrap items-center gap-1 rounded-full px-2 py-1 bg-coopmaths-canvas/90 dark:bg-coopmathsdark-canvas/90 shadow-md"
>
  {#if correctionExists}
    <button
      type="button"
      class={correctionMode === 'below' ? activeButtonClass : buttonClass}
      title="Correction sous l'énoncé"
      aria-label="Correction sous l'énoncé"
      onclick={() => toggleCorrection('below')}
    >
      <i class="bx bx-check-circle"></i>
    </button>
    <button
      type="button"
      class={correctionMode === 'replace' ? activeButtonClass : buttonClass}
      title="Correction à la place de l'énoncé"
      aria-label="Correction à la place de l'énoncé"
      onclick={() => toggleCorrection('replace')}
    >
      <i class="bx bx-transfer-alt"></i>
    </button>
    <button
      type="button"
      class={correctionMode === 'modal' ? activeButtonClass : buttonClass}
      title="Correction en plein écran"
      aria-label="Correction en plein écran"
      onclick={() => toggleCorrection('modal')}
    >
      <i class="bx bx-fullscreen"></i>
    </button>
    <div
      class="w-px h-5 mx-1 bg-coopmaths-struct-light dark:bg-coopmathsdark-struct-light"
    ></div>
  {/if}
  {#if newDataExists}
    <button
      type="button"
      class={buttonClass}
      title="Nouvelles données"
      aria-label="Nouvelles données"
      onclick={onNewData}
    >
      <i class="bx bx-refresh"></i>
    </button>
  {/if}
  {#if settingsExist}
    <button
      type="button"
      class={buttonClass}
      title="Paramètres de l'exercice"
      aria-label="Paramètres de l'exercice"
      onclick={onSettings}
    >
      <i class="bx bx-slider"></i>
    </button>
  {/if}
  <button
    type="button"
    class={buttonClass}
    title="Réduire"
    aria-label="Réduire"
    onclick={onZoomOut}
  >
    <i class="bx bx-zoom-out"></i>
  </button>
  <button
    type="button"
    class={buttonClass}
    title="Agrandir"
    aria-label="Agrandir"
    onclick={onZoomIn}
  >
    <i class="bx bx-zoom-in"></i>
  </button>
  {#if showReorder}
    <div
      class="w-px h-5 mx-1 bg-coopmaths-struct-light dark:bg-coopmathsdark-struct-light"
    ></div>
    <button
      type="button"
      class={buttonClass}
      disabled={!canMoveUp}
      class:opacity-40={!canMoveUp}
      title="Déplacer vers le haut"
      aria-label="Déplacer vers le haut"
      onclick={onMoveUp}
    >
      <i class="bx bx-up-arrow-alt"></i>
    </button>
    <button
      type="button"
      class={buttonClass}
      disabled={!canMoveDown}
      class:opacity-40={!canMoveDown}
      title="Déplacer vers le bas"
      aria-label="Déplacer vers le bas"
      onclick={onMoveDown}
    >
      <i class="bx bx-down-arrow-alt"></i>
    </button>
    <button
      type="button"
      class={buttonClass}
      title="Supprimer l'exercice"
      aria-label="Supprimer l'exercice"
      onclick={onDelete}
    >
      <i class="bx bx-trash"></i>
    </button>
  {/if}
  {#if showColumnBreak}
    <button
      type="button"
      class={colBreakActive ? activeButtonClass : buttonClass}
      disabled={!colBreakActive && columnBreakDisabled}
      class:opacity-40={!colBreakActive && columnBreakDisabled}
      title={colBreakActive
        ? 'Retirer le saut de colonne avant cet exercice'
        : columnBreakDisabled
          ? 'Nombre maximal de sauts de colonne atteint'
          : 'Ajouter un saut de colonne avant cet exercice'}
      aria-label={colBreakActive
        ? 'Retirer le saut de colonne avant cet exercice'
        : columnBreakDisabled
          ? 'Nombre maximal de sauts de colonne atteint'
          : 'Ajouter un saut de colonne avant cet exercice'}
      onclick={onToggleColBreak}
    >
      <i class="bx bx-carousel"></i>
    </button>
  {/if}
  {#if showMoveToTab}
    <div
      class="w-px h-5 mx-1 bg-coopmaths-struct-light dark:bg-coopmathsdark-struct-light"
    ></div>
    <label
      class="flex items-center gap-1 text-xs text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <i class="bx bx-move-horizontal"></i>
      <select
        class="rounded border border-coopmaths-action dark:border-coopmathsdark-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-xs"
        title="Déplacer vers un onglet"
        value={currentTab}
        onchange={(event) =>
          onMoveToTab(Number(event.currentTarget.value))}
      >
        {#each Array(tabsCount) as _, i (i)}
          <option value={i}>Onglet {i + 1}</option>
        {/each}
        <option value={tabsCount}>Nouvel onglet</option>
      </select>
    </label>
  {/if}
</div>
