<script lang="ts">
  import { flip } from 'svelte/animate'
  import {
    tbiIsShuffling,
    tbiState,
    type TbiSingleColumnAlign,
  } from '../../../../lib/stores/tbiStore'
  import TbiCardHost from '../TbiCardHost.svelte'
  import type { TbiItem } from '../tbiTypes'

  interface Props {
    items: TbiItem[]
    nbColumns: number
    /** Alignement horizontal quand nbColumns === 1 (sans effet au-delà) */
    singleColumnAlign?: TbiSingleColumnAlign
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
    singleColumnAlign = 'center',
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

  // Alignement horizontal du conteneur quand il n'y a qu'une seule colonne :
  // centré (largeur limitée, comportement historique), moitié gauche/droite de
  // l'écran, ou toute la largeur. Sans effet dès qu'il y a plusieurs colonnes.
  let widthClass = $derived.by(() => {
    if (nbColumns !== 1) return 'w-full'
    switch (singleColumnAlign) {
      case 'left':
        return 'w-1/2 mr-auto'
      case 'right':
        return 'w-1/2 ml-auto'
      case 'full':
        return 'w-full'
      default:
        return 'w-full max-w-5xl mx-auto'
    }
  })
</script>

<div
  class="{widthClass} {withPadding ? 'p-4' : ''}"
  style="display: grid; grid-template-columns: repeat({nbColumns}, minmax(0, 1fr)); column-gap: 1rem"
>
  {#each groups as colItems, colIndex (colIndex)}
    <div class="flex flex-col gap-4 min-w-0">
      {#each colItems as { item, position } (item.key)}
        <div
          class="min-w-0"
          animate:flip={{
            duration: $tbiIsShuffling ? (d) => 300 + Math.sqrt(d) * 6 : 0,
          }}
        >
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
        </div>
      {/each}
    </div>
  {/each}
</div>
