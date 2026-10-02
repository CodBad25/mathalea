<script lang="ts">
  import { afterUpdate, beforeUpdate } from 'svelte'
  import { GAP_BETWEEN_BLOCKS, getMode } from '../../lib/sizes'
  import type { KeyboardBlock } from '../../types/keyboardContent'
  import type { KeyCap } from '../../types/keycap'
  import BlockOfKeyCaps from './keyboardblock/BlockOfKeycaps.svelte'
  import BlockOfKeycapsWithPagination from './keyboardblock/BlockOfKeycapsWithPagination.svelte'

  export let innerWidth: number
  export let unitsBlocks: KeyboardBlock[]
  export let usualBlocks: KeyboardBlock[]
  export let page: KeyboardBlock[]
  let blocks: KeyboardBlock[] =
    unitsBlocks.length > 1 ? [...usualBlocks] : [...unitsBlocks, ...usualBlocks]
  export let clickKeycap: (data: KeyCap, event: MouseEvent) => void
  export let isInLine: boolean
  // // $: blocksToBeDisplayed = isInLine ? [...page] : [...blocks]
  $: blockgapsize = GAP_BETWEEN_BLOCKS[getMode(innerWidth, isInLine)]
  beforeUpdate(() => {
    // if (debug) console.log('beforeUpdate KeyboardPage)
    blocks =
      unitsBlocks.length > 1
        ? [...usualBlocks]
        : [...unitsBlocks, ...usualBlocks]
  })

  afterUpdate(() => {
    // if (debug) console.log('afterUpdate KeyboardPage)
  })
</script>

<div
  class="bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark flex flex-row blockgap items-center justify-center w-full"
  style="--blockgapsize:{blockgapsize}"
>
  {#if isInLine}
    <div
      id="kb-page"
      class="flex max-w-full flex-row blockgap items-start justify-start overflow-x-auto"
    >
      {#each page as block}
        <BlockOfKeyCaps {block} {isInLine} {innerWidth} {clickKeycap} />
      {/each}
    </div>
  {:else}
    <div class={unitsBlocks.length > 1 && !isInLine ? 'flex' : 'hidden'}>
      <BlockOfKeycapsWithPagination
        blocksList={unitsBlocks}
        {isInLine}
        {innerWidth}
        {clickKeycap}
      />
    </div>
    <div
      id="kb-block"
      class="flex flex-row blockgap items-start justify-center"
    >
      {#each blocks as block}
        <BlockOfKeyCaps {block} {isInLine} {innerWidth} {clickKeycap} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .blockgap {
    column-gap: calc(var(--blockgapsize) * 1px);
  }
</style>
