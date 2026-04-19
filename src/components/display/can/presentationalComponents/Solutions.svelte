<script lang="ts">
  import { afterUpdate, onMount } from 'svelte'
  import { mathaleaRenderDiv } from '../../../../lib/mathalea'
  import { enumeration } from '../../../../lib/outils/ecritures'
  import { canOptions } from '../../../../lib/stores/canStore'
  import type { QuestionResult } from '../../../../lib/types'
  import ButtonToggle from '../../../shared/forms/ButtonToggle.svelte'
  import NavigationButtons from './NavigationButtons.svelte'
  import Pagination from './Pagination.svelte'
  import Question from './Question.svelte'

  let current: number = 0
  export let questions: string[]
  export let consignes: string[]
  export let corrections: string[]
  export let consignesCorrections: string[]
  export let answers: string[]
  export let resultsByQuestion: QuestionResult[]
  export let time: string
  export let score: string
  const numberOfQuestions: number = questions.length
  const solutionDisplayed: boolean[] = new Array(numberOfQuestions).fill(false)

  let displayCorrection = true

  onMount(() => {
    const questionContent = document.getElementById(
      'can-solutions',
    ) as HTMLDivElement
    if (questionContent) {
      mathaleaRenderDiv(questionContent)
    }
  })

  afterUpdate(() => {
    const answersContents = document.querySelectorAll(
      '[id^="answer-container"]',
    )
    for (let i = 0; i < answersContents.length; i++) {
      const content = answersContents[i] as HTMLDivElement
      mathaleaRenderDiv(content)
    }
    const exercicesAffiches = new window.Event('exercicesAffiches', {
      bubbles: true,
    })
    document.dispatchEvent(exercicesAffiches)
  })

  function formatAnswer(question: string, answer: string) {
    if (!answer) return 'aucune'
    if (
      question.includes('checkbox') ||
      (question.includes('<input') && question.includes('checkEx'))
    ) {
      return answer.includes('\\') && !answer.includes('$')
        ? '$' + answer + '$'
        : answer
    } // Pour les QCM
    if (question.includes('<liste-deroulante')) return answer // Pour les listeDeroulante
    if (question.includes('interactive-clock'))
      return `$${answer.split('h')[0]}$ h $${answer.split('h')[1]}$` // Pour les horloges interactives
    if (question.includes('<input') && question.includes('champTexteEx'))
      return answer // Pour les champTexte
    if (question.includes('apigeomEx')) return answer // Pour le "Voir figure" des figures apigeom
    if (question.includes('divDragAndDropEx')) return answer // Pour les drag and drop
    if (question.includes('multiMathfield')) return cleanMultiMathfield(answer)
    if (question.includes('metaInteractif2d'))
      return cleanMetaInteractif2d(answer)
    return '$' + cleanFillInTheBlanks(answer, false) + '$'
  }

  function removeMathField(text: string, removeDollar: boolean = true) {
    if (typeof text !== 'string') return ''
    if (text.includes('placeholder'))
      return cleanFillInTheBlanks(text, removeDollar) // Pour les fillInTheBlanks
    if (text.includes('interactive-clock')) return removeInteractiveClock(text) // Pour les horloges interactives
    if (text.includes('<select')) return cleanSelect(text) // Pour les listeDeroulante
    const regex = /<math-field[^>]*>[^]*?<\/math-field>/g
    return text.replace(regex, ' ... ')
  }

  function cleanSelect(text: string) {
    const regex = /<select[^>]*>[^]*?<\/select>/g
    return text.replace(regex, '')
  }

  function cleanMultiMathfield(text: string) {
    if (typeof text !== 'string') return ''
    // Remplace %{champ:"valeur"} par $valeur$
    let cleaned = text.replace(
      /%\{([a-zA-Z0-9_]+):"([^"]*)"\}/g,
      (_match, champ, valeur) => {
        // Ajoute des dollars autour de la valeur, en évitant les doubles dollars
        let v = valeur.trim()
        if (!v.startsWith('$')) v = '$' + v
        if (!v.endsWith('$')) v = v + '$'
        return v
      },
    )
    // Nettoie les doubles dollars successifs
    cleaned = cleaned.replace(/\${2,}/g, '')

    return cleaned
  }

  function cleanMetaInteractif2d(text: string) {
    const saisies = JSON.parse(text)
    const reponses = Object.entries(saisies).map(
      ([key, value]) => `$${String(value)}$`,
    )
    return enumeration(reponses)
  }

  function cleanFillInTheBlanks(text: string, removeDollar: boolean = true) {
    if (typeof text !== 'string') return ''
    if (removeDollar) text = text.replace(/\$/g, '')
    return text
      .replace(/\\placeholder(\[[^\]]*\])+/g, '')
      .replace(/\{\}/g, '{...}')
  }

  function removeInteractiveClock(text: string) {
    if (typeof text !== 'string') return ''
    const regex = /<interactive-clock[^>]*\/>/g
    return text.replace(regex, '')
  }
</script>

<div
  class="w-full h-full flex flex-col items-center bg-coopmaths-canvas dark:bg-coopmathsdark-canvas
   {$canOptions.solutionsMode === 'split'
    ? 'justify-between'
    : 'justify-start'}"
>
  {#if $canOptions.solutionsMode === 'split'}
    <div class="w-full flex flex-col">
      <Pagination
        bind:current
        {numberOfQuestions}
        {resultsByQuestion}
        state={'solutions'}
      />
    </div>
    <div
      class="flex flex-col justify-center items-center font-light text-coopmaths-corpus dark:text-coopmathsdark-corpus text-3xl md:text-5xl"
    >
      {#key current}
        <Question
          consigne={consignes[current]}
          question={questions[current]}
          consigneCorrection={consignesCorrections[current]}
          correction={corrections[current]}
          mode={'correction'}
          visible={true}
          index={current}
          nextQuestion={() => {}}
        />
        {#if $canOptions.isInteractive}
          <div
            id="answer-container-{current}"
            class="text-2xl text-coopmaths-corpus dark:text-coopmathsdark-corpus font-light py-2 md:py-4"
          >
            Réponse donnée&nbsp;:&nbsp;
            <span
              id="answer-{current}"
              class="text-coopmaths-warn-800 dark:text-coopmathsdark-warn font-medium"
            >
              {@html formatAnswer(questions[current], answers[current])}
            </span>
          </div>
        {/if}
      {/key}
    </div>
    <NavigationButtons
      bind:current
      {numberOfQuestions}
      state={'solutions'}
      {resultsByQuestion}
      handleEndOfRace={() => {}}
    />
  {/if}
  {#if $canOptions.solutionsMode === 'gathered'}
    <div
      class="w-full flex justify-center items-center p-6 bg-coopmaths-struct text-coopmaths-canvas dark:bg-coopmathsdark-struct dark:text-coopmathsdark-canvas text-5xl md:text-7xl font-black"
    >
      Corrections
    </div>
    <div
      class="w-full grid grid-rows-3 md:grid-cols-3 py-4 px-4 md:px-10 mb-10"
    >
      {#if $canOptions.isInteractive}
        <div
          id="score"
          class="text-normal text-center text-coopmaths-corpus dark:text-coopmathsdark-corpus font-light"
        >
          Score : <span
            class="text-coopmaths-warn-1000 dark:text-coopmathsdark-warn font-bold"
            >{score}</span
          >
        </div>
      {/if}
      <div
        id="score"
        class="text-normal text-center text-coopmaths-corpus dark:text-coopmathsdark-corpus font-light"
      >
        Temps : <span
          class="text-coopmaths-warn-1000 dark:text-coopmathsdark-warn font-bold"
          >{time}</span
        >
      </div>
      <div class="flex justify-center text-center">
        <ButtonToggle
          bind:value={displayCorrection}
          titles={[
            'Correction uniquement des mauvaises réponses',
            'Correction de toutes les questions',
          ]}
        />
      </div>
    </div>
    <ol
      class="w-full list-none list-inside text-base flex flex-row flex-wrap p-4 md:p-10 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
      id="can-solutions"
    >
      {#each [...Array(numberOfQuestions).keys()] as i}
        <li class="break-inside-avoid-column mx-2 min-w-[32%]">
          <div class="flex flex-row items-center justify-start">
            <div
              class="text-lg text-coopmaths-struct dark:text-coopmathsdark-struct font-bold"
            >
              Question {i + 1}
            </div>
            <div class={$canOptions.isInteractive ? 'flex text-xl' : 'hidden'}>
              {#if resultsByQuestion[i]}
                <button
                  type="button"
                  aria-label="Afficher la correction"
                  on:click={() => {
                    solutionDisplayed[i] = !solutionDisplayed[i]
                  }}
                >
                  <i
                    class="pl-2 bx bxs-check-square text-coopmaths-warn-800 dark:text-green-500"
                  ></i>
                </button>
              {:else}
                <i
                  class="pl-2 bx bxs-x-square text-red-500 dark:text-coopmathsdark-warn"
                ></i>
              {/if}
            </div>
          </div>
          <div class="flex flex-col">
            <div
              class="p-2 text-pretty text-coopmaths-corpus dark:text-coopmathsdark-corpus"
              hidden={!solutionDisplayed[i] &&
                resultsByQuestion[i] &&
                displayCorrection}
            >
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html removeMathField(questions[i], false)}
            </div>
            <div
              class="p-2 text-pretty bg-coopmaths-warn-200 dark:bg-coopmathsdark-warn-lightest text-coopmaths-corpus dark:text-coopmathsdark-corpus-darkest"
              hidden={!solutionDisplayed[i] &&
                resultsByQuestion[i] &&
                displayCorrection}
            >
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html consignesCorrections[i]}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html corrections[i]}
            </div>
            <div
              id="answer-container-{i}"
              class="{$canOptions.isInteractive &&
              (!resultsByQuestion[i] || !displayCorrection)
                ? 'flex text-coopmaths-corpus dark:text-coopmathsdark-corpus font-light py-2 md:py-4'
                : 'hidden'} "
            >
              Réponse donnée&nbsp;:&nbsp;
              <span
                id="answer-{i}"
                class="text-coopmaths-warn-1000 dark:text-coopmathsdark-warn font-medium"
              >
                {@html formatAnswer(questions[i], answers[i])}
              </span>
            </div>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</div>
