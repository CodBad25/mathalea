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
</script>

<div
  class="w-full {withPadding ? 'p-4' : ''}"
  style="columns: {nbColumns}; column-gap: 1rem"
>
  {#each items as item, position (item.key)}
    <div
      class="break-inside-avoid-column mb-4"
      style={effectiveColBreaks[position] ? 'break-before: column' : ''}
    >
      <TbiCardHost
        {item}
        showReorder={true}
        canMoveUp={position > 0}
        canMoveDown={position < items.length - 1}
        showColumnBreak={true}
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
    </div>
  {/each}
</div>
