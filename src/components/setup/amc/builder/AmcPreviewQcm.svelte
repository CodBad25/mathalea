<script lang="ts">
  import AmcEnonceHtml from './AmcEnonceHtml.svelte'

  export let enonce = ''
  export let htmlContent = ''
  export let choix: Array<{
    texte?: string
  }> = []
  export let mode: 'qcmMono' | 'qcmMult' = 'qcmMono'
</script>

<div
  class="rounded-xl border border-coopmaths-struct-light/40 bg-white/70 p-3 dark:bg-coopmathsdark-canvas-dark/60 dark:border-coopmathsdark-struct-light/30"
>
  <p
    class="text-sm font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
  >
    {mode === 'qcmMult' ? 'QCM multiple' : 'QCM choix unique'}
  </p>
  {#if htmlContent || enonce}
    <div class="mt-2">
      <AmcEnonceHtml content={htmlContent || enonce} />
    </div>
  {/if}
  <ul class="mt-3 space-y-2">
    {#each choix as option}
      <li
        class="flex items-start gap-2 text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus"
      >
        <span
          class="mt-1 inline-block h-3 w-3 rounded-full border border-coopmaths-struct-light dark:border-coopmathsdark-struct-light"
        ></span>
        <AmcEnonceHtml content={option.texte ?? ''} />
      </li>
    {/each}
  </ul>
</div>
