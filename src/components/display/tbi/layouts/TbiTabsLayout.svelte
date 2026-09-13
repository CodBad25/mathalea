<script lang="ts">
  import {
    computeTbiTabsInfo,
    defaultTbiTabConfig,
    setTbiActiveTab,
    tbiState,
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

  // Onglet affiché, partagé dans l'URL (tbiParam) pour qu'un lien partagé
  // rouvre sur le même onglet plutôt que de revenir systématiquement au
  // premier. Le sélecteur d'onglet reste ici, en haut (navigation), tandis
  // que les réglages de présentation (disposition, nombre de colonnes,
  // alignement) sont rendus par TbiToolbar (barre flottante en bas, comme le
  // reste des réglages de la vue TBI).
  let activeTab = $derived($tbiState.activeTab)

  // Les onglets sont désignés par les valeurs card.tab, affichées via leur
  // indice compact (0..n-1) : dérivation pure, tolérante aux trous de
  // numérotation (URL partagée). moveCardToTab garde les valeurs compactes.
  let tabsInfo = $derived(computeTbiTabsInfo(items, $tbiState.cards))
  let compactTabs = $derived(tabsInfo.compactTabs)
  let tabsCount = $derived(tabsInfo.tabsCount)
  let tabLabels = $derived(tabsInfo.tabLabels)
  $effect(() => {
    if (activeTab >= tabsCount) setTbiActiveTab(Math.max(0, tabsCount - 1))
  })
  let activeItems = $derived(items.filter((_, i) => compactTabs[i] === activeTab))
  // Dérivés séparés (plutôt qu'un objet activeConfig) : tabConfigs[i] est
  // muté en place par setTbiTabLayout/setTbiTabNbColumns, donc un $derived
  // qui renverrait cet objet ne se recalculerait pas pour ses consommateurs
  // (sa référence resterait inchangée).
  let activeLayout = $derived(
    $tbiState.tabConfigs[activeTab]?.layout ?? defaultTbiTabConfig().layout,
  )
  let activeNbColumns = $derived(
    $tbiState.tabConfigs[activeTab]?.nbColumns ?? defaultTbiTabConfig().nbColumns,
  )
  let activeSingleColumnAlign = $derived(
    $tbiState.tabConfigs[activeTab]?.singleColumnAlign ??
      defaultTbiTabConfig().singleColumnAlign,
  )
</script>

<div class="w-full p-4">
  <div
    class="flex flex-row flex-wrap items-center gap-2 mb-4"
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
        onclick={() => setTbiActiveTab(tab)}
      >
        {label}
      </button>
    {/each}
  </div>
  <div role="tabpanel">
    {#if activeLayout === 'free'}
      <TbiFreeLayout
        items={activeItems}
        {persistLayout}
        showMoveToTab={true}
        {tabsCount}
        currentTab={activeTab}
        {onDelete}
      />
    {:else}
      <TbiColumnsLayout
        items={activeItems}
        nbColumns={activeNbColumns}
        singleColumnAlign={activeSingleColumnAlign}
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
