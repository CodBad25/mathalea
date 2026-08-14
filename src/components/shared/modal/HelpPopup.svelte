<script lang="ts">
  import { tick } from 'svelte'
  import { startTour } from '../../../lib/onboarding/tour'
  import { startTypstTour } from '../../../lib/onboarding/typstTour'
  import { mathaleaGoToView } from '../../../lib/mathaleaUtils'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import { typstShortcutsOpen } from '../../../lib/stores/generalStore'
  import BasicClassicModal from './BasicClassicModal.svelte'

  export let isDisplayed: boolean // à bind avec le parent

  /** La vue Typst a sa propre visite guidée, déjà sur place */
  $: isTypstView = $globalOptions.v === 'typst'

  /** Ouvre la modale des raccourcis clavier de l'éditeur Typst */
  function openTypstShortcuts() {
    isDisplayed = false
    typstShortcutsOpen.set(true)
  }

  /**
   * La visite guidée générale porte sur la page d'accueil&nbsp;: si on la
   * relance depuis une autre vue (export LaTeX, AMC…), on y retourne
   * d'abord. Depuis la vue Typst, sa propre visite se relance sur place.
   */
  async function replayTour() {
    isDisplayed = false
    if (isTypstView) {
      await tick()
      startTypstTour()
    } else if ($globalOptions.v !== '') {
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
        {#if isTypstView}
          Retrouvez la présentation de la vue Typst&nbsp;: modes d'affichage,
          palette de mise en page sur l'aperçu, réglages du document et export.
        {:else}
          Retrouvez la présentation de la page d'accueil&nbsp;: recherche d'un
          exercice, ajout à la feuille et réglage des paramètres.
        {/if}
      </p>
      <div class="self-center flex flex-wrap justify-center gap-3">
        <button
          type="button"
          on:click={replayTour}
          class="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold
            bg-coopmaths-action dark:bg-coopmathsdark-action
            text-coopmaths-canvas dark:text-coopmathsdark-canvas
            hover:bg-coopmaths-action-lightest dark:hover:bg-coopmathsdark-action-lightest"
        >
          <i class="bx bx-refresh text-xl"></i>
          Relancer la visite guidée
        </button>
        {#if isTypstView}
          <button
            type="button"
            on:click={openTypstShortcuts}
            class="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold
              border border-coopmaths-action dark:border-coopmathsdark-action
              text-coopmaths-action dark:text-coopmathsdark-action
              hover:bg-coopmaths-action hover:text-coopmaths-canvas
              dark:hover:bg-coopmathsdark-action dark:hover:text-coopmathsdark-canvas"
          >
            <i class="bx bx-help-circle text-xl"></i>
            Raccourcis clavier
          </button>
        {/if}
      </div>
      {#if isTypstView}
        <a
          href="https://coopmaths.fr/www/aide/typst"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center justify-center gap-2
            text-coopmaths-action dark:text-coopmathsdark-action
            hover:text-coopmaths-action-lightest dark:hover:text-coopmathsdark-action-lightest"
        >
          <i class="bx bx-book-open text-xl"></i>
          En savoir plus sur le langage Typst
        </a>
      {/if}
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
