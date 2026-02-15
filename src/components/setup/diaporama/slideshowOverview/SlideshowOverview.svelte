<script lang="ts">
  import { tick } from 'svelte'
  import {
    mathaleaGenerateSeed,
    mathaleaRenderDiv,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../../lib/mathalea'
  import {
    darkMode,
    exercicesParams,
  } from '../../../../lib/stores/generalStore'
  import { globalOptions } from '../../../../lib/stores/globalOptions'
  import type { IExercice, InterfaceParams } from '../../../../lib/types'
  import { isIntegerInRange0to4 } from '../../../../lib/types/integerInRange'
  import ZoomButtons from '../../start/presentationalComponents/header/headerButtons/setupButtons/ZoomButtons.svelte'
  import type { Serie, Slideshow } from '../types'
  import SlideshowOverviewLeftPanel from './presentationalComponent/SlideshowOverviewLeftPanel.svelte'
  import SlideshowOverviewMainPanel from './presentationalComponent/mainPanel/SlideshowOverviewMainPanel.svelte'

  export let exercises: IExercice[] = []
  export let slideshow: Slideshow
  export let updateExercises: (
    updateSlidesContent?: boolean,
    updateParamsFromUrl?: boolean,
  ) => void
  export let backToSettings: () => void

  let currentSeriesIndex: 0 | 1 | 2 | 3 | 4 = 0
  let isCorrectionVisible = false
  let isQuestionsVisible = true
  let divExercice: HTMLElement
  let correctionsSteps: number[] = []

  let nbVues: 0 | 1 | 2 | 3 | 4
  $: {
    const nbVuesCandidate = slideshow.slides[0].vues.length
    if (isIntegerInRange0to4(nbVuesCandidate)) {
      nbVues = nbVuesCandidate
    }
  }

  let order: number[]
  $: {
    const questionsNb =
      slideshow.selectedQuestionsNumber || slideshow.slides.length
    const slidesCount = slideshow.slides.length
    const rawOrder =
      $globalOptions.order === undefined || $globalOptions.order.length === 0
        ? [...Array(questionsNb).keys()]
        : $globalOptions.order
    // sanitized : supprimer les indices hors limites et les doublons pour éviter
    // le rendu de la même correction plusieurs fois (ordre obsolète provenant de
    // l'URL, de l'historique ou des cas limites de adjustQuestionsOrder).
    const seen = new Set<number>()
    const sanitized: number[] = []
    for (const idx of rawOrder) {
      if (idx >= 0 && idx < slidesCount && !seen.has(idx)) {
        seen.add(idx)
        sanitized.push(idx)
      }
    }
    order = sanitized.length > 0 ? sanitized : [...Array(questionsNb).keys()]
  }

  let series: Serie[] = []
  $: {
    series = []
    for (let i = 0; i < nbVues; i++) {
      const serie: Serie = {
        consignes: [],
        questions: [],
        corrections: [],
        keys: [],
      }
      for (const slide of slideshow.slides) {
        serie.consignes.push(slide.vues[i].consigne)
        serie.questions.push(slide.vues[i].question)
        serie.corrections.push(slide.vues[i].correction)
        serie.keys.push(slide.vues[i].key)
      }
      series.push(serie)
    }
  }

  $: if (
    (isQuestionsVisible ||
      isCorrectionVisible ||
      correctionsSteps.length > 0) &&
    currentSeriesIndex !== undefined
  ) {
    tick().then(() => mathaleaRenderDiv(divExercice))
  }

  function setCorrectionVisible(correctionVisibility: boolean) {
    isCorrectionVisible = correctionVisibility
    if (!isCorrectionVisible) {
      setQuestionsVisible(true)
    }
  }

  function setCurrentVue(vue: number) {
    if (isIntegerInRange0to4(vue)) {
      currentSeriesIndex = vue
    }
  }

  function setQuestionsVisible(questionsVisibility: boolean) {
    isQuestionsVisible = questionsVisibility
    if (!isQuestionsVisible) {
      setCorrectionVisible(true)
    }
  }

  function newDataForAll() {
    const newParams: InterfaceParams[] = []
    for (const exercice of exercises) {
      exercice.seed = mathaleaGenerateSeed()
      newParams.push({
        uuid: exercice.uuid,
        id: exercice.id,
        alea: exercice.seed.substring(0, 4),
        nbQuestions: exercice.nbQuestions,
        duration: exercice.duration,
      })
    }
    exercicesParams.set(newParams)
    updateExercises(true)
    mathaleaUpdateUrlFromExercicesParams($exercicesParams)
    isQuestionsVisible = true
    isCorrectionVisible = false
    correctionsSteps = []
  }

  /**
   * Gestion du pas à pas pour l'affichage des corrections
   * @param {string} button chaîne correspondant à la direction du pas à pas ("backward" ou "forward")
   */
  function handleCorrectionsStepsClick(button: 'backward' | 'forward') {
    if (button === 'backward') {
      if (correctionsSteps.length !== 0) {
        correctionsSteps.pop()
        correctionsSteps = correctionsSteps
      }
    }
    if (button === 'forward') {
      if (correctionsSteps.length < order.length) {
        correctionsSteps.push(order[correctionsSteps.length])
      }
      correctionsSteps = correctionsSteps
    }
  }

  function zoomUpdate(plusMinus: '+' | '-') {
    const oldZoom = Number($globalOptions.z || 1)
    const newZoom = Number(
      (plusMinus === '+' ? oldZoom + 0.1 : oldZoom - 0.1).toFixed(1),
    )
    $globalOptions.z = newZoom.toString()
    const main = document.querySelector('main')
    tick().then(() => mathaleaRenderDiv(main))
    mathaleaUpdateUrlFromExercicesParams()
  }
</script>

<div class={$darkMode.isActive ? 'dark' : ''}>
  <div
    class="fixed z-20 rounded-b-full rounded-t-full
    bottom-2 lg:bottom-6
    right-2 lg:right-6
    bg-coopmaths-canvas/80 dark:bg-coopmathsdark-canvas/80"
  >
    <div
      class="flex flex-col space-y-2
      scale-75 lg:scale-100"
    >
      <ZoomButtons {zoomUpdate} />
    </div>
  </div>
  <div
    class="flex
    bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
  >
    <aside class="h-screen sticky top-0">
      <SlideshowOverviewLeftPanel
        {isQuestionsVisible}
        {isCorrectionVisible}
        currentVue={currentSeriesIndex}
        nbOfVues={nbVues}
        {setCurrentVue}
        {setQuestionsVisible}
        {setCorrectionVisible}
        {handleCorrectionsStepsClick}
        {newDataForAll}
        {backToSettings}
      />
    </aside>
    <main
      class="flex flex-row p-2
      bg-coopmaths-canvas dark:bg-coopmathsdark-canvas
      text-coopmaths-corpus dark:text-coopmathsdark-corpus"
      bind:this={divExercice}
    >
      <SlideshowOverviewMainPanel
        {isQuestionsVisible}
        {isCorrectionVisible}
        {currentSeriesIndex}
        {order}
        {series}
        {correctionsSteps}
      />
    </main>
  </div>
</div>
