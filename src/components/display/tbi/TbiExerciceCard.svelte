<script lang="ts">
  import seedrandom from 'seedrandom'
  import { onDestroy, onMount, tick } from 'svelte'
  import ExerciceSimple from '../../../exercices/ExerciceSimple'
  import {
    mathaleaFormatExercice,
    mathaleaHandleExerciceSimple,
    mathaleaHandleSup,
    mathaleaRenderDiv,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea'
  import { exercicesParams } from '../../../lib/stores/generalStore'
  import {
    TBI_MAX_ZOOM,
    TBI_MIN_ZOOM,
    moveCardToTab,
    tbiState,
  } from '../../../lib/stores/tbiStore'
  import type { IExercice } from '../../../lib/types'
  import BasicClassicModal from '../../shared/modal/BasicClassicModal.svelte'
  import Settings from '../../shared/exercice/exerciceMathalea/exerciceMathaleaVueProf/presentationalComponents/Settings.svelte'
  import TbiCardActions from './TbiCardActions.svelte'
  import type { TbiCorrectionMode } from './tbiTypes'

  interface Props {
    exercise: IExercice
    paramsIndex: number
    /** Menu « Déplacer vers un onglet » (mode onglets uniquement) */
    showMoveToTab?: boolean
    tabsCount?: number
    /** Indice compact de l'onglet courant (mode onglets) */
    currentTab?: number
    /** Flèches de réordonnancement (dispositions liste et colonnes) */
    showReorder?: boolean
    canMoveUp?: boolean
    canMoveDown?: boolean
    /** Bouton de saut de colonne (dispositions en colonnes) */
    showColumnBreak?: boolean
    /** Nombre maximal de sauts de colonne atteint : désactive l'ajout (pas le retrait) */
    columnBreakDisabled?: boolean
    /** Demande de réordonnancement, traitée par la vue TBI */
    onReorder?: (paramsIndex: number, delta: -1 | 1) => void
    /** Demande de suppression, traitée par la vue TBI */
    onDelete?: (paramsIndex: number) => void
  }

  let {
    exercise,
    paramsIndex,
    showMoveToTab = false,
    tabsCount = 0,
    currentTab = 0,
    showReorder = false,
    canMoveUp = false,
    canMoveDown = false,
    showColumnBreak = false,
    columnBreakDisabled = false,
    onReorder = () => {},
    onDelete = () => {},
  }: Props = $props()

  let correctionMode: TbiCorrectionMode = $state('hidden')
  let isSettingsModalDisplayed = $state(false)
  /** Incrémenté à chaque régénération pour ré-injecter le HTML */
  let version = $state(0)

  let zoom = $derived($tbiState.cards[paramsIndex]?.zoom ?? 1)
  let colBreakActive = $derived($tbiState.cards[paramsIndex]?.colBreak ?? false)

  let settingsExist = $derived(
    exercise.nbQuestionsModifiable ||
      exercise.correctionDetailleeDisponible ||
      Boolean(exercise.seed) ||
      Boolean(exercise.besoinFormulaireCaseACocher) ||
      Boolean(exercise.besoinFormulaireNumerique) ||
      Boolean(exercise.besoinFormulaireTexte) ||
      Boolean(exercise.besoinFormulaire2CaseACocher) ||
      Boolean(exercise.besoinFormulaire2Numerique) ||
      Boolean(exercise.besoinFormulaire2Texte) ||
      Boolean(exercise.besoinFormulaire3CaseACocher) ||
      Boolean(exercise.besoinFormulaire3Numerique) ||
      Boolean(exercise.besoinFormulaire3Texte) ||
      Boolean(exercise.besoinFormulaire4CaseACocher) ||
      Boolean(exercise.besoinFormulaire4Numerique) ||
      Boolean(exercise.besoinFormulaire4Texte) ||
      Boolean(exercise.besoinFormulaire5CaseACocher) ||
      Boolean(exercise.besoinFormulaire5Numerique) ||
      Boolean(exercise.besoinFormulaire5Texte) ||
      Boolean(exercise.besoinFormulaireNombresCategories) ||
      Boolean(exercise.besoinFormulaireComplexe),
  )

  /**
   * Action de rendu : typeset KaTeX + redimensionnement des figures via
   * mathaleaRenderDiv. Le contenu est ré-injecté par un {#key version} et
   * l'action se ré-exécute au changement de zoom.
   */
  function renderMath(node: HTMLElement, currentZoom: number) {
    mathaleaRenderDiv(node, currentZoom)
    return {
      update(newZoom: number) {
        mathaleaRenderDiv(node, newZoom)
      },
    }
  }

  function openDialog(node: HTMLDialogElement) {
    node.showModal()
    return {
      destroy() {
        node.close()
      },
    }
  }

  async function updateDisplay() {
    if (exercise.seed === undefined) {
      exercise.applyNewSeed?.()
    }
    seedrandom(exercise.seed, { global: true })
    exercise.numeroExercice = paramsIndex
    exercise.interactif = false
    if (exercise.typeExercice === 'simple') {
      mathaleaHandleExerciceSimple(exercise, false, paramsIndex)
    } else if (typeof exercise.nouvelleVersionWrapper === 'function') {
      exercise.nouvelleVersionWrapper(paramsIndex)
    }
    exercicesParams.update((list) => {
      if (list[paramsIndex] && list[paramsIndex].alea !== exercise.seed) {
        list[paramsIndex].alea = exercise.seed
      }
      return list
    })
    mathaleaUpdateUrlFromExercicesParams()
    version += 1
    await tick()
    // Evènement utilisé par certains exercices (pointCliquable...)
    document.dispatchEvent(new window.Event('exercicesAffiches', { bubbles: true }))
  }

  async function newData() {
    if (typeof exercise.applyNewSeed === 'function') {
      exercise.applyNewSeed()
    }
    await updateDisplay()
  }

  function handleNewSettings(event: CustomEvent) {
    const detail = event.detail
    exercicesParams.update((list) => {
      const interfaceParams = list[paramsIndex]
      if (!interfaceParams) return list
      if (detail.nbQuestions) {
        exercise.nbQuestions = detail.nbQuestions
        interfaceParams.nbQuestions = exercise.nbQuestions
      }
      if (detail.duration) {
        exercise.duration = detail.duration
        interfaceParams.duration = exercise.duration
      }
      for (const supName of ['sup', 'sup2', 'sup3', 'sup4', 'sup5'] as const) {
        if (detail[supName] !== undefined) {
          exercise[supName] = detail[supName]
          interfaceParams[supName] = mathaleaHandleSup(exercise[supName])
        }
      }
      if (detail.versionQcm !== undefined && exercise instanceof ExerciceSimple) {
        exercise.versionQcm = detail.versionQcm
        interfaceParams.versionQcm = exercise.versionQcm ? '1' : '0'
      }
      if (detail.alea !== undefined) {
        exercise.seed = detail.alea
        interfaceParams.alea = exercise.seed
      }
      if (detail.correctionDetaillee !== undefined) {
        exercise.correctionDetaillee = detail.correctionDetaillee
        interfaceParams.cd = exercise.correctionDetaillee ? '1' : '0'
      }
      return list
    })
    updateDisplay()
  }

  function toggleColBreak() {
    // garde-fou défensif : l'ajout est déjà désactivé côté bouton
    // (columnBreakDisabled) une fois le nombre maximal de sauts atteint
    if (!colBreakActive && columnBreakDisabled) return
    tbiState.update((state) => {
      const cardState = state.cards[paramsIndex]
      if (cardState) cardState.colBreak = !cardState.colBreak
      return state
    })
  }

  function zoomBy(delta: number) {
    tbiState.update((state) => {
      const cardState = state.cards[paramsIndex]
      if (cardState) {
        cardState.zoom = Math.min(
          TBI_MAX_ZOOM,
          Math.max(TBI_MIN_ZOOM, cardState.zoom + delta),
        )
      }
      return state
    })
  }

  onMount(() => {
    document.addEventListener('newDataForAll', newData)
    updateDisplay()
  })

  onDestroy(() => {
    document.removeEventListener('newDataForAll', newData)
  })
</script>

<section
  class="group relative w-full rounded-lg border border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest bg-coopmaths-canvas dark:bg-coopmathsdark-canvas shadow-sm"
>
  <header
    class="flex flex-row items-baseline gap-2 px-3 pt-2 text-coopmaths-struct dark:text-coopmathsdark-struct"
  >
    <span class="font-bold text-sm">{exercise.id?.replace('.js', '').replace('.ts', '') ?? ''}</span>
    <span class="text-xs font-light truncate">{exercise.titre}</span>
  </header>
  {#key version}
    <!--
      Regroupé sous la même clé que l'article : exercise (listeCorrections,
      seed...) est un objet mutable, pas un $state, donc ces props ne se
      réévalueraient pas seules après une régénération sans ce recalage
      forcé sur `version`.
    -->
    <div
      class="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
    >
      <TbiCardActions
        {correctionMode}
        correctionExists={exercise.listeCorrections.length > 0}
        {settingsExist}
        newDataExists={!exercise.pasDeVersionAleatoire}
        {showMoveToTab}
        {tabsCount}
        {currentTab}
        {showReorder}
        {canMoveUp}
        {canMoveDown}
        {showColumnBreak}
        {columnBreakDisabled}
        {colBreakActive}
        onCorrection={(mode) => (correctionMode = mode)}
        onNewData={newData}
        onSettings={() => (isSettingsModalDisplayed = true)}
        onZoomIn={() => zoomBy(0.1)}
        onZoomOut={() => zoomBy(-0.1)}
        onMoveToTab={(tab) => moveCardToTab(paramsIndex, tab)}
        onMoveUp={() => onReorder(paramsIndex, -1)}
        onMoveDown={() => onReorder(paramsIndex, 1)}
        onToggleColBreak={toggleColBreak}
        onDelete={() => onDelete(paramsIndex)}
      />
    </div>

    <article class="px-3 pb-3 text-coopmaths-corpus dark:text-coopmathsdark-corpus">
      {#if correctionMode !== 'replace'}
        <div use:renderMath={zoom}>
          {#if exercise.consigne && exercise.consigne.length > 0}
            <p class="mt-2 mb-2">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html mathaleaFormatExercice(exercise.consigne)}
            </p>
          {/if}
          {#if exercise.introduction}
            <p class="mt-2 mb-2">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html exercise.introduction}
            </p>
          {/if}
          <ul
            class="{exercise.listeQuestions.length === 1 ||
            !exercise.listeAvecNumerotation
              ? 'list-none'
              : 'numbered-list'} w-full list-inside marker:text-coopmaths-struct dark:marker:text-coopmathsdark-struct marker:font-bold"
          >
            {#each exercise.listeQuestions as question, i (i)}
              <li
                id="exercice{paramsIndex}Q{i}"
                class="py-1 overflow-x-auto"
                style="line-height: {exercise.spacing || 1}"
              >
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html mathaleaFormatExercice(question)}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      {#if correctionMode === 'below' || correctionMode === 'replace'}
        <div
          class="relative border-l-coopmaths-struct dark:border-l-coopmathsdark-struct border-l-[3px] mt-6 py-2 pl-4"
          use:renderMath={zoom}
        >
          <div
            class="absolute flex flex-row py-[1.5px] px-3 rounded-t-md justify-center items-center -left-0.75 -top-3.75 bg-coopmaths-struct dark:bg-coopmathsdark-struct font-semibold text-xs text-coopmaths-canvas dark:text-coopmathsdark-canvas"
          >
            Correction
          </div>
          {#if exercise.consigneCorrection && exercise.consigneCorrection.length > 0}
            <p class="mb-2 font-light">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html exercise.consigneCorrection}
            </p>
          {/if}
          <ul
            class="{exercise.listeCorrections.length === 1 ||
            !exercise.listeAvecNumerotation
              ? 'list-none'
              : 'numbered-list'} w-full list-inside marker:text-coopmaths-struct dark:marker:text-coopmathsdark-struct marker:font-bold"
          >
            {#each exercise.listeCorrections as correction, i (i)}
              <li
                class="py-1 overflow-x-auto"
                style="line-height: {exercise.spacingCorr || 1}"
              >
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html mathaleaFormatExercice(correction)}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </article>

    {#if correctionMode === 'modal'}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <dialog
        class="m-auto w-[95vw] h-[90vh] max-w-none rounded-xl p-6 overflow-y-auto
          text-coopmaths-corpus dark:text-coopmathsdark-corpus
          bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
        use:openDialog
        onclick={(event) => {
          if (event.target === event.currentTarget) correctionMode = 'hidden'
        }}
        onclose={() => (correctionMode = 'hidden')}
      >
        <button
          type="button"
          class="absolute top-3 right-3 text-coopmaths-action hover:text-coopmaths-action-darkest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-darkest"
          aria-label="Fermer la correction"
          onclick={() => (correctionMode = 'hidden')}
        >
          <i class="bx bx-x text-3xl"></i>
        </button>
        <h2
          class="mb-4 text-xl font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
        >
          Correction — {exercise.id?.replace('.js', '').replace('.ts', '') ?? ''}
        </h2>
        <div use:renderMath={Math.max(zoom, 1.2)}>
          {#if exercise.consigneCorrection && exercise.consigneCorrection.length > 0}
            <p class="mb-2 font-light">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html exercise.consigneCorrection}
            </p>
          {/if}
          <ul
            class="{exercise.listeCorrections.length === 1 ||
            !exercise.listeAvecNumerotation
              ? 'list-none'
              : 'numbered-list'} w-full list-inside marker:text-coopmaths-struct dark:marker:text-coopmathsdark-struct marker:font-bold"
          >
            {#each exercise.listeCorrections as correction, i (i)}
              <li class="py-1" style="line-height: {exercise.spacingCorr || 1}">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html mathaleaFormatExercice(correction)}
              </li>
            {/each}
          </ul>
        </div>
      </dialog>
    {/if}
  {/key}

  {#if isSettingsModalDisplayed}
    <BasicClassicModal bind:isDisplayed={isSettingsModalDisplayed}>
      <span slot="header"
        >{exercise.id?.replace('.js', '').replace('.ts', '') ?? ''}</span
      >
      <div slot="content" class="text-left">
        <Settings
          exercice={exercise}
          exerciceIndex={paramsIndex}
          inModal={true}
          on:settings={handleNewSettings}
          on:clickSettings={() => (isSettingsModalDisplayed = false)}
        />
      </div>
    </BasicClassicModal>
  {/if}
</section>
