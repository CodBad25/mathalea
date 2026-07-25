<script lang="ts">
  import TbiExerciceCard from './TbiExerciceCard.svelte'
  import type { TbiItem } from './tbiTypes'

  interface Props {
    item: TbiItem
    showMoveToTab?: boolean
    tabsCount?: number
    currentTab?: number
    showReorder?: boolean
    canMoveUp?: boolean
    canMoveDown?: boolean
    showColumnBreak?: boolean
    /** Nombre maximal de sauts de colonne atteint : désactive l'ajout (pas le retrait) */
    columnBreakDisabled?: boolean
    onReorder?: (paramsIndex: number, delta: -1 | 1) => void
    onDelete?: (paramsIndex: number) => void
  }

  let {
    item,
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
</script>

{#if item.exercise}
  <TbiExerciceCard
    exercise={item.exercise}
    paramsIndex={item.paramsIndex}
    {showMoveToTab}
    {tabsCount}
    {currentTab}
    {showReorder}
    {canMoveUp}
    {canMoveDown}
    {showColumnBreak}
    {columnBreakDisabled}
    {onReorder}
    {onDelete}
  />
{:else}
  <section
    class="w-full rounded-lg border border-dashed border-coopmaths-struct-light dark:border-coopmathsdark-struct-light p-4 text-center text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
  >
    <i class="bx bx-error-circle text-2xl"></i>
    <p class="text-sm">
      L'exercice <span class="font-bold">{item.id}</span> n'est pas pris en
      charge dans la vue TBI.
    </p>
  </section>
{/if}
