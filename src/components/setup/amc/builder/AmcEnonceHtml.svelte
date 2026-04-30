<script lang="ts">
  import { tick } from 'svelte'
  import { renderKatex } from '../../../../lib/mathalea'

  export let content = ''

  let el: HTMLDivElement

  // Re-render KaTeX every time content changes (covers onMount + updates).
  $: if (el && content !== undefined) {
    tick().then(() => {
      if (el) {
        try {
          renderKatex(el)
        } catch {
          // Ignore KaTeX errors in preview (commandes LaTeX non supportées).
        }
      }
    })
  }
</script>

<div
  class="text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus [&_svg]:inline-block [&_svg]:max-w-full [&_svg]:h-auto"
  bind:this={el}
>
  {@html content}
</div>
