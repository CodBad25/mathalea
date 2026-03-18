<script lang="ts">
  import ButtonIconTooltip from '../../../shared/forms/ButtonIconTooltip.svelte'
  import ButtonTextAction from '../../../shared/forms/ButtonTextAction.svelte'
  import InputText from '../../../shared/forms/InputText.svelte'
  import ModalLanguageChoice from '../../../shared/modal/ModalLanguageChoice.svelte'
  import LanguageDropdown from '../../../shared/ui/LanguageDropdown.svelte'
  import LanguageIcon from '../../../shared/ui/LanguageIcon.svelte'
  import ButtonsDeck from '../../../shared/ui/ButtonsDeck.svelte'
  import type { Language } from '../../../../lib/types/languages'

  export let zoomUpdate: (plusMinus: '+' | '-') => void
  export let newDataForAll: () => void
  export let trash: () => void
  export let buildUrlAndOpenItInNewTab: (type: 'usual' | 'eleve') => void
  export let showSettingsDialog: () => void
  export let importExercises: (urlFeuilleEleve: string) => void
  export let isExercisesListEmpty: boolean
  export let isCapytale: boolean
  export let handleRecorder: () => void
  export let locale: Language
  export let handleLanguage: (lang: string) => void
  export let isFlowmath: boolean

  let urlFeuilleEleve: string = ''
  let showLanguageChoiceModal: boolean = false
</script>

<nav
  class="flex justify-between items-start w-full p-4
    flex-col md:flex-row
    mx-auto md:space-x-6
    bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
>
  <div
    class="flex flex-row justify-start
    md:items-end
    space-x-0 md:space-x-2"
  >
    <div
      class="font-logo9 tracking-tighter font-black
      text-5xl md:text-4xl
      text-coopmaths-struct dark:text-coopmathsdark-struct"
    >
      MathALÉA
    </div>
    <div
      class="flex flex-row font-light text-sm
      text-coopmaths-corpus-lightest dark:text-coopmathsdark-corpus-lightest"
    >
      <span class="font-light font-sans mr-1 tracking-normal"> par </span>
      <a
        href="https://coopmaths.fr"
        target="_blank"
        rel="noreferrer"
        class="font-extrabold font-logo9 tracking-tighter
          text-coopmaths-action dark:text-coopmathsdark-action
          hover:text-coopmaths-action-lightest dark:hover:text-coopmathsdark-action-lightest"
      >
        CoopMaths
      </a>
    </div>
  </div>
  {#if isFlowmath}
    <div class="flex flex-row items-center space-x-2 ml-4">
      <div class="hidden md:block">
        <LanguageDropdown {locale} {handleLanguage} />
      </div>
      <div class="md:hidden">
        <button
          type="button"
          on:click={() => {
            showLanguageChoiceModal = !showLanguageChoiceModal
          }}
        >
          <LanguageIcon {locale} />
        </button>
      </div>
    </div>
  {/if}
  <div class="w-full flex flex-row">
    <ButtonsDeck class="mt-4 md:mt-0">
      <div
        slot="setup-buttons"
        class="flex flex-row justify-center items-center space-x-4"
      >
        <ButtonIconTooltip
          icon="bx-zoom-out text-3xl"
          tooltip="Réduire la taille du texte"
          on:click={() => zoomUpdate('-')}
        />
        <ButtonIconTooltip
          icon="bx-zoom-in text-3xl"
          tooltip="Augmenter la taille du texte"
          on:click={() => zoomUpdate('+')}
        />
        <ButtonIconTooltip
          icon="bx-refresh text-3xl"
          tooltip="Nouveaux énoncés"
          on:click={newDataForAll}
        />
        <ButtonIconTooltip
          icon="bx-trash text-3xl"
          tooltip="Supprimer tous les exercicess"
          on:click={trash}
        />
      </div>
      <div slot="input" class="flex flex-row items-center space-x-4">
        <InputText
          title="Importer les exercices d'une feuille élève"
          placeholder="Lien"
          bind:value={urlFeuilleEleve}
          classAddenda="w-50"
        />
        <ButtonTextAction
          class="text-sm py-1 px-2 rounded-md h-7"
          text="Ajouter"
          disabled={urlFeuilleEleve === ''}
          on:click={() => importExercises(urlFeuilleEleve)}
        />
      </div>
      <div
        slot="export-buttons"
        class="flex flex-row justify-center items-center space-x-4"
      >
        {#if !isCapytale}
          <ButtonTextAction
            class="text-sm py-1 px-2 rounded-md h-7"
            text="Valider"
            disabled={isExercisesListEmpty}
            on:click={handleRecorder}
          />
        {/if}
        {#if isCapytale}
          <ButtonIconTooltip
            icon="bx-cog text-3xl"
            tooltip="Régler l'affichage du mode élève"
            disabled={isExercisesListEmpty}
            on:click={showSettingsDialog}
          />
        {/if}
        <div>
          <ButtonIconTooltip
            icon="bx-log-out bx-rotate-180"
            tooltip="Rejoindre MathALÉA"
            class="text-3xl"
            disabled={isExercisesListEmpty}
            on:click={() => {
              buildUrlAndOpenItInNewTab('usual')
            }}
          />
        </div>
      </div>
    </ButtonsDeck>
  </div>
</nav>
{#if isFlowmath}
  <ModalLanguageChoice bind:showLanguageChoiceModal {locale} {handleLanguage} />
{/if}
