<script lang="ts">
  import Latex from '../../../lib/Latex'
  import { type LatexFileInfos } from '../../../lib/LatexTypes'
  import FormConfigGlobal from './FormConfigGlobal.svelte'
  import FormConfigIndividual from './FormConfigIndividual.svelte'

  export let latex: Latex
  export let latexFileInfos: LatexFileInfos
  export let callback: () => void

  /**
   * Affiche ou ferme si déjà ouvert le code Latex dans une boite de dialogue
   */
  async function dialogConfigToDisplayToggle() {
    const dialog = document.getElementById('configLatex') as HTMLDialogElement
    if (dialog.open) {
      dialog.close()
      callback()
    } else {
      dialog.showModal()
    }
  }
</script>

<form
  class={`${$$props.class || 'flex flex-col md:flex-row mx-4 pb-4 md:pb-8 md:space-x-4 space-y-3 justify-center md:justify-start items-center'}`}
  target="_blank"
>
  <button
    id="btn_config"
    type="submit"
    on:click|preventDefault={dialogConfigToDisplayToggle}
    class="px-2 py-1 rounded-md text-coopmaths-canvas dark:text-coopmathsdark-canvas bg-coopmaths-action hover:bg-coopmaths-action-lightest dark:bg-coopmathsdark-action dark:hover:bg-coopmathsdark-action-lightest"
  >
    Paramétrer
  </button>
</form>

<dialog
  class="fixed rounded-xl p-6 bg-coopmaths-canvas text-coopmaths-corpus left-[2%] top-[2%] w-[96%] h-[96%] dark:bg-coopmathsdark-canvas-dark dark:text-coopmathsdark-corpus-light shadow-lg"
  id="configLatex"
>
  <div class="mt-3 text-center">
    <div class="text-3xl font-medium text-coopmaths-warn-dark">
      <span class="header">
        <div class="absolute top-2 right-3">
          <button
            type="button"
            aria-label="Fermer la configuration"
            on:click={() => {
              dialogConfigToDisplayToggle()
            }}
          >
            <i
              class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest text-xl bx bx-x"
            ></i>
          </button>
        </div>
      </span>
    </div>

    <!-- Config globale -->
    <FormConfigGlobal bind:latexFileInfos {latex} />

    <!-- Config individuelle -->
    <FormConfigIndividual bind:latexFileInfos {latex} />

    <!-- Card JSON -->
    <div class="w-full mt-6 p-4 border rounded-2xl shadow bg-gray-50">
      <h2 class="text-lg font-bold mb-3">Aperçu JSON</h2>
      <pre
        class="bg-gray-900 text-green-200 p-3 text-left rounded-lg text-sm overflow-x-auto max-h-80">{JSON.stringify(
          latexFileInfos.exos || {},
          null,
          2,
        )}
      </pre>
    </div>
  </div>
</dialog>
