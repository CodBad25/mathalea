<script lang="ts">
  import {
    balanceColumnBreaks,
    defaultTbiTabConfig,
    tbiState,
    type TbiTabLayout,
  } from '../../../../lib/stores/tbiStore'
  import type { TbiItem } from '../tbiTypes'
  import TbiColumnsLayout from './TbiColumnsLayout.svelte'
  import TbiFreeLayout from './TbiFreeLayout.svelte'

  interface Props {
    items: TbiItem[]
    /** Réordonnancement : déplace l'exercice de la position from à la position to */
    onMove?: (from: number, to: number) => void
    /** Sauvegarde des positions (localStorage), pour la disposition libre d'un onglet */
    persistLayout?: () => void
    onDelete?: (paramsIndex: number) => void
  }

  let {
    items,
    onMove = () => {},
    persistLayout = () => {},
    onDelete = () => {},
  }: Props = $props()

  let activeTab = $state(0)

  // Les onglets sont désignés par les valeurs card.tab, affichées via leur
  // indice compact (0..n-1) : dérivation pure, tolérante aux trous de
  // numérotation (URL partagée). moveCardToTab garde les valeurs compactes.
  let rawTabs = $derived(
    items.map((item) => $tbiState.cards[item.paramsIndex]?.tab ?? item.paramsIndex),
  )
  let usedTabs = $derived([...new Set(rawTabs)].sort((a, b) => a - b))
  let compactTabs = $derived(rawTabs.map((tab) => usedTabs.indexOf(tab)))
  let tabsCount = $derived(usedTabs.length)
  $effect(() => {
    if (activeTab >= tabsCount) activeTab = Math.max(0, tabsCount - 1)
  })
  let activeItems = $derived(items.filter((_, i) => compactTabs[i] === activeTab))
  let tabLabels = $derived(
    usedTabs.map((_, compact) => {
      const tabItems = items.filter((_, i) => compactTabs[i] === compact)
      if (tabItems.length === 1) {
        return tabItems[0].id.replace('.js', '').replace('.ts', '')
      }
      return `Onglet ${compact + 1} (${tabItems.length})`
    }),
  )
  // Dérivés séparés (plutôt qu'un objet activeConfig) : tabConfigs[i] est
  // muté en place par setTabLayout/setTabNbColumns, donc un $derived qui
  // renverrait cet objet ne se recalculerait pas pour ses consommateurs
  // (sa référence resterait inchangée).
  let activeLayout = $derived(
    $tbiState.tabConfigs[activeTab]?.layout ?? defaultTbiTabConfig().layout,
  )
  let activeNbColumns = $derived(
    $tbiState.tabConfigs[activeTab]?.nbColumns ?? defaultTbiTabConfig().nbColumns,
  )

  const tabLayouts: { value: TbiTabLayout; label: string; icon: string }[] = [
    { value: 'columns', label: 'Colonnes', icon: 'bx-columns' },
    { value: 'free', label: 'Placement libre', icon: 'bx-move' },
  ]

  function setTabLayout(layout: TbiTabLayout) {
    tbiState.update((state) => {
      while (state.tabConfigs.length <= activeTab) {
        state.tabConfigs.push(defaultTbiTabConfig())
      }
      state.tabConfigs[activeTab].layout = layout
      return state
    })
  }

  function setTabNbColumns(nbColumns: number) {
    nbColumns = Math.min(4, Math.max(1, nbColumns))
    tbiState.update((state) => {
      while (state.tabConfigs.length <= activeTab) {
        state.tabConfigs.push(defaultTbiTabConfig())
      }
      state.tabConfigs[activeTab].nbColumns = nbColumns
      return state
    })
    balanceColumnBreaks(
      activeItems.map((item) => item.paramsIndex),
      nbColumns,
    )
  }
</script>

<div class="w-full p-4">
  <div class="flex flex-row flex-wrap items-center gap-2 mb-4">
    <div
      class="flex flex-row flex-wrap items-center gap-2"
      role="tablist"
      aria-label="Onglets d'exercices"
    >
      {#each tabLabels as label, tab (tab)}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          class="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors {activeTab ===
          tab
            ? 'bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas'
            : 'bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus hover:bg-coopmaths-canvas-darkest dark:hover:bg-coopmathsdark-canvas-darkest'}"
          onclick={() => (activeTab = tab)}
        >
          {label}
        </button>
      {/each}
    </div>
    <div
      class="flex flex-row items-center gap-1 ml-auto text-coopmaths-corpus dark:text-coopmathsdark-corpus"
      title="Disposition de l'onglet"
    >
      {#each tabLayouts as layout (layout.value)}
        <button
          type="button"
          class="flex items-center justify-center w-8 h-8 rounded-full {activeLayout ===
          layout.value
            ? 'bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas'
            : 'bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas-darkest dark:hover:bg-coopmathsdark-canvas-darkest'}"
          title="Disposition de l'onglet : {layout.label}"
          aria-label="Disposition de l'onglet : {layout.label}"
          onclick={() => setTabLayout(layout.value)}
        >
          <i class="bx {layout.icon}"></i>
        </button>
      {/each}
      {#if activeLayout === 'columns'}
        <button
          type="button"
          aria-label="Diminuer le nombre de colonnes"
          class="ml-2 text-coopmaths-action dark:text-coopmathsdark-action"
          onclick={() => setTabNbColumns(activeNbColumns - 1)}
        >
          <i class="bx bx-minus"></i>
        </button>
        <span class="text-sm font-bold">{activeNbColumns}</span>
        <button
          type="button"
          aria-label="Augmenter le nombre de colonnes"
          class="text-coopmaths-action dark:text-coopmathsdark-action"
          onclick={() => setTabNbColumns(activeNbColumns + 1)}
        >
          <i class="bx bx-plus"></i>
        </button>
      {/if}
    </div>
  </div>
  <div role="tabpanel">
    {#if activeLayout === 'free'}
      <TbiFreeLayout
        items={activeItems}
        {persistLayout}
        showMoveToTab={true}
        {tabsCount}
        currentTab={activeTab}
      />
    {:else}
      <TbiColumnsLayout
        items={activeItems}
        nbColumns={activeNbColumns}
        {onMove}
        withPadding={false}
        showMoveToTab={true}
        {tabsCount}
        currentTab={activeTab}
        {onDelete}
      />
    {/if}
  </div>
</div>
