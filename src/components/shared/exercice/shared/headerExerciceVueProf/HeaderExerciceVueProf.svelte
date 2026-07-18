<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import refProfs from '../../../../../json/referentielProfs.json'
  import uuidsRessources from '../../../../../json/uuidsRessources.json'
  import { toMap } from '../../../../../lib/components/toMap'
  import { mathaleaGenerateSeed } from '../../../../../lib/mathalea'
  import { exercicesParams } from '../../../../../lib/stores/generalStore'
  import { globalOptions } from '../../../../../lib/stores/globalOptions'
  import PdfDialog from '../../../../setup/latex/PdfDialog.svelte'
  import InteractivityIcon from '../../../icons/TwoStatesIcon.svelte'
  import BoutonDescendre from './BoutonDescendre.svelte'
  import BoutonMonter from './BoutonMonter.svelte'

  // paramètres obligatoires
  export let title: string | undefined
  export let id: string
  export let indiceExercice: number
  export let indiceLastExercice: number
  export let interactifReady: boolean
  // paramètres optionnels
  export let randomReady = true
  export let settingsReady = true
  export let correctionReady = true
  export let correctionExists = true
  export let isInteractif: boolean = false
  export let interactifObligatoire = false
  export let isSortable: boolean = true
  export let isDeletable: boolean = true
  export let isHidable: boolean = true
  let isVisible = true
  export let isSettingsVisible = true
  const isContentVisible = true
  let isCorrectionVisible = false
  let showPdfDialog = false
  // redéfinition du titre lorsqu'un exercice apparait plusieurs fois :
  // si le titre contient le caractère | (ajouté lors de la création de l'exercice)
  // on coupe le titre en deux et on distingue le titre de base de l'addendum
  // afin de pouvoir décorer cet addendum
  let titleAddendum: string
  let titleBase: string
  $: {
    if (title?.includes('|')) {
      const decompo = title.split('|')
      titleBase = decompo[0]
      titleAddendum = decompo[1]
    } else {
      titleBase = title || ''
      titleAddendum = ''
    }
  }
  // Éttablissement de la catégorie
  const ressourcesUuids = Object.keys({ ...uuidsRessources })
  const profsUuids = Array.from(toMap({ ...refProfs }).values()).map((e) =>
    e.get('uuid'),
  )
  let category: string
  if (ressourcesUuids.includes($exercicesParams[indiceExercice]?.uuid)) {
    category = 'Ressource'
  } else if (profsUuids.includes($exercicesParams[indiceExercice]?.uuid)) {
    category = 'Outil'
  } else {
    category = 'Exercice'
  }
  const dispatch = createEventDispatcher()

  function switchInteractif() {
    isInteractif = !isInteractif
    dispatch('clickInteractif', { isInteractif })
  }

  function newData() {
    dispatch('clickNewData')
  }

  function remove() {
    exercicesParams.update((l) => [
      ...l.slice(0, indiceExercice),
      ...l.slice(indiceExercice + 1),
    ])
    dispatch('exerciseRemoved')
  }

  function duplicate() {
    exercicesParams.update((l) => {
      const newExercice = { ...l[indiceExercice] }
      newExercice.alea = mathaleaGenerateSeed()
      return [
        ...l.slice(0, indiceExercice + 1),
        newExercice,
        ...l.slice(indiceExercice + 1),
      ]
    })
  }
</script>

<!--
  @component
  Barre de titre et d'actions au-dessus d'un exercice

  __Utilisation__ :

  ```tsx
  const headerExerciceProps: HeaderProps = {
    title: exercice.titre,
    indiceExercice: 2,
    indiceLastExercice: 4,
    interactifReady: true,
    randomReady: true,
    settingsReady: true,
    correctionReady: true
  }
  <HeaderExerciceVueProf {...headerExerciceProps}/>
  ```
 -->

<div class="z-0 flex-1">
  <h1
    class="border-b border-coopmaths-struct dark:border-coopmathsdark-struct text-coopmaths-struct dark:text-coopmathsdark-struct pl-0 mt-4 flex flex-col lg:flex-row justify-start lg:justify-between items-start xl:items-baseline"
  >
    <div
      class="flex flex-col xl:flex-row xl:justify-start xl:items-center"
      id="exercice{indiceExercice}"
    >
      <div
        class="flex flex-row items-center whitespace-pre font-bold text-sm md:text-base lg:text-xl pb-1 lg:pb-0"
      >
        <div
          class="{$exercicesParams.length <= 1
            ? 'hidden'
            : 'flex'} items-center justify-center h-4 lg:h-8 w-4 lg:w-6 bg-coopmaths-struct dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas font-light text-xs lg:text-lg mr-2 lg:mr-4"
        >
          {indiceExercice + 1}
        </div>
        {category}&#8239
        {#if id && id.length !== 0}
          {id}<span class="hidden xl:inline-flex xl:mx-1 font-bold"
            >&middot;</span
          >
        {/if}
      </div>
      {#key titleAddendum}
        <div
          id="exotitle-{indiceExercice}"
          class="flex items-center gap-x-1 text-sm md:text-base xl:text-lg pl-0
        {id && id.length !== 0 ? 'lg:pl-0' : 'lg:pl-4'}"
        >
          <div>
            {titleBase}
          </div>
          {#if titleAddendum}
            <span
              class="ml-2 flex justify-center items-center shrink-0 rounded-full h-5 w-5 bg-coopmaths-warn-900 text-coopmaths-canvas font-bold text-sm"
            >
              {titleAddendum}
            </span>
          {/if}
        </div>
      {/key}
    </div>
    <div
      class="print-hidden flex flex-col md:flex-row justify-start space-x-2 md:space-x-10 text-normal mt-1 text-xl lg:justify-end mr-1"
    >
      <div class="flex flex-row justify-start items-center">
        <!-- <button
          class="mx-2 tooltip tooltip-left"
          data-tip={isMessagesVisible ? "Masquer les messages" : "Montrer les messages"}
          type="button"
          on:click={() => {
            isMessagesVisible = !isMessagesVisible
            dispatch("clickMessages", { isMessagesVisible })
          }}
        >
          <i class="bx {isMessagesVisible ? 'bxs-bulb' : 'bx-bulb'}" />
        </button> -->
        <button
          class="mx-2 tooltip tooltip-left tooltip-neutral {correctionExists &&
          correctionReady
            ? ''
            : 'hidden'}"
          data-tip={isCorrectionVisible
            ? 'Masquer la correction'
            : 'Montrer la correction'}
          type="button"
          aria-label="Afficher / Masquer la correction"
          on:click={() => {
            isCorrectionVisible = !isCorrectionVisible
            dispatch('clickCorrection', {
              isCorrectionVisible,
              isContentVisible,
            })
          }}
        >
          <i
            class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx {isCorrectionVisible
              ? 'bxs-check-circle'
              : 'bx-check-circle'}"
          ></i>
        </button>
        {#if interactifReady && !interactifObligatoire}
          <button
            class="mx-2 tooltip tooltip-left tooltip-neutral"
            data-tip={isInteractif
              ? "Désactiver l'interactivité"
              : 'Rendre interactif'}
            type="button"
            on:click={switchInteractif}
          >
            <InteractivityIcon isOnStateActive={isInteractif} />
          </button>
        {/if}
        <button
          class="mx-2 tooltip tooltip-left {randomReady ? '' : 'hidden'}"
          data-tip="Nouvel énoncé"
          type="button"
          aria-label="Nouvel énoncé"
          on:click={newData}
        >
          <i
            class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx bx-refresh"
          ></i>
        </button>
        {#if isHidable}
          <button
            type="button"
            on:click={() => {
              isVisible = !isVisible
              dispatch('clickVisible', { isVisible })
            }}
            class="mx-2 tooltip tooltip-left"
            data-tip=" {isVisible ? 'Masquer' : 'Montrer'} l'exercice"
            aria-label="Masquer / Montrer l'exercice"
          >
            <i
              class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx {isVisible
                ? 'bx-hide'
                : 'bx-show'}"
            ></i>
          </button>
        {/if}
        <button
          class="mx-2 tooltip tooltip-left tooltip-neutral"
          data-tip="Dupliquer l'exercice"
          type="button"
          aria-label="Dupliquer l'exercice"
          on:click={duplicate}
        >
          <i
            class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx bx-duplicate"
          ></i>
        </button>
        {#if isDeletable}
          <button
            class="mx-2 tooltip tooltip-left tooltip-neutral"
            data-tip="Supprimer l'exercice"
            type="button"
            aria-label="Supprimer"
            on:click={remove}
          >
            <i
              class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx bx-trash"
            ></i>
          </button>
        {/if}
        <button
          class="mx-2 tooltip tooltip-left tooltip-neutral {settingsReady
            ? ''
            : 'hidden'} "
          data-tip="Changer les paramètres de l'exercice"
          aria-label="Paramètres de l'exercice"
          type="button"
          on:click={() => {
            isSettingsVisible = !isSettingsVisible
            dispatch('clickSettings', { isSettingsVisible })
          }}
        >
          <i
            class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx bx-slider"
          ></i>
        </button>
        <button
          class="mx-2 tooltip tooltip-left tooltip-neutral"
          data-tip="Fichier PDF"
          aria-label="pdf"
          type="button"
          on:click={() => (showPdfDialog = true)}
        >
          <i
            class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx bxs-file-pdf"
          ></i>
        </button>
        {#if showPdfDialog}
          <PdfDialog {indiceExercice} onClose={() => (showPdfDialog = false)} />
        {/if}
      </div>
      <div
        class="flex flex-row justify-start items-center space-x-4 md:space-x-1"
      >
        {#if isSortable}
          <BoutonMonter indice={indiceExercice} />
          <BoutonDescendre indice={indiceExercice} {indiceLastExercice} />
        {/if}
      </div>
    </div>
  </h1>
</div>
