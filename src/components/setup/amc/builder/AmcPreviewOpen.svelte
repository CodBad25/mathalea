<script lang="ts">
  import AmcEnonceHtml from './AmcEnonceHtml.svelte'

  export let enonce = ''
  export let htmlContent = ''
  export let lignes = 3
  export let pointilles: boolean | number | undefined = true
  export let sanscadre: boolean | number | undefined = false
</script>

<div
  class="rounded-xl border border-coopmaths-struct-light/40 bg-white/70 p-3 dark:bg-coopmathsdark-canvas-dark/60 dark:border-coopmathsdark-struct-light/30"
>
  <p
    class="text-sm font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
  >
    AMCOpen
  </p>
  {#if htmlContent || enonce}
    <div class="mt-2">
      <AmcEnonceHtml content={htmlContent || enonce} />
    </div>
  {/if}

  <div
    class="mt-3 rounded {sanscadre
      ? ''
      : 'border border-dashed border-coopmaths-struct-light/60 dark:border-coopmathsdark-struct-light/40'} p-2"
  >
    {#each Array(Math.max(1, Number(lignes || 1))) as _}
      <div
        class="h-6 border-b border-coopmaths-struct-light/30 dark:border-coopmathsdark-struct-light/30"
        class:border-dotted={!!pointilles}
      ></div>
    {/each}
  </div>
</div>
