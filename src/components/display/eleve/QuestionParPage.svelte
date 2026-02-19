<script lang="ts">
  import { onMount, tick } from 'svelte'
  import seedrandom from 'seedrandom'
  import {
    buildExercisesList,
    splitExercisesIntoQuestions,
  } from '../../../lib/components/exercisesUtils'
  import { verifQuestionCliqueFigure } from '../../../lib/interactif/cliqueFigure'
  import { prepareExerciceCliqueFigure } from '../../../lib/interactif/gestionInteractif'
  import { verifQuestionMathLive } from '../../../lib/interactif/mathLive'
  import { verifQuestionQcm } from '../../../lib/interactif/qcm'
  import { verifQuestionListeDeroulante } from '../../../lib/interactif/questionListeDeroulante'
  import {
    mathaleaFormatExercice,
    mathaleaGenerateSeed,
    mathaleaHandleExerciceSimple,
    mathaleaHandleParamOfOneExercice,
    mathaleaLoadExerciceFromUuid,
    mathaleaRenderDiv,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea'
  import {
    exercicesParams,
    isMenuNeededForExercises,
    isMenuNeededForQuestions,
  } from '../../../lib/stores/generalStore'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import {
    isInteractivityType,
    isOldFormatInteractifType,
    type IExercice,
    type InteractivityType,
    type OldFormatInteractifType,
  } from '../../../lib/types'
  import { loadMathLive } from '../../../modules/loaders'
  import Exercice from '../../shared/exercice/Exercice.svelte'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import ButtonToggle from '../../shared/forms/ButtonToggle.svelte'

  /** Callback quand les questions sont prêtes */
  export let onQuestionsReady: (data: {
    questions: (string | IExercice)[]
  }) => void = () => {}

  /** Callback quand l'index courant change */
  export let onIndexChange: (data: { currentIndex: number }) => void = () => {}

  /** Callback quand les résultats changent */
  export let onResultsChange: (data: {
    resultsByQuestion: boolean[]
  }) => void = () => {}

  /** Index de la question courante */
  let currentIndex: number = 0

  /** Liste des questions (string ou IExercice) */
  let questions: (string | IExercice)[] = []

  /** Résultats par question */
  let resultsByQuestion: boolean[] = []

  /** Référence vers le conteneur racine du composant */
  let containerRef: HTMLDivElement

  /** Références vers les conteneurs de chaque question */
  const questionContainerRefs: HTMLDivElement[] = []

  let exercices: IExercice[] = []
  let consignes: string[] = []
  let corrections: string[] = []
  let consignesCorrections: string[] = []
  let indiceExercice: number[] = []
  let indiceQuestionInExercice: number[] = []
  let isDisabledButton: boolean[] = []
  let isCorrectionVisible: boolean[] = []
  const divsCorrection: HTMLDivElement[] = []

  async function buildQuestions() {
    const splitResults = splitExercisesIntoQuestions(exercices)
    questions = [...splitResults.questions]
    consignes = [...splitResults.consignes]
    corrections = [...splitResults.corrections]
    consignesCorrections = [...splitResults.consignesCorrections]
    isCorrectionVisible = [...splitResults.isCorrectionVisible]
    indiceExercice = [...splitResults.indiceExercice]
    indiceQuestionInExercice = [...splitResults.indiceQuestionInExercice]
    resultsByQuestion = []
    mathaleaUpdateUrlFromExercicesParams($exercicesParams)
    await tick()
    mathaleaRenderDiv(containerRef)
    loadMathLive()
    onQuestionsReady({ questions })
  }

  async function checkQuestion(i: number) {
    const exercice = exercices[indiceExercice[i]]
    let type: InteractivityType | OldFormatInteractifType | undefined =
      exercice.autoCorrection[indiceQuestionInExercice[i]]?.reponse?.param
        ?.formatInteractif
    if (type === undefined || type === null) {
      const interactifType = exercice.interactifType
      if (
        isInteractivityType(interactifType) ||
        isOldFormatInteractifType(interactifType)
      ) {
        type = interactifType
      }
    }
    if (type == null) {
      window.notify(
        'checkQuestion a été appelé pour un exercice non interactif',
        {
          exercice: exercice.uuid,
        },
      )
      resultsByQuestion[i] = false
      return
    }
    if (type.toLowerCase() === 'mathlive') {
      const resu = verifQuestionMathLive(
        exercices[indiceExercice[i]],
        indiceQuestionInExercice[i],
      )
      resultsByQuestion[i] =
        resu !== undefined && (resu.isOk === 'Ok' || resu.isOk === true)
    } else if (type === 'qcm') {
      resultsByQuestion[i] =
        verifQuestionQcm(
          exercices[indiceExercice[i]],
          indiceQuestionInExercice[i],
        ) === 'OK'
    } else if (type === 'listeDeroulante') {
      resultsByQuestion[i] =
        verifQuestionListeDeroulante(
          exercices[indiceExercice[i]],
          indiceQuestionInExercice[i],
        ) === 'OK'
    } else if (type === 'cliqueFigure') {
      resultsByQuestion[i] =
        verifQuestionCliqueFigure(
          exercices[indiceExercice[i]],
          indiceQuestionInExercice[i],
        ) === 'OK'
    } else if (type === 'custom') {
      resultsByQuestion[i] =
        exercices[indiceExercice[i]].correctionInteractive!(
          indiceQuestionInExercice[i],
        ) === 'OK'
    }
    resultsByQuestion = [...resultsByQuestion]
    isDisabledButton[i] = true
    isDisabledButton = [...isDisabledButton]
    isCorrectionVisible[i] = true
    isCorrectionVisible = [...isCorrectionVisible]
    await tick()
    const questionContainer = questionContainerRefs[i]
    if (questionContainer) {
      const feedback = questionContainer.querySelector<HTMLElement>(
        `#feedbackEx${indiceExercice[i]}Q${indiceQuestionInExercice[i]}`,
      )
      if (feedback != null) mathaleaRenderDiv(feedback)
    }
    mathaleaRenderDiv(divsCorrection[i])
    onResultsChange({ resultsByQuestion })
  }

  async function restart(k: number) {
    const exoIdx = indiceExercice[k]
    const questionInExo = indiceQuestionInExercice[k]
    const exercice = exercices[exoIdx]

    // Créer un exercice temporaire avec un nouveau seed
    // pour obtenir une nouvelle question sans toucher à l'exercice existant
    const newSeed = mathaleaGenerateSeed()
    const tempExercice = await mathaleaLoadExerciceFromUuid(
      $exercicesParams[exoIdx].uuid,
    )
    if (tempExercice === undefined) return
    mathaleaHandleParamOfOneExercice(tempExercice, {
      ...$exercicesParams[exoIdx],
      alea: newSeed,
    })
    tempExercice.numeroExercice = exoIdx
    if (tempExercice.typeExercice === 'simple') {
      mathaleaHandleExerciceSimple(
        tempExercice,
        tempExercice.interactif,
        exoIdx,
      )
    } else if (tempExercice.nouvelleVersionWrapper !== undefined) {
      seedrandom(tempExercice.seed, { global: true })
      tempExercice.nouvelleVersionWrapper(exoIdx)
    }

    // Extraire uniquement la nouvelle question ciblée
    const newQuestion = mathaleaFormatExercice(
      tempExercice.listeQuestions[questionInExo],
    )
    const newCorrection = mathaleaFormatExercice(
      tempExercice.listeCorrections[questionInExo],
    )

    // Mettre à jour l'exercice existant uniquement pour la question ciblée
    exercice.listeQuestions[questionInExo] =
      tempExercice.listeQuestions[questionInExo]
    exercice.listeCorrections[questionInExo] =
      tempExercice.listeCorrections[questionInExo]
    exercice.autoCorrection[questionInExo] =
      tempExercice.autoCorrection[questionInExo]

    // Mettre à jour uniquement les tableaux plats pour la question k
    questions[k] = newQuestion
    corrections[k] = newCorrection

    // Réinitialiser l'état uniquement pour la question k
    isDisabledButton[k] = false
    isCorrectionVisible[k] = false
    delete resultsByQuestion[k]

    // Forcer la réactivité Svelte
    questions = [...questions]
    corrections = [...corrections]
    isDisabledButton = [...isDisabledButton]
    isCorrectionVisible = [...isCorrectionVisible]
    resultsByQuestion = [...resultsByQuestion]

    await tick()
    // Rendre le contenu mathématique uniquement dans le container de la question ciblée
    const container = questionContainerRefs[k]
    if (container instanceof HTMLElement) {
      mathaleaRenderDiv(container)
    }
    loadMathLive()
    onResultsChange({ resultsByQuestion })
  }

  async function switchCorrectionVisible(i: number) {
    isCorrectionVisible[i] = !isCorrectionVisible[i]
    if (isCorrectionVisible[i]) {
      await tick()
      mathaleaRenderDiv(divsCorrection[i])
    }
  }

  /**
   * Gère le changement de question courante.
   * Appelé en interne ou par le parent via bind:this.
   */
  export async function handleIndexChange(k: number) {
    currentIndex = k
    onIndexChange({ currentIndex: k })
    await tick()
    const exo = exercices[indiceExercice[k]]
    const questionEvent = new CustomEvent('questionDisplay', {
      detail: {
        uuid: exo.uuid,
        exoNumber: indiceExercice[k],
        questionNumber: k,
      },
    })
    document.dispatchEvent(questionEvent)
    if (exo && exo.interactifType === 'cliqueFigure' && exo.interactif) {
      prepareExerciceCliqueFigure(exo)
    }
  }

  onMount(async () => {
    exercices = await Promise.all(buildExercisesList())
    await buildQuestions()
  })
</script>

<div bind:this={containerRef}>
  {#each questions as question, k (k + '_' + question)}
    <div class="flex flex-col">
      <div class={$isMenuNeededForQuestions ? '' : 'hidden'}>
        <button
          class="group w-full {currentIndex === k
            ? 'bg-coopmaths-canvas-darkest'
            : 'bg-coopmaths-canvas-dark'} hover:bg-coopmaths-canvas-darkest text-coopmaths-action hover:text-coopmaths-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-lightest"
          disabled={currentIndex === k}
          on:click={() => handleIndexChange(k)}
        >
          <div
            id="questionTitleID2{k}"
            class="flex flex-row items-center justify-center py-3 px-2 text-xl font-bold"
          >
            Question {k + 1}
            <span
              class="ml-2 text-sm"
              class:hidden={resultsByQuestion[k] !== true}>😎</span
            >
            <span
              class="ml-2 text-sm"
              class:hidden={resultsByQuestion[k] !== false}>☹️</span
            >
          </div>
        </button>
      </div>
      <div
        class={currentIndex === k ? '' : 'hidden'}
        id={`exercice${indiceExercice[k]}Q${k}`}
        bind:this={questionContainerRefs[k]}
      >
        <div
          class="pb-4 flex flex-col items-start justify-start relative {$isMenuNeededForQuestions
            ? 'lg:mt-2'
            : ''}"
        >
          {#if typeof questions[k] !== 'string'}
            {''}
            <Exercice
              paramsExercice={$exercicesParams[indiceExercice[k]]}
              indiceExercice={indiceExercice[k]}
              indiceLastExercice={$exercicesParams.length - 1}
              isCorrectionVisible={isCorrectionVisible[indiceExercice[k]]}
              toggleSidenav={() => {}}
            />
          {:else}
            <div
              class="container grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-10"
              style="font-size: {($globalOptions.z || 1).toString()}rem"
            >
              <div class="flex flex-col my-2 py-2">
                <div class="text-coopmaths-corpus pl-2">
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html consignes[k]}
                </div>
                <div class="text-coopmaths-corpus pl-2">
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html question}
                </div>
              </div>
              {#if isCorrectionVisible[k]}
                <div
                  class="relative border-l-coopmaths-struct dark:border-l-coopmathsdark-struct border-l-[3px] text-coopmaths-corpus dark:text-coopmathsdark-corpus mt-2 lg:{$isMenuNeededForQuestions
                    ? 'mt-6'
                    : 'mt-2'} mb-6 py-2 pl-4"
                  style="break-inside:avoid"
                  bind:this={divsCorrection[k]}
                >
                  {#if consignesCorrections[k].length !== 0}
                    <div
                      class="container bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark px-4 py-2 mr-2 ml-6 mb-2 font-light relative w-2/3"
                    >
                      <div class="container absolute top-4 -left-4">
                        <i
                          class="bx bx-bulb scale-200 text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
                        ></i>
                      </div>
                      <div class="">
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                        {@html consignesCorrections[k]}
                      </div>
                    </div>
                  {/if}
                  <div
                    class="container overflow-x-auto overflow-y-hidden md:overflow-x-auto"
                    style="break-inside:avoid"
                  >
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html mathaleaFormatExercice(corrections[k])}
                  </div>
                  <!-- <div class="absolute border-coopmaths-struct dark:border-coopmathsdark-struct top-0 left-0 border-b-[3px] w-10" /> -->
                  <div
                    class="absolute flex flex-row py-[1.5px] px-3 rounded-t-md justify-center items-center -left-0.75 -top-3.75 bg-coopmaths-struct dark:bg-coopmathsdark-struct font-semibold text-xs text-coopmaths-canvas dark:text-coopmathsdark-canvas"
                  >
                    Correction
                  </div>
                  <div
                    class="absolute border-coopmaths-struct dark:border-coopmathsdark-struct bottom-0 left-0 border-b-[3px] w-4"
                  ></div>
                </div>
              {/if}
            </div>
          {/if}
          {#if exercices[indiceExercice[k]].interactif && exercices[indiceExercice[k]].interactifReady}
            <div class="pb-4 mt-10" class:hidden={isDisabledButton[k]}>
              <ButtonTextAction
                text="Vérifier"
                on:click={() => checkQuestion(k)}
              />
            </div>
            <div
              class="pb-4 mt-10"
              class:hidden={!isDisabledButton[k] || $globalOptions.oneShot}
            >
              <ButtonTextAction
                text="Recommencer"
                on:click={() => restart(k)}
              />
            </div>
          {:else if $globalOptions.isSolutionAccessible && corrections[k]}
            <div class={$isMenuNeededForExercises ? 'ml-4' : ''}>
              <ButtonToggle
                titles={['Voir la correction', 'Masquer la correction']}
                on:toggle={() => switchCorrectionVisible(k)}
              />
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>
