<script lang="ts">
  import AmcEnonceHtml from './AmcEnonceHtml.svelte'

  export let enonce = ''
  export let htmlContent = ''
  export let param: {
    digits?: number
    decimals?: number
    signe?: boolean
    approx?: number
    vertical?: boolean
  } = {}

  $: digits = Math.max(1, Number(param?.digits ?? 1))
  $: decimals = Math.max(0, Number(param?.decimals ?? 0))
  $: signe = Boolean(param?.signe)
  $: vertical = Boolean(param?.vertical)
  $: approx = Number(param?.approx ?? 0)
  $: digitChoices = Array.from({ length: 10 }, (_, i) => i)
</script>

<div
  class="rounded-xl border border-coopmaths-struct-light/40 bg-white/70 p-3 dark:bg-coopmathsdark-canvas-dark/60 dark:border-coopmathsdark-struct-light/30"
>
  <p
    class="text-sm font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
  >
    AMCnumericChoices
  </p>
  {#if htmlContent || enonce}
    <div class="mt-2">
      <AmcEnonceHtml content={htmlContent || enonce} />
    </div>
  {/if}

  <div class="mt-3 flex items-start gap-3 overflow-auto">
    {#if signe}
      <div class={vertical ? 'pt-6' : 'pt-6'}>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide">
          Signe
        </p>
        <div class={vertical ? 'flex flex-col gap-1' : 'flex flex-col gap-1'}>
          <span
            class="inline-flex h-6 w-6 items-center justify-center rounded border border-coopmaths-struct-light/70 bg-white text-xs dark:border-coopmathsdark-struct-light/60 dark:bg-coopmathsdark-canvas"
            >+</span
          >
          <span
            class="inline-flex h-6 w-6 items-center justify-center rounded border border-coopmaths-struct-light/70 bg-white text-xs dark:border-coopmathsdark-struct-light/60 dark:bg-coopmathsdark-canvas"
            >-</span
          >
        </div>
      </div>
    {/if}

    {#if !vertical}
      <div class="space-y-1">
        {#each Array(digits) as _, i}
          <div class="flex items-center gap-1">
            {#if i === digits - decimals && decimals > 0}
              <div>,</div>
            {/if}

            {#each digitChoices as digit}
              <span
                class="inline-flex h-4 w-4 items-center justify-center rounded border border-coopmaths-struct-light/70 bg-white text-[8px] dark:border-coopmathsdark-struct-light/60 dark:bg-coopmathsdark-canvas"
                >{digit}</span
              >
            {/each}
          </div>
        {/each}
      </div>
    {:else}
      <div class="flex items-start gap-2">
        {#each Array(digits) as _, i}
          <div class="space-y-1">
            <span
              class="block text-center text-[10px] text-coopmaths-corpus/80 dark:text-coopmathsdark-corpus/80"
            >
              {i + 1}
            </span>
            {#each digitChoices as digit}
              <span
                class="inline-flex h-6 w-6 items-center justify-center rounded border border-coopmaths-struct-light/70 bg-white text-[10px] dark:border-coopmathsdark-struct-light/60 dark:bg-coopmathsdark-canvas"
                >{digit}</span
              >
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
