<script lang="ts">
  interface Props {
    settingsExist?: boolean
    newDataExists?: boolean
    showMoveToTab?: boolean
    tabsCount?: number
    currentTab?: number
    showDelete?: boolean
    /** Contrôle du nombre de colonnes internes (sans objet pour une image statique) */
    showCols?: boolean
    /** Nombre de colonnes de la liste de questions de cet exercice */
    cols?: number
    /** Niveau d'espacement vertical de la liste de questions */
    questionSpacing?: number
    onNewData?: () => void
    onSettings?: () => void
    onZoomIn?: () => void
    onZoomOut?: () => void
    onColsInc?: () => void
    onColsDec?: () => void
    onQuestionSpacingInc?: () => void
    onQuestionSpacingDec?: () => void
    onMoveToTab?: (tab: number) => void
    onDelete?: () => void
  }

  let {
    settingsExist = false,
    newDataExists = true,
    showMoveToTab = false,
    tabsCount = 0,
    currentTab = 0,
    showDelete = false,
    showCols = true,
    cols = 1,
    questionSpacing = 1,
    onNewData = () => {},
    onSettings = () => {},
    onZoomIn = () => {},
    onZoomOut = () => {},
    onColsInc = () => {},
    onColsDec = () => {},
    onQuestionSpacingInc = () => {},
    onQuestionSpacingDec = () => {},
    onMoveToTab = () => {},
    onDelete = () => {},
  }: Props = $props()

  const buttonClass =
    'flex items-center justify-center w-8 h-8 rounded-full ' +
    'text-coopmaths-canvas dark:text-coopmathsdark-canvas ' +
    'bg-coopmaths-action hover:bg-coopmaths-action-darkest ' +
    'dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-darkest'
</script>

<div
  class="flex flex-row flex-wrap items-center gap-1 rounded-full px-2 py-1 bg-coopmaths-canvas/90 dark:bg-coopmathsdark-canvas/90 shadow-md"
>
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
  {#if showCols}
    <div
      class="w-px h-5 mx-1 bg-coopmaths-struct-light dark:bg-coopmathsdark-struct-light"
    ></div>
    <button
      type="button"
      class={buttonClass}
      disabled={cols <= 1}
      class:opacity-40={cols <= 1}
      title="Diminuer le nombre de colonnes de cet exercice"
      aria-label="Diminuer le nombre de colonnes de cet exercice"
      onclick={onColsDec}
    >
      <i class="bx bx-minus"></i>
    </button>
    <span
      class="flex items-center gap-0.5 text-xs font-bold text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <i class="bx bx-columns"></i>{cols}
    </span>
    <button
      type="button"
      class={buttonClass}
      disabled={cols >= 4}
      class:opacity-40={cols >= 4}
      title="Augmenter le nombre de colonnes de cet exercice"
      aria-label="Augmenter le nombre de colonnes de cet exercice"
      onclick={onColsInc}
    >
      <i class="bx bx-plus"></i>
    </button>
    <div
      class="w-px h-5 mx-1 bg-coopmaths-struct-light dark:bg-coopmathsdark-struct-light"
    ></div>
    <button
      type="button"
      class={buttonClass}
      disabled={questionSpacing <= 0}
      class:opacity-40={questionSpacing <= 0}
      title="Réduire l'espace vertical entre les questions"
      aria-label="Réduire l'espace vertical entre les questions"
      onclick={onQuestionSpacingDec}
    >
      <i class="bx bx-minus"></i>
    </button>
    <span
      class="flex items-center gap-0.5 text-xs font-bold text-coopmaths-corpus dark:text-coopmathsdark-corpus"
      title="Espacement vertical entre les questions"
    >
      <i class="bx bx-expand-vertical"></i>{questionSpacing}
    </span>
    <button
      type="button"
      class={buttonClass}
      title="Augmenter l'espace vertical entre les questions"
      aria-label="Augmenter l'espace vertical entre les questions"
      onclick={onQuestionSpacingInc}
    >
      <i class="bx bx-plus"></i>
    </button>
  {/if}
  {#if showDelete}
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
        onchange={(event) => onMoveToTab(Number(event.currentTarget.value))}
      >
        {#each Array(tabsCount) as _, i (i)}
          <option value={i}>Onglet {i + 1}</option>
        {/each}
        <option value={tabsCount}>Nouvel onglet</option>
      </select>
    </label>
  {/if}
</div>
