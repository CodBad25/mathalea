<script lang="ts">
  import { tbiState } from '../../../../lib/stores/tbiStore'
  import TbiCardHost from '../TbiCardHost.svelte'
  import type { TbiItem } from '../tbiTypes'

  interface Props {
    items: TbiItem[]
    nbColumns: number
    /** Réordonnancement : déplace l'exercice de la position from à la position to */
    onMove?: (from: number, to: number) => void
    withPadding?: boolean
    /** Menu « Déplacer vers un onglet » (disposition colonnes d'un onglet) */
    showMoveToTab?: boolean
    tabsCount?: number
    currentTab?: number
    onDelete?: (paramsIndex: number) => void
  }

  let {
    items,
    nbColumns,
    onMove = () => {},
    withPadding = true,
    showMoveToTab = false,
    tabsCount = 0,
    currentTab = 0,
    onDelete = () => {},
  }: Props = $props()

  // N colonnes ne peuvent accueillir qu'au plus N-1 sauts de colonne : au-delà,
  // le layout CSS déborde et des exercices sortent visuellement du conteneur.
  let maxColBreaks = $derived(Math.max(0, nbColumns - 1))
  let rawColBreaks = $derived(
    items.map((item) => $tbiState.cards[item.paramsIndex]?.colBreak ?? false),
  )
  // Seuls les premiers sauts (dans l'ordre d'affichage) sont effectivement
  // appliqués ; les suivants restent mémorisés (réactivables si nbColumns
  // augmente) mais ne provoquent pas de saut visuel.
  let effectiveColBreaks = $derived.by(() => {
    let count = 0
    return rawColBreaks.map((wants) => {
      if (wants && count < maxColBreaks) {
        count++
        return true
      }
      return false
    })
  })
  let colBreakLimitReached = $derived(
    rawColBreaks.filter(Boolean).length >= maxColBreaks,
  )
  // Répartition explicite des exercices entre les colonnes, uniquement pilotée
  // par les sauts de colonne manuels : sans saut, tout reste dans la première
  // colonne (les colonnes suivantes restent vides) plutôt que d'être réparti
  // automatiquement par un algorithme d'équilibrage (CSS `columns`).
  let groups = $derived.by(() => {
    const result: { item: TbiItem; position: number }[][] = Array.from(
      { length: nbColumns },
      () => [],
    )
    let col = 0
    items.forEach((item, position) => {
      if (effectiveColBreaks[position] && col < nbColumns - 1) col++
      result[col].push({ item, position })
    })
    return result
  })
</script>

<div
  class="w-full {withPadding ? 'p-4' : ''} {nbColumns === 1
    ? 'max-w-5xl mx-auto'
    : ''}"
  style="display: grid; grid-template-columns: repeat({nbColumns}, minmax(0, 1fr)); column-gap: 1rem"
>
  {#each groups as colItems, colIndex (colIndex)}
    <div class="flex flex-col gap-4 min-w-0">
      {#each colItems as { item, position } (item.key)}
        <TbiCardHost
          {item}
          showReorder={true}
          canMoveUp={position > 0}
          canMoveDown={position < items.length - 1}
          showColumnBreak={nbColumns > 1}
          columnBreakDisabled={!rawColBreaks[position] && colBreakLimitReached}
          {showMoveToTab}
          {tabsCount}
          {currentTab}
          onReorder={(paramsIndex, delta) => {
            const neighbor = items[position + delta]
            if (neighbor) onMove(paramsIndex, neighbor.paramsIndex)
          }}
          {onDelete}
        />
      {/each}
    </div>
  {/each}
</div>
