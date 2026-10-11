<script lang="ts">
  import TbiExerciceCard from './TbiExerciceCard.svelte'
  import TbiStaticCard from './TbiStaticCard.svelte'
  import type { TbiItem } from './tbiTypes'

  interface Props {
    item: TbiItem
    showMoveToTab?: boolean
    tabsCount?: number
    currentTab?: number
    showDelete?: boolean
    onDelete?: (paramsIndex: number) => void
  }

  let {
    item,
    showMoveToTab = false,
    tabsCount = 0,
    currentTab = 0,
    showDelete = false,
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
    {showDelete}
    {onDelete}
  />
{:else if item.staticContent}
  <TbiStaticCard
    content={item.staticContent}
    paramsIndex={item.paramsIndex}
    {showMoveToTab}
    {tabsCount}
    {currentTab}
    {showDelete}
    {onDelete}
  />
{:else}
  <section
    class="w-full rounded-lg border border-dashed border-coopmaths-struct-light dark:border-coopmathsdark-struct-light p-4 text-center text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
  >
    <i class="bx bx-error-circle text-2xl"></i>
    <p class="text-sm">
      L'exercice <span class="font-bold">{item.id}</span> n'est pas pris en charge
      dans la vue TBI.
    </p>
  </section>
{/if}
