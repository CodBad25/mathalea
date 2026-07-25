<script lang="ts">
  import { mathaleaGoToView } from '../../../lib/mathaleaUtils'
  import { tbiState, type TbiMode } from '../../../lib/stores/tbiStore'

  let isSettingsOpen = $state(false)

  const modes: { value: TbiMode; label: string; icon: string }[] = [
    { value: 'list', label: 'Liste', icon: 'bx-list-ul' },
    { value: 'columns', label: 'Colonnes', icon: 'bx-columns' },
    { value: 'free', label: 'Placement libre', icon: 'bx-move' },
    { value: 'tabs', label: 'Onglets', icon: 'bx-folder' },
  ]

  function setMode(mode: TbiMode) {
    tbiState.update((state) => ({ ...state, mode }))
  }

  function setNbColumns(nbColumns: number) {
    nbColumns = Math.min(4, Math.max(2, nbColumns))
    tbiState.update((state) => ({ ...state, nbColumns }))
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

  const buttonClass =
    'flex items-center justify-center w-10 h-10 rounded-full shadow-md ' +
    'text-coopmaths-canvas dark:text-coopmathsdark-canvas ' +
    'bg-coopmaths-action hover:bg-coopmaths-action-darkest ' +
    'dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-darkest'
</script>

<div
  class="fixed bottom-3 right-3 z-30 flex flex-col items-end gap-2 print-hidden"
>
  {#if isSettingsOpen}
    <div
      class="flex flex-col gap-1 p-3 rounded-xl shadow-lg bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <span
        class="text-xs font-bold uppercase text-coopmaths-struct dark:text-coopmathsdark-struct mb-1"
        >Disposition</span
      >
      {#each modes as mode (mode.value)}
        <button
          type="button"
          class="flex flex-row items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-left {$tbiState.mode ===
          mode.value
            ? 'bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas font-semibold'
            : 'hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-darkest'}"
          onclick={() => setMode(mode.value)}
        >
          <i class="bx {mode.icon}"></i>
          {mode.label}
        </button>
      {/each}
      {#if $tbiState.mode === 'columns'}
        <div class="flex flex-row items-center gap-2 px-3 py-1.5 text-sm">
          <span>Nombre de colonnes&nbsp;:</span>
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
    </div>
  {/if}
  <div class="flex flex-row items-center gap-2">
    <button
      type="button"
      class={buttonClass}
      title="Retour à l'éditeur"
      aria-label="Retour à l'éditeur"
      onclick={() => mathaleaGoToView('')}
    >
      <i class="bx bx-arrow-back text-xl"></i>
    </button>
    <button
      type="button"
      class={buttonClass}
      title="Nouvelles données pour tous les exercices"
      aria-label="Nouvelles données pour tous les exercices"
      onclick={newDataForAll}
    >
      <i class="bx bx-refresh text-xl"></i>
    </button>
    <button
      type="button"
      class={buttonClass}
      title="Horloge, minuteur, chronomètre"
      aria-label="Horloge, minuteur, chronomètre"
      onclick={toggleWidget}
    >
      <i class="bx bx-time-five text-xl"></i>
    </button>
    <button
      type="button"
      class={buttonClass}
      title="Réglages de la page"
      aria-label="Réglages de la page"
      aria-expanded={isSettingsOpen}
      onclick={() => (isSettingsOpen = !isSettingsOpen)}
    >
      <i class="bx bx-cog text-xl"></i>
    </button>
  </div>
</div>
