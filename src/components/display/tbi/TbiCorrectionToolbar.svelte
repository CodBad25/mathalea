<script lang="ts">
  import type { TbiCorrectionMode } from './tbiTypes'

  interface Props {
    correctionMode?: TbiCorrectionMode
    onCorrection?: (mode: TbiCorrectionMode) => void
  }

  let { correctionMode = 'hidden', onCorrection = () => {} }: Props = $props()

  const OPTIONS: { value: Exclude<TbiCorrectionMode, 'hidden'>; label: string }[] =
    [
      { value: 'below', label: "Sous l'énoncé" },
      { value: 'perQuestion', label: 'Après chaque question' },
      { value: 'replace', label: "À la place de l'énoncé" },
      { value: 'modal', label: 'En plein écran' },
    ]

  function toggle(mode: TbiCorrectionMode) {
    onCorrection(correctionMode === mode ? 'hidden' : mode)
  }
</script>

<div
  class="flex flex-col overflow-hidden rounded-md shadow-md text-xs min-w-[190px] bg-coopmaths-canvas/90 dark:bg-coopmathsdark-canvas/90"
>
  <div
    class="px-2 py-1 font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct border-b border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest"
  >
    Correction
  </div>
  {#each OPTIONS as option (option.value)}
    <button
      type="button"
      class="px-2 py-1 text-left whitespace-nowrap transition-colors {correctionMode ===
      option.value
        ? 'bg-coopmaths-action text-coopmaths-canvas dark:bg-coopmathsdark-action dark:text-coopmathsdark-canvas'
        : 'text-coopmaths-corpus dark:text-coopmathsdark-corpus hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark'}"
      aria-pressed={correctionMode === option.value}
      title="Correction {option.label.toLowerCase()}"
      onclick={() => toggle(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>
