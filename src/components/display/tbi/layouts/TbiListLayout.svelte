<script lang="ts">
  import TbiCardHost from '../TbiCardHost.svelte'
  import type { TbiItem } from '../tbiTypes'

  interface Props {
    items: TbiItem[]
    /** Réordonnancement : déplace l'exercice de la position from à la position to */
    onMove?: (from: number, to: number) => void
    onDelete?: (paramsIndex: number) => void
  }

  let { items, onMove = () => {}, onDelete = () => {} }: Props = $props()
</script>

<div class="flex flex-col gap-4 w-full max-w-5xl mx-auto p-4">
  {#each items as item, position (item.key)}
    <TbiCardHost
      {item}
      showReorder={true}
      canMoveUp={position > 0}
      canMoveDown={position < items.length - 1}
      onReorder={(paramsIndex, delta) => {
        const neighbor = items[position + delta]
        if (neighbor) onMove(paramsIndex, neighbor.paramsIndex)
      }}
      {onDelete}
    />
  {/each}
</div>
