<script lang="ts">
  import { globalOptions } from '../../../../../../../lib/stores/globalOptions'

  export let setAllInteractive: (isAllInteractive: boolean) => void

  // L'état est lu dans le store, alimenté par l'URL (`numerique=1`) ou, pour
  // une nouvelle visite, par le dernier choix mémorisé.
  $: isDigital = $globalOptions.setInteractive === '1'

  const options = [
    {
      isDigital: false,
      label: 'Papier',
      icon: 'bx-file',
      tooltip: 'Exercices à faire sur feuille',
    },
    {
      isDigital: true,
      label: 'Numérique',
      icon: 'bx-laptop',
      tooltip: "Les réponses peuvent être saisies sur l'appareil",
    },
  ]
</script>

<div
  role="radiogroup"
  aria-label="Format des exercices"
  data-tour="format-toggle"
  class="flex items-center gap-0.5 p-0.5 rounded-full
    bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-dark"
>
  {#each options as option (option.label)}
    <div class="tooltip tooltip-bottom tooltip-neutral" data-tip={option.tooltip}>
      <button
        type="button"
        role="radio"
        aria-checked={isDigital === option.isDigital}
        aria-label={option.label}
        class="flex items-center justify-center size-8 rounded-full transition-colors
          {isDigital === option.isDigital
          ? 'bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-action dark:text-coopmathsdark-action shadow-sm'
          : 'text-coopmaths-corpus-lightest dark:text-coopmathsdark-corpus-light hover:text-coopmaths-action dark:hover:text-coopmathsdark-action'}"
        on:click={() => setAllInteractive(option.isDigital)}
      >
        <i class="bx {option.icon} text-xl"></i>
      </button>
    </div>
  {/each}
</div>
