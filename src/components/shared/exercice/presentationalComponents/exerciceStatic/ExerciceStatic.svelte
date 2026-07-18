<script lang="ts">
  import HeaderExerciceVueProf from '../../shared/headerExerciceVueProf/HeaderExerciceVueProf.svelte'
  import HeaderExerciceVueEleve from '../shared/HeaderExerciceVueEleve.svelte'
  import ButtonTextAction from '../../../forms/ButtonTextAction.svelte'
  import {
    computeStaticExercicePngUrls,
    retrieveResourceFromUuid,
  } from '../../../../../lib/components/refUtils'
  import {
    resourceHasPlace,
    isStaticType,
    type JSONReferentielObject,
    isCrpeType,
  } from '../../../../../lib/types/referentiels'
  /**
   * Gestion du référentiel pour la recherche de l'uuid
   */
  import referentielStaticFR from '../../../../../json/referentielStaticFR.json'
  import referentielStaticCH from '../../../../../json/referentielStaticCH.json'

  import referentielBibliotheque from '../../../../../json/referentielBibliotheque.json'
  import { referentielMathadata } from '../../../../../lib/components/mathadataReferentiel'
  import { isMenuNeededForExercises } from '../../../../../lib/stores/generalStore'
  import { globalOptions } from '../../../../../lib/stores/globalOptions'
  import type { HeaderProps } from '../../../../../lib/types/ui'
  import type { VueType } from '../../../../../lib/VueType'
  // on rassemble les deux référentiel statique
  const allStaticReferentiels: JSONReferentielObject = {
    ...referentielBibliotheque,
    ...referentielStaticFR,
    ...referentielStaticCH,
    ...referentielMathadata,
  }
  // on supprime les entrées par thème qui entraîne des doublons
  delete allStaticReferentiels['Brevet des collèges par thème - APMEP']
  delete allStaticReferentiels['BAC par thème - APMEP']
  delete allStaticReferentiels['CRPE (2015-2019) par thème - COPIRELEM']
  delete allStaticReferentiels['CRPE (2022-2023) par thème']
  delete allStaticReferentiels['E3C par thème - APMEP']
  delete allStaticReferentiels['EVACOM par thème']

  export let uuid: string
  export let indiceExercice: number
  export let indiceLastExercice: number
  export let zoomFactor: string
  export let isSolutionAccessible: boolean
  export let vue: VueType | undefined = undefined
  const isVueEleve =
    vue === 'eleve' || vue === 'myriade' || vue === 'indices' || vue === 'indice'
  const foundResource = retrieveResourceFromUuid(allStaticReferentiels, uuid)
  const exercice = computeStaticExercicePngUrls(foundResource)
  const resourceToDisplay =
    isStaticType(foundResource) || isCrpeType(foundResource)
      ? { ...foundResource }
      : null
  let isCorrectionVisible = false
  let isContentVisible = true
  let title = ''
  if (resourceToDisplay !== null) {
    if (resourceHasPlace(resourceToDisplay)) {
      title = `${resourceToDisplay.typeExercice.toUpperCase()} ${
        resourceToDisplay.mois || ''
      } ${resourceToDisplay.annee} ${resourceToDisplay.lieu} ${resourceToDisplay.jour || ''} Ex ${resourceToDisplay.numeroInitial}`
    } else if ('titre' in resourceToDisplay && resourceToDisplay.titre) {
      title = resourceToDisplay.titre
    } else {
      title = resourceToDisplay.uuid
    }
  }
  let headerExerciceProps: HeaderProps
  if (resourceToDisplay !== null) {
    headerExerciceProps = {
      title,
      id: '',
      isInteractif: false,
      settingsReady: false,
      isSettingsVisible: false,
      interactifReady: false,
      indiceExercice,
      indiceLastExercice,
      randomReady: false,
      correctionReady: isSolutionAccessible,
    }
  }

  let noCorrectionAvailable = false

  function handleNoCorrectionAvailable() {
    noCorrectionAvailable = true
  }
</script>

{#if isVueEleve}
  <HeaderExerciceVueEleve
    {title}
    {indiceExercice}
    showNumber={indiceLastExercice > 0 &&
      $globalOptions.presMode !== 'un_exo_par_page'}
    isMenuNeededForExercises={$isMenuNeededForExercises}
    presMode={$globalOptions.presMode}
    seed={undefined}
  />
  {#if isSolutionAccessible}
    <div class="flex flex-row items-center ml-2 mb-2">
      <ButtonTextAction
        text={isCorrectionVisible ? 'Masquer la correction' : 'Voir la correction'}
        icon={isCorrectionVisible ? 'bx-hide' : 'bx-show'}
        class="py-[2px] px-2 text-[0.7rem]"
        inverted={true}
        on:click={() => (isCorrectionVisible = !isCorrectionVisible)}
      />
    </div>
  {/if}
{:else}
  <HeaderExerciceVueProf
    {...headerExerciceProps}
    {indiceExercice}
    {indiceLastExercice}
    on:clickCorrection={(event) => {
      isCorrectionVisible = event.detail.isCorrectionVisible
    }}
    on:clickVisible={(event) => {
      isContentVisible = event.detail.isVisible
      isCorrectionVisible = event.detail.isVisible
    }}
    on:exerciseRemoved
  />
{/if}

<div class="p-4">
  {#if isContentVisible}
    {#if exercice}
      {#each exercice.png as url}
        <img
          src={url}
          class="mb-6"
          style="width: calc(100% * {zoomFactor})"
          alt="énoncé"
        />
      {/each}
    {/if}
  {/if}

  {#if isCorrectionVisible}
    <div
      class="relative border-l-coopmaths-struct dark:border-l-coopmathsdark-struct border-l-[3px] text-coopmaths-corpus dark:text-coopmathsdark-corpus mt-6 lg:mt-2 mb-6 py-2 pl-4"
      id="correction{indiceExercice}"
    >
      <div class="container">
        {#if exercice}
          {#each exercice.pngCor as url}
            {#if noCorrectionAvailable}
              <p class="text-red-500">Aucune correction disponible</p>
            {:else}
              <img
                src={url}
                class="p-2"
                style="width: calc(100% * {zoomFactor})"
                alt="correction"
                on:error={handleNoCorrectionAvailable}
              />
            {/if}
          {/each}
        {/if}
      </div>
      <!-- <div class="absolute border-coopmaths-struct dark:border-coopmathsdark-struct top-0 left-0 border-b-[3px] w-10" /> -->
      <div
        class="absolute flex flex-row py-[1.5px] px-3 rounded-t-md justify-center items-center -left-[3px] -top-[15px] bg-coopmaths-struct dark:bg-coopmathsdark-struct font-semibold text-xs text-coopmaths-canvas dark:text-coopmathsdark-canvas"
      >
        Correction
      </div>
      <div
        class="absolute border-coopmaths-struct dark:border-coopmathsdark-struct bottom-0 left-0 border-b-[3px] w-4"
      ></div>
    </div>
  {/if}
</div>
