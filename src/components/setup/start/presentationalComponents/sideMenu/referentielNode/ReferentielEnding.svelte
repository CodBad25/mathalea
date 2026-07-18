<script lang="ts">
  import katex from 'katex'
  import { onDestroy, tick } from 'svelte'
  import {
    isExerciceItemInReferentiel,
    isGeoDynamic,
    isTool,
    resourceHasMonth,
    resourceHasPlace,
    type JSONReferentielEnding,
  } from '../../../../../../lib/types/referentiels'
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  import { mathaleaGenerateSeed } from '../../../../../../lib/mathalea'
  import { scrollToLastExercise } from '../../../../../../lib/scrollToLastExercise'
  import {
    changes,
    exercicesParams,
  } from '../../../../../../lib/stores/generalStore'
  import { globalOptions } from '../../../../../../lib/stores/globalOptions'
  import type { InterfaceParams } from '../../../../../../lib/types'
  import { isLessThan1Month } from '../../../../../../lib/types/dates'
  import SelectedIndicator from '../../../../../shared/forms/SelectedIndicator.svelte'
  import NoInteractivityIcon from '../../../../../shared/icons/NoInteractivityIcon.svelte'
  import QcmCamIcon from '../../../../../shared/icons/QcmCamIcon.svelte'

  export let ending: JSONReferentielEnding
  export let nestedLevelCount: number

  let nomDeExercice: HTMLDivElement
  let selectedCount: number
  /* --------------------------------------------------------------
    Gestions des exercices via la liste
   --------------------------------------------------------------- */
  /**
   * Compare les paramètres d'un exercice à la ressource courante.
   * Les exercices MathALÉA et les outils sont distingués par `id` car
   * plusieurs références peuvent partager un même `uuid`.
   * @param {InterfaceParams} item l'exercice sélectionné à comparer à la ressource courante
   * @returns {boolean} `true` si les deux ressources sont égales
   */
  const isMatchingEnding = (item: InterfaceParams): boolean => {
    if (item.uuid !== ending.uuid) return false
    if (isExerciceItemInReferentiel(ending) || isTool(ending)) {
      return item.id === ending.id
    }
    return true
  }
  /**
   * Compte le nombre de fois où la ressource a été sélectionnée
   * @returns {number} nb d'occurences
   */
  const countOccurences = (): number => {
    return $exercicesParams.filter(isMatchingEnding).length
  }
  // on compte réactivement le nombre d'occurences
  // de l'exercice dans la liste des sélectionnés
  const unsubscribeToExerciceParams = exercicesParams.subscribe(() => {
    tick().then(() => {
      selectedCount = countOccurences()
    })
  })

  let endingTitre = ''

  $: {
    if (isExerciceItemInReferentiel(ending)) {
      endingTitre = ending.titre
      if (endingTitre.includes('$')) {
        const regexp = /(['$])(.*?)\1/g
        const matchs = endingTitre.match(regexp)
        matchs?.forEach((match) => {
          endingTitre = endingTitre.replace(
            match,
            katex.renderToString(match.replaceAll('$', '')),
          )
        })
      }
    }
    selectedCount = countOccurences()
  }

  onDestroy(unsubscribeToExerciceParams)

  /**
   * Ajouter l'exercice courant à la liste
   */
  function addToList() {
    const newExercise = {
      uuid: ending.uuid,
      alea: mathaleaGenerateSeed(),
    } as InterfaceParams
    if (isGeoDynamic(ending)) newExercise.interactif = '1'
    if (isExerciceItemInReferentiel(ending) || isTool(ending)) {
      newExercise.id = ending.id
    }
    if (
      $globalOptions.recorder === 'capytale' ||
      $globalOptions.setInteractive === '1'
    ) {
      newExercise.interactif = '1'
    }
    exercicesParams.update((list) => [...list, newExercise])
    $changes++
    // On attend le rendu du DOM puis on fait défiler jusqu'au nouvel
    // exercice ajouté pour le rendre visible.
    tick().then(scrollToLastExercise)
  }
  /**
   * Retirer l'exercice de la liste (si plusieurs occurences
   * la première est retirée)
   */
  function removeFromList() {
    const matchingIndex = $exercicesParams.findIndex(isMatchingEnding)
    if (matchingIndex === -1) return
    exercicesParams.update((list) => [
      ...list.slice(0, matchingIndex),
      ...list.slice(matchingIndex + 1),
    ])
    $changes--
  }

  function handleDragStart(event: DragEvent) {
    if (!(isExerciceItemInReferentiel(ending) || isTool(ending))) return
    if (!event.dataTransfer) return

    const payload = JSON.stringify({
      uuid: ending.uuid,
      id: ending.id,
    })

    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/x-mathalea-exercise', payload)
    event.dataTransfer.setData('text/plain', payload)
  }
</script>

<!--
  @component
  Composant destiné à afficher les terminaisons des branches d'un référentiel.

  #### Paramètres
  **ending** (_JSONReferentielEnding_) : l'objet représentant la terminaison
  **nestedLevelCount** (_number_) : compteur du niveau d'imbrication (utilisé pour la mise en page)
 -->
<div
  class={`${$$props.class || ''} w-full flex flex-row mr-4 text-start items-start text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark`}
  style="padding-left: {(nestedLevelCount * 2) / 6}rem"
>
  <div
    class={`w-full relative inline-flex text-start justify-start items-start hover:bg-coopmaths-action-light dark:hover:bg-coopmathsdark-action-light dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest ${selectedCount >= 1 ? 'bg-coopmaths-warn dark:bg-coopmathsdark-warn' : 'bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest'} cursor-pointer`}
  >
    <button
      type="button"
      on:click={addToList}
      draggable="true"
      on:dragstart={handleDragStart}
      class="ml-0.75 pl-2 pr-4 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas dark:hover:bg-coopmathsdark-canvas-darkest flex-1"
    >
      <div bind:this={nomDeExercice} class="flex flex-row justify-start">
        {#if isExerciceItemInReferentiel(ending)}
          <!-- Exercice MathALÉA -->
          <div
            class="text-start text-coopmaths-corpus dark:text-coopmathsdark-corpus bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas dark:hover:bg-coopmathsdark-canvas-darkest"
          >
            <span class="font-bold">{ending.id} - </span>
            {@html endingTitre}
            {#if isLessThan1Month(ending.datePublication)}
              &nbsp;
              <span
                class="tooltip tooltip-bottom tooltip-neutral"
                data-tip={ending.datePublication}
              >
                <span
                  class="inline-flex flex-wrap items-center justify-center rounded-full bg-coopmaths-warn-dark dark:bg-coopmathsdark-warn-dark text-coopmaths-canvas dark:text-coopmathsdark-canvas text-[0.6rem] px-2 ml-2 font-semibold leading-normal"
                >
                  NEW
                </span>
              </span>
            {/if}
            {#if isLessThan1Month(ending.dateModification)}
              &nbsp;
              <span
                class="tooltip tooltip-bottom tooltip-neutral"
                data-tip={ending.dateModification}
              >
                <span
                  class="tooltip tooltip-bottom tooltip-neutral
                  inline-flex flex-wrap items-center justify-center rounded-full bg-coopmaths-struct-light dark:bg-coopmathsdark-struct-light text-coopmaths-canvas dark:text-coopmathsdark-canvas text-[0.6rem] px-2 ml-2 font-semibold leading-normal"
                >
                  MAJ
                </span>
              </span>
            {/if}
            {#if ending.features.qcmcam}
              &nbsp;
              <span
                class="tooltip tooltip-bottom tooltip-neutral"
                data-tip="Export QCM Cam Disponible"
              >
                <QcmCamIcon
                  class="inline-flex h-3 w-3 text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark fill-coopmaths-warn-dark dark:fill-coopmathsdark-warn-dark stroke-coopmaths-warn-dark dark:stroke-coopmathsdark-warn-dark"
                />
              </span>
            {/if}
            {#if !ending.features.interactif?.isActive}
              &nbsp;<span
                class="tooltip tooltip-bottom tooltip-neutral"
                data-tip="Pas d'interactivité"
              >
                <NoInteractivityIcon
                  class="inline-flex h-3 w-3 text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark fill-coopmaths-warn-dark dark:fill-coopmathsdark-warn-dark stroke-coopmaths-warn-dark dark:stroke-coopmathsdark-warn-dark"
                />
              </span>
            {/if}
          </div>
        {:else if resourceHasPlace(ending)}
          <!-- Exercices d'annales -->
          <div class="text-start">
            <span class="font-bold">
              {ending.typeExercice.toUpperCase()}
              {#if resourceHasMonth(ending)}
                {ending.mois}
              {/if}
              {ending.annee}
              {ending.lieu}
              {#if ending.jour !== undefined}
                [{ending.jour === 'J1' ? 'Sujet 1' : 'Sujet 2'}]
              {/if}
              - {ending.numeroInitial}
            </span>
            <div class="pl-2">
              {#each ending.tags as tag}
                <span
                  class="inline-flex flex-wrap items-center justify-center rounded-full bg-coopmaths-struct-light dark:bg-coopmathsdark-struct-light text-coopmaths-canvas dark:text-coopmathsdark-canvas text-[0.6rem] px-2 py-px leading-snug font-semibold mr-1"
                >
                  {tag}
                </span>
              {/each}
            </div>
          </div>
        {:else if isTool(ending)}
          <!-- Outils -->
          <div
            class="text-start text-coopmaths-corpus dark:text-coopmathsdark-corpus bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark hover:bg-coopmaths-canvas dark:hover:bg-coopmathsdark-canvas-darkest"
          >
            <span class="font-bold">{ending.id} - </span>{ending.titre}
          </div>
        {:else if 'titre' in ending && ending.titre}
          <!-- Exercice statique avec titre (ex. ressources partenaires MathAdata) -->
          <div
            class="text-start text-coopmaths-corpus dark:text-coopmathsdark-corpus"
          >
            {ending.titre}
          </div>
        {:else}
          <!-- Exercice de la bibliothèque -->
          <div
            class="text-start text-coopmaths-corpus dark:text-coopmathsdark-corpus"
          >
            <span class="font-bold">{ending.uuid}</span>
          </div>
        {/if}
      </div>
    </button>

    <!-- Bouton en début de ligne pour visualiser si l'exo est sélectionné,
        combien de fois et pour éventuellement le retirer de la sélection -->
    <SelectedIndicator {selectedCount} on:remove={removeFromList} />
  </div>
</div>
