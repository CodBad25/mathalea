<script lang="ts">
  import { tick } from 'svelte'
  import { startTour } from '../../../lib/onboarding/tour'
  import { mathaleaGoToView } from '../../../lib/mathaleaUtils'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import BasicClassicModal from './BasicClassicModal.svelte'

  export let isDisplayed: boolean // à bind avec le parent

  /**
   * La visite guidée porte sur la page d'accueil&nbsp;: si on la relance
   * depuis une autre vue (export LaTeX, AMC…), on y retourne d'abord.
   */
  async function replayTour() {
    isDisplayed = false
    if ($globalOptions.v !== '') {
      mathaleaGoToView('')
      await tick()
      setTimeout(startTour, 300)
    } else {
      await tick()
      startTour()
    }
  }
</script>

<BasicClassicModal icon="bx-help-circle" bind:isDisplayed>
  <svelte:fragment slot="header">Aide</svelte:fragment>
  <svelte:fragment slot="content">
    <div
      class="flex flex-col gap-4 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <p>
        Retrouvez la présentation de la page d'accueil&nbsp;: recherche d'un
        exercice, ajout à la feuille et réglage des paramètres.
      </p>
      <button
        type="button"
        on:click={replayTour}
        class="self-center inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold
          bg-coopmaths-action dark:bg-coopmathsdark-action
          text-coopmaths-canvas dark:text-coopmathsdark-canvas
          hover:bg-coopmaths-action-lightest dark:hover:bg-coopmathsdark-action-lightest"
      >
        <i class="bx bx-refresh text-xl"></i>
        Relancer la visite guidée
      </button>
      <a
        href="mailto:contact@coopmaths.fr"
        class="inline-flex items-center justify-center gap-2
          text-coopmaths-action dark:text-coopmathsdark-action
          hover:text-coopmaths-action-lightest dark:hover:text-coopmathsdark-action-lightest"
      >
        <i class="bx bx-envelope text-xl"></i>
        Nous contacter
      </a>
    </div>
  </svelte:fragment>
</BasicClassicModal>
