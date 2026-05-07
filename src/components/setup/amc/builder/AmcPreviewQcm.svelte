<script lang="ts">
  import AmcEnonceHtml from './AmcEnonceHtml.svelte'

  export let enonce = ''
  export let htmlContent = ''
  export let choix: Array<{
    texte?: string
    statut?: unknown
  }> = []
  export let mode: 'qcmMono' | 'qcmMult' = 'qcmMono'

  const isCorrectChoice = (statut: unknown): boolean =>
    statut === true || statut === 1 || statut === '1' || statut === 'true'

  const stripEmbeddedQcmMarkup = (value: string): string => {
    if (value.trim().length === 0) return ''
    return value
      .replace(
        /<div[^>]*class="[^"]*my-3[^"]*"[^>]*>[\s\S]*?<\/div>\s*<div[^>]*id="resultatCheckEx[^"]*"[^>]*><\/div>/gi,
        '',
      )
      .replace(/<div[^>]*id="resultatCheckEx[^"]*"[^>]*><\/div>/gi, '')
      .replace(/(<br\s*\/?>\s*){2,}$/gi, '')
      .trim()
  }

  // En preview AMC, on garde un rendu stable: énoncé + liste de choix stylée AMC.
  // On garde l'énoncé HTML lorsqu'il est disponible, mais en retirant le bloc
  // QCM interactif/non-interactif injecté à la fin de `htmlContent`.
  $: htmlStatement = stripEmbeddedQcmMarkup(htmlContent)
  $: previewContent = htmlStatement || htmlContent || enonce
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
      <AmcEnonceHtml content={previewContent} />
    </div>
  {/if}
  {#if choix.length > 0}
    <ul class="mt-3 space-y-2">
      {#each choix as option}
        <li
          class="flex items-start gap-2 text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus"
        >
          <span
            aria-hidden="true"
            class="mt-1 inline-block h-3 w-3 rounded-none border border-black {isCorrectChoice(
              option.statut,
            )
              ? 'bg-black'
              : 'bg-white'}"
          ></span>
          <AmcEnonceHtml content={option.texte ?? ''} />
        </li>
      {/each}
    </ul>
  {/if}
</div>
