<script lang="ts">
  import { afterUpdate, beforeUpdate, onDestroy, onMount, tick } from 'svelte'

  import {
    getCanvasFont,
    getTextWidth,
    remToPixels,
  } from '../../../lib/components/measures'
  import { resizeContent } from '../../../lib/components/sizeTools'
  import { handleFlowmath } from '../../../lib/handleFlowmath'
  import {
    mathaleaFormatExercice,
    mathaleaUpdateExercicesParamsFromUrl,
  } from '../../../lib/mathalea'
  import {
    darkMode,
    exercicesParams,
    isMenuNeededForExercises,
    isMenuNeededForQuestions,
    resultsByExercice,
  } from '../../../lib/stores/generalStore'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import { vendor } from '../../../lib/stores/vendorStore'
  import { type IExercice, type QuestionResult } from '../../../lib/types'

  import Keyboard from '../../keyboard/Keyboard.svelte'
  import { keyboardState } from '../../keyboard/stores/keyboardStore'
  import Exercice from '../../shared/exercice/Exercice.svelte'
  import BtnZoom from '../../shared/ui/btnZoom.svelte'
  import Banner from '../../shared/vendors/Banner.svelte'
  import FlipCard from './FlipCard.svelte'
  import Footer2 from './Footer2.svelte'
  import QuestionParPage from './QuestionParPage.svelte'

  let currentIndex: number = 0
  let questions: (string | IExercice)[] = []
  let consignes: string[] = []
  let corrections: string[] = []
  let resultsByQuestion: QuestionResult[] = []
  let isCorrectionVisible: boolean[] = []
  let currentWindowWidth: number = document.body.clientWidth
  let eleveSection: HTMLElement
  let questionParPageRef: QuestionParPage
  const brandImagePath = $vendor.brand.logoPath
  const productImagePath = $vendor.product.logoPath

  function urlToDisplay() {
    const urlOptions = mathaleaUpdateExercicesParamsFromUrl()
    globalOptions.update(() => {
      urlOptions.v = 'eleve'
      return urlOptions
    })
  }

  /**
   * Adaptation du titre des pages pour chaque exercice
   * Plus le nombre d'exercices est élevé, moins le titre contient de caractères
   * @param {numer} dim largeur disponible à considérer pour le calcul si élément non dispo (déclenche le re-calcul)
   * @param {number} nbOfExercises  nombre d'exercices
   * @returns {string} titre
   * @author sylvain
   */
  function buildExoTitle(dim: number, nbOfExercises: number) {
    if ($globalOptions.presMode === 'liste_exos' || nbOfExercises === 0) {
      return 'Exercice'
    }
    const navigationHeaderElt = document.getElementById('navigationHeaderID')
    const exerciseTitleElt = document.getElementById('exerciseTitleID0')
    // soit l'élément existe et on récupère sa vraie largeur, soit on calcule une valeur approchée
    const roomForQuestionsTitles = navigationHeaderElt
      ? navigationHeaderElt.offsetWidth
      : ((dim - 2 * remToPixels(1)) * 11) / 12
    const roomForOne =
      roomForQuestionsTitles / nbOfExercises - 2 * remToPixels(1.5)
    if (
      roomForOne >=
      getTextWidth(
        'Exercice 10',
        getCanvasFont(exerciseTitleElt ?? document.body),
      )
    ) {
      if ($isMenuNeededForExercises) $isMenuNeededForExercises = false
      return 'Exercice'
    } else if (
      roomForOne >=
      getTextWidth('Ex 10', getCanvasFont(exerciseTitleElt ?? document.body)) +
        20
    ) {
      if ($isMenuNeededForExercises) $isMenuNeededForExercises = false
      return 'Ex'
    } else if (
      roomForOne >=
      getTextWidth('10', getCanvasFont(exerciseTitleElt ?? document.body)) + 20
    ) {
      if ($isMenuNeededForExercises) $isMenuNeededForExercises = false
      return ''
    } else {
      if (!$isMenuNeededForExercises) $isMenuNeededForExercises = true
      return ''
    }
  }

  $: exerciseTitle = buildExoTitle(currentWindowWidth, $exercicesParams.length)

  /**
   * Adaptation du titre des pages pour chaque question
   * Plus le nombre de questions est élevé, moins le titre contient de caractères
   * @param {numer} dim largeur disponible à considérer pour le calcul si élément non dispo (déclenche le re-calcul)
   * @param {number} nbOfQuestions  nombre de questions
   * @returns {string} titre
   * @author sylvain
   */
  function buildQuestionTitle(dim: number, nbOfQuestions: number) {
    if ($globalOptions.presMode === 'liste_exos' || nbOfQuestions === 0) {
      return 'Question'
    }
    const navigationHeaderElt = document.getElementById('navigationHeaderID')
    const questionTitleElt = document.getElementById('questionTitleID0')
    // soit l'élément existe et on récupère sa vraie largeur, soit on calcule une valeur approchée
    const roomForQuestionsTitles = navigationHeaderElt
      ? navigationHeaderElt.offsetWidth
      : ((dim - 2 * remToPixels(1)) * 11) / 12
    const roomForOne =
      roomForQuestionsTitles / nbOfQuestions - 2 * remToPixels(0.5)
    if (
      roomForOne >=
      getTextWidth(
        'Question 10',
        getCanvasFont(questionTitleElt ?? document.body),
      )
    ) {
      $isMenuNeededForQuestions = false
      return 'Question'
    } else if (
      roomForOne >=
      getTextWidth('Q 10', getCanvasFont(questionTitleElt ?? document.body)) +
        20
    ) {
      $isMenuNeededForQuestions = false
      return 'Q'
    } else if (
      roomForOne >=
      getTextWidth('10', getCanvasFont(questionTitleElt ?? document.body)) + 20
    ) {
      $isMenuNeededForQuestions = false
      return ''
    } else {
      $isMenuNeededForQuestions = true
      return ''
    }
  }

  $: questionsCount = questions.length
  $: questionTitle = buildQuestionTitle(currentWindowWidth, questionsCount)

  let debug = false
  function log(str: string, level: number = 3) {
    if (debug || window.logDebug >= level) {
      console.info(str)
    }
  }

  exercicesParams.subscribe((value) => {
    log('exercicesParams changed: ' + JSON.stringify(value))
  })

  globalOptions.subscribe((value) => {
    log('globalOptions changed: ' + JSON.stringify(value))
  })

  beforeUpdate(() => {
    log('Eleve.svelte beforeUpdate')
  })

  afterUpdate(() => {
    log('Eleve.svelte afterUpdate')
    const starttime = window.performance.now()
    // Evènement indispensable pour pointCliquable par exemple
    const exercicesAffiches = new window.Event('exercicesAffiches', {
      bubbles: true,
    })
    document.dispatchEvent(exercicesAffiches)
    if (eleveSection) {
      const params = $globalOptions
      const zoom = Number(params.z) ?? 1
      resizeContent(eleveSection, zoom)
    }

    log(
      'Eleve.svelte afterUpdate done in ' +
        (window.performance.now() - starttime),
      2,
    )
  })

  let resizeObserver: ResizeObserver
  onMount(async () => {
    log('Eleve.svelte mount')

    // Pour FlowMath, on initialise d'abord le handler RPC AVANT de charger depuis l'URL
    // Car les exercices peuvent arriver via postMessage plutôt que via l'URL
    if ($globalOptions.recorder === 'flowmath') {
      handleFlowmath(exercicesParams, resultsByExercice)
    }

    // Si presMode est undefined cela signifie que l'on charge cet url
    // sinon en venant du modal il existerait
    if ($globalOptions.presMode === undefined) {
      const urlOptions = mathaleaUpdateExercicesParamsFromUrl()
      urlOptions.v = 'eleve'
      globalOptions.update(() => {
        return urlOptions
      })
      urlToDisplay()
    } else {
      // Si ce n'est pas un chargement d'url alors il faut initialiser le store des résultats
      if ($resultsByExercice.length > 0) {
        resultsByExercice.update(() => [])
      }
    }
    if ($globalOptions.setInteractive === '1') {
      for (const param of $exercicesParams) {
        if (param.interactif !== '1') {
          param.interactif = '1'
        }
      }
    }

    if (
      $globalOptions.recorder === 'capytale' ||
      $globalOptions.recorder === 'moodle' ||
      $globalOptions.recorder === 'anki' ||
      $globalOptions.recorder === 'labomep' ||
      $globalOptions.recorder === 'flowmath'
    ) {
      // attend la fin de la mise à jour pour mettre l'observer
      await tick()
      /*
      Ce code est nécessaire seulement si coopmaths est intégré dans un autre site pour permettre de redimensionner la fenêtre
      */
      resizeObserver = new ResizeObserver((x) => {
        const url = new URL(window.location.href)
        const iframe = url.searchParams.get('iframe')
        window.parent.postMessage(
          {
            hauteurExercice: x[0].contentRect.height,
            action: 'mathalea:resize',
            iframe,
          },
          '*',
        )
        // ou x[0].contentRect.height ou x[0].contentBoxSize[0].blockSize ou x[0].borderBoxSize[0].inlineSize ou x[0].target.scrollHeight
      })
      if (eleveSection != null) resizeObserver.observe(eleveSection)
    }
    log('fin mount eleve')
  })

  onDestroy(() => {
    log('destroy eleve')
    if (resizeObserver) resizeObserver.disconnect()
  })

  async function handleIndexChange(exoNum: number) {
    currentIndex = exoNum
    if ($globalOptions.presMode === 'un_exo_par_page') {
      await tick() // MGU attendre que le div soit affiché avant de mettre à jour la question
      const exo = $exercicesParams[exoNum]
      const questionEvent = new CustomEvent('questionDisplay', {
        detail: {
          uuid: exo.uuid,
          exoNumber: exoNum,
          questionNumber: null,
        },
      })
      document.dispatchEvent(questionEvent)
    }
  }

  function handleIndexChange_QPP(data: { currentIndex: number }) {
    currentIndex = data.currentIndex
  }

  function handleResultsChange(data: { resultsByQuestion: QuestionResult[] }) {
    resultsByQuestion = data.resultsByQuestion
  }

  async function handleQuestionsReady(data: {
    questions: (string | import('../../../lib/types').IExercice)[]
  }) {
    questions = data.questions
    resultsByQuestion = []
    await tick()
    const hauteurExercice = eleveSection?.scrollHeight ?? 0
    const url = new URL(window.location.href)
    const iframe = url.searchParams.get('iframe')
    window.parent.postMessage(
      {
        hauteurExercice,
        exercicesParams: $exercicesParams,
        action: 'mathalea:init',
        iframe,
      },
      '*',
    )
  }
</script>

<svelte:window bind:innerWidth={currentWindowWidth} />
<section
  bind:this={eleveSection}
  class="relative flex flex-col min-h-screen min-w-screen bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-corpus dark:text-coopmathsdark-corpus {$darkMode.isActive
    ? 'dark'
    : ''}"
>
  {#if $globalOptions.v === 'myriade' || $globalOptions.v === 'indices' || $globalOptions.v === 'indice'}
    <Banner {brandImagePath} {productImagePath} />
  {/if}
  <div
    class="fixed z-20 h-16 bottom-4 right-2 pointer-events-none {(typeof $globalOptions.title ===
      'string' &&
      $globalOptions.title.length === 0 &&
      $globalOptions.presMode === 'liste_exos') ||
    ($globalOptions.title != null && $globalOptions.title.length > 0)
      ? 'lg:top-8'
      : 'lg:top-20'}  lg:right-6"
  >
    <div
      class="flex flex-col-reverse lg:flex-row space-y-reverse space-y-4 lg:space-y-0 lg:space-x-4 scale-75 lg:scale-100 pointer-events-auto
      {$globalOptions.v === 'myriade' || $globalOptions.v === 'indices' || $globalOptions.v === 'indice'
        ? 'translate-y-16'
        : ''}"
    >
      <BtnZoom
        size="bx-sm md:bx-md"
        isBorderTransparent={typeof $globalOptions.title === 'string' &&
          $globalOptions.title.length > 0}
      />
    </div>
  </div>
  <div class="mb-auto">
    <div
      class="{typeof $globalOptions.title === 'string' &&
      $globalOptions.title.length === 0 &&
      $globalOptions.presMode === 'liste_exos'
        ? 'hidden'
        : 'h-[10%]'}  w-full flex flex-col justify-center items-center"
    >
      <!-- titre de la feuille -->
      {#if typeof $globalOptions.title === 'string' && $globalOptions.title.length > 0}
        <div
          class="w-full p-8 text-center text-4xl font-light {$globalOptions.recorder ===
          'capytale'
            ? 'bg-black'
            : 'bg-coopmaths-struct'} dark:bg-coopmathsdark-struct text-coopmaths-canvas dark:text-coopmathsdark-canvas"
        >
          {$globalOptions.title}
        </div>
      {/if}
      <!-- barre de navigation -->
      <div
        id="navigationHeaderID"
        class="grid justify-items-center w-full mt-4 mb-8
          {($globalOptions.presMode === 'un_exo_par_page' &&
          !$isMenuNeededForExercises) ||
        ($globalOptions.presMode === 'une_question_par_page' &&
          !$isMenuNeededForQuestions)
          ? 'border-b-2 border-coopmaths-struct'
          : 'border-b-0'}
              bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-struct dark:text-coopmathsdark-struct"
        style="grid-template-columns: repeat({$globalOptions.presMode ===
        'un_exo_par_page'
          ? $exercicesParams.length
          : questions.length}, minmax(0, 1fr));"
      >
        {#if $globalOptions.presMode === 'un_exo_par_page' && !$isMenuNeededForExercises}
          {#each $exercicesParams as paramsExercice, i (paramsExercice)}
            <div class="">
              <button
                class="relative group {currentIndex === i
                  ? 'border-b-4'
                  : 'border-b-0'} border-coopmaths-struct dark:border-coopmathsdark-struct text-coopmaths-action hover:text-coopmaths-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-lightest"
                disabled={currentIndex === i}
                on:click={() => handleIndexChange(i)}
              >
                <div
                  id="exerciseTitleID{i}"
                  class="pt-2 pb-4 px-6 text-xl font-light"
                >
                  {exerciseTitle}
                  {i + 1}
                  {#if $resultsByExercice[i] !== undefined}
                    <div
                      style="--nbPoints:{$resultsByExercice[i]
                        .bestScore}; --nbQuestions:{$resultsByExercice[i]
                        .numberOfQuestions};"
                      class="absolute bottom-0 left-0 right-0 mx-auto text-xs font-bold progressbar text-coopmaths-canvas dark:text-coopmathsdark-canvas"
                    >
                      {$resultsByExercice[i].bestScore +
                        '/' +
                        $resultsByExercice[i].numberOfQuestions}
                    </div>
                  {/if}
                </div>
                <span
                  class="absolute -bottom-1 left-1/2 w-0 h-1 bg-coopmaths-struct group-hover:w-1/2 group-hover:transition-all duration-300 ease-out group-hover:ease-in group-hover:duration-300"
                ></span>
                <span
                  class="absolute -bottom-1 right-1/2 w-0 h-1 bg-coopmaths-struct group-hover:w-1/2 group-hover:transition-all duration-300 ease-out group-hover:ease-in group-hover:duration-300"
                ></span>
              </button>
            </div>
          {/each}
        {/if}
        {#if $globalOptions.presMode === 'une_question_par_page' && !$isMenuNeededForQuestions}
          {#each questions as question, i (i + '_' + question)}
            <div class="">
              <button
                class="relative group {currentIndex === i
                  ? 'border-b-4'
                  : 'border-b-0'} border-coopmaths-struct dark:border-coopmathsdark-struct text-coopmaths-action hover:text-coopmaths-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-lightest"
                disabled={currentIndex === i}
                on:click={() => questionParPageRef.handleIndexChange(i)}
              >
                <div
                  id="questionTitleID{i}"
                  class="py-2 px-2 text-xl font-light"
                >
                  {questionTitle}
                  {i + 1}
                  <span
                    class="ml-1 text-sm"
                    class:hidden={resultsByQuestion[i] !== true}>😎</span
                  >
                  <span
                    class="ml-1 text-sm"
                    class:hidden={resultsByQuestion[i] !== false}>☹️</span
                  >
                </div>
                <span
                  class="absolute -bottom-1 left-1/2 w-0 h-1 bg-coopmaths-struct group-hover:w-1/2 group-hover:transition-all duration-300 ease-out group-hover:ease-in group-hover:duration-300"
                ></span>
                <span
                  class="absolute -bottom-1 right-1/2 w-0 h-1 bg-coopmaths-struct group-hover:w-1/2 group-hover:transition-all duration-300 ease-out group-hover:ease-in group-hover:duration-300"
                ></span>
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
    <!-- Exercices -->
    <div class="px-2 lg:px-8">
      {#if $globalOptions.presMode === 'un_exo_par_page'}
        {#each $exercicesParams as paramsExercice, i (paramsExercice)}
          <div class="flex flex-col">
            <div class={$isMenuNeededForExercises ? '' : 'hidden'}>
              <button
                class="w-full {currentIndex === i
                  ? 'bg-coopmaths-canvas-darkest'
                  : 'bg-coopmaths-canvas-dark'} hover:bg-coopmaths-canvas-darkest text-coopmaths-action hover:text-coopmaths-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-lightest"
                disabled={currentIndex === i}
                on:click={() => handleIndexChange(i)}
              >
                <div
                  id="exerciseTitleID2{i}"
                  class="flex flex-row items-center justify-center py-3 px-2 text-2xl font-bold"
                >
                  Exercice {i + 1}
                  {#if $resultsByExercice[i] !== undefined}
                    <div
                      class="ml-4 text-sm font-bold text-coopmaths-warn-dark dark:text-coopmathsdark-warn-dark"
                    >
                      {$resultsByExercice[i].numberOfPoints +
                        '/' +
                        $resultsByExercice[i].numberOfQuestions}
                    </div>
                  {:else}
                    <div class="ml-4 text-sm font-bold invisible">8/8</div>
                  {/if}
                </div>
              </button>
            </div>
            <div class={currentIndex === i ? '' : 'hidden'}>
              <Exercice
                {paramsExercice}
                indiceExercice={i}
                indiceLastExercice={$exercicesParams.length - 1}
                isCorrectionVisible={isCorrectionVisible[i]}
                toggleSidenav={() => {}}
              />
            </div>
          </div>
        {/each}
      {:else if $globalOptions.presMode === 'liste_exos'}
        <div
          id="exercises-list"
          class="p-4 columns-1 {$globalOptions.twoColumns
            ? 'md:columns-2'
            : ''}"
        >
          {#each $exercicesParams as paramsExercice, i (paramsExercice)}
            <div class="break-inside-avoid-column">
              <Exercice
                {paramsExercice}
                indiceExercice={i}
                indiceLastExercice={$exercicesParams.length - 1}
                isCorrectionVisible={isCorrectionVisible[i]}
                toggleSidenav={() => {}}
              />
            </div>
          {/each}
        </div>
      {:else if $globalOptions.presMode === 'recto' || $globalOptions.presMode === 'verso'}
        <div
          id="exercises-list"
          class="p-4 columns-1 {$globalOptions.twoColumns
            ? 'md:columns-2'
            : ''}"
        >
          {#each $exercicesParams as paramsExercice, i (paramsExercice)}
            <div class="break-inside-avoid-column">
              <Exercice
                {paramsExercice}
                indiceExercice={i}
                indiceLastExercice={$exercicesParams.length - 1}
                isCorrectionVisible={$globalOptions.presMode === 'verso'}
                toggleSidenav={() => {}}
              />
            </div>
          {/each}
        </div>
      {:else if $globalOptions.presMode === 'une_question_par_page'}
        <QuestionParPage
          bind:this={questionParPageRef}
          onQuestionsReady={handleQuestionsReady}
          onIndexChange={handleIndexChange_QPP}
          onResultsChange={handleResultsChange}
        />
      {:else if $globalOptions.presMode === 'cartes'}
        <div
          class="grid grid-flow-row gri-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-auto gap-6"
        >
          {#each questions as question, k (k + '_' + question)}
            <FlipCard>
              <div slot="question">
                <div class="p-2">
                  <div class="text-coopmaths-corpus pl-2">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html consignes[k]}
                  </div>
                  <div class="text-coopmaths-corpus pl-2">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html question}
                  </div>
                </div>
              </div>
              <div slot="answer">
                <div class="p-2">
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html mathaleaFormatExercice(corrections[k])}
                </div>
              </div>
            </FlipCard>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <Keyboard />
  {#if $globalOptions.v !== 'myriade' && $globalOptions.v !== 'indices' && $globalOptions.v !== 'indice'}
    <div
      class="flex justify-center w-full {$keyboardState.isVisible
        ? 'mt-52'
        : ''}"
    >
      <Footer2 />
    </div>
  {/if}
</section>

<style>
  /* sur une idée de Mathieu Degrange */
  .progressbar {
    background: linear-gradient(
      90deg,
      #6ebc1f 0%,
      #6ebc1f calc(100% / var(--nbQuestions) * var(--nbPoints)),
      #d43d0e calc(100% / var(--nbQuestions) * var(--nbPoints)),
      #d43d0e 100%
    );
  }
  :global(.dark) .progressbar {
    background: linear-gradient(
      90deg,
      #ff94d1 0%,
      #ff94d1 calc(100% / var(--nbQuestions) * var(--nbPoints)),
      #ff9523 calc(100% / var(--nbQuestions) * var(--nbPoints)),
      #ff9523 100%
    );
  }
</style>
